import {
  sanityClient,
  type PortableTextNode,
  type SanityImage,
} from '../lib/sanity';

/**
 * The document type this site reads from Sanity. Change it here only —
 * it must match `apps/studio/schemaTypes/post.ts`.
 */
const DOC_TYPE = 'post';

export interface Post {
  /**
   * Sanity document `_id`. Stable across slug edits, so it is the key the
   * Supabase like counts are stored against.
   */
  id: string;
  /** URL segment under /drops — from the Studio's `slug` field. */
  slug: string;
  title: string;
  /** Editor-written summary; falls back to the opening of `body`. */
  excerpt: string;
  /** ISO date, used for ordering and <time datetime>. */
  date: string;
  mainImage?: SanityImage;
  body: PortableTextNode[];
}

/** Fields every query selects, so list and detail stay in sync. */
const POST_FIELDS = /* groq */ `
  "id": _id,
  "slug": slug.current,
  title,
  excerpt,
  "date": coalesce(publishedAt, _createdAt),
  mainImage,
  body
`;

const LIST_QUERY = /* groq */ `
  *[_type == $type && defined(slug.current)]
    | order(coalesce(publishedAt, _createdAt) desc) {${POST_FIELDS}}
`;

const DETAIL_QUERY = /* groq */ `
  *[_type == $type && slug.current == $slug][0] {${POST_FIELDS}}
`;

/** Plain-text opening of a Portable Text body, for a missing excerpt. */
function deriveExcerpt(body: PortableTextNode[] = [], limit = 160): string {
  const text = body
    .filter((block) => block._type === 'block')
    .flatMap((block) => (Array.isArray(block.children) ? block.children : []))
    .map((child: { text?: string }) => child?.text ?? '')
    .join('')
    .trim();

  if (text.length <= limit) return text;
  return `${text.slice(0, text.lastIndexOf(' ', limit)).trimEnd()}…`;
}

function normalise(raw: Post): Post {
  return {
    ...raw,
    excerpt: raw.excerpt?.trim() || deriveExcerpt(raw.body),
    body: raw.body ?? [],
  };
}

/** Every published post, newest first. */
export async function getAllPosts(): Promise<Post[]> {
  const posts = await sanityClient.fetch<Post[]>(LIST_QUERY, { type: DOC_TYPE });
  return posts.map(normalise);
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const post = await sanityClient.fetch<Post | null>(DETAIL_QUERY, {
    type: DOC_TYPE,
    slug,
  });
  return post ? normalise(post) : null;
}

export function formatDate(date: string, locale = 'en-GB'): string {
  return new Date(date).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
