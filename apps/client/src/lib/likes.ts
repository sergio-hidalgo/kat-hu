/**
 * Like counts, stored in Supabase rather than Sanity so that reader traffic
 * never touches the CMS. Isomorphic: the build uses it to pre-render counts,
 * the browser uses it to refresh them and to record a click.
 *
 * Writes go through the `like_post` / `unlike_post` RPCs. The table itself is
 * read-only to the anon role, so the only possible mutation is +1/-1 on one row.
 */
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseKey = import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/** False when Supabase is unconfigured — the site still builds and renders. */
export const likesEnabled = Boolean(supabaseUrl && supabaseKey);

export type LikeCounts = Record<string, number>;

function headers(): Record<string, string> {
  return {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Every known count, keyed by Sanity `_id`. Posts with no row yet are absent,
 * so callers treat a missing key as zero.
 *
 * Never throws: a Supabase outage degrades to "counts unavailable", it does not
 * fail the build or blank the page.
 */
export async function getLikeCounts(): Promise<LikeCounts> {
  if (!likesEnabled) return {};

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/post_likes?select=post_id,likes`,
      { headers: headers() },
    );
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }
    const rows: Array<{ post_id: string; likes: number }> = await response.json();
    return Object.fromEntries(rows.map((row) => [row.post_id, row.likes]));
  } catch (error) {
    console.warn('[likes] could not read counts, falling back to zero:', error);
    return {};
  }
}

async function callRpc(fn: 'like_post' | 'unlike_post', postId: string) {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ p_post_id: postId }),
  });
  if (!response.ok) {
    throw new Error(`${fn} failed: ${response.status} ${response.statusText}`);
  }
  // The RPC returns the new total, so the UI never has to guess.
  return (await response.json()) as number;
}

export const likePost = (postId: string) => callRpc('like_post', postId);
export const unlikePost = (postId: string) => callRpc('unlike_post', postId);

export interface Rankable {
  id: string;
  date: string;
  likes: number;
}

/**
 * Split posts into the three most-liked and the remainder by recency.
 * Shared by the build and the browser so both orderings always agree.
 */
export function rankPosts<T extends Rankable>(
  items: T[],
  featuredCount = 3,
): { featured: T[]; rest: T[] } {
  const byDate = (a: T, b: T) => b.date.localeCompare(a.date);
  const byLikes = (a: T, b: T) => b.likes - a.likes || byDate(a, b);

  const featured = [...items].sort(byLikes).slice(0, featuredCount);
  const featuredIds = new Set(featured.map((item) => item.id));
  const rest = items.filter((item) => !featuredIds.has(item.id)).sort(byDate);

  return { featured, rest };
}
