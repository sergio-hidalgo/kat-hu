import { getLikeCounts, type LikeCounts } from './likes';
import { createTtlCache } from './ttl-cache';

/**
 * The like totals as the *server* reads them, for the first paint of `/drops`
 * and the landing's drops: a short cache, because a Supabase round trip on every
 * request was most of what `/drops` still spent after Sanity was cached
 * (about 90 ms of its warm 90).
 *
 * Ten seconds fresh, a minute at most stale. It never hides a like: the page's
 * script reads the totals again in the browser (`likes.ts`, uncached, the
 * module the browser bundle uses) and the heart a reader has pressed is kept in
 * their own browser, so a count a few seconds old only shows for a moment.
 *
 * Off in development and in tests, like the Sanity cache.
 */
const enabled = !import.meta.env.DEV;

const cache = createTtlCache({ ttlMs: 10_000, maxStaleMs: 60_000 });

export function getLikeCountsCached(): Promise<LikeCounts> {
  if (!enabled) return getLikeCounts();
  return cache.get('counts', getLikeCounts);
}
