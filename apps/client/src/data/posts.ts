import { DEFAULT_DROP_TYPE, isDropType, type DropType } from '@kat-hu/contracts';
import type { PortableTextNode, SanityImage } from '../lib/sanity';
import { cachedFetch } from '../lib/sanity-cache';

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
  /** The kind of drop; `post` when the Studio has none or an unknown one. */
  dropType: DropType;
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
  dropType,
  excerpt,
  "date": coalesce(publishedAt, _createdAt),
  mainImage,
  body
`;

const LIST_QUERY = /* groq */ `
  *[_type == $type && defined(slug.current)]
    | order(coalesce(publishedAt, _createdAt) desc) {${POST_FIELDS}}
`;

/** How many posts the landing's blog teaser shows (spec 05). */
export const LATEST_COUNT = 3;

const LATEST_QUERY = /* groq */ `
  *[_type == $type && defined(slug.current)]
    | order(coalesce(publishedAt, _createdAt) desc) [0...${LATEST_COUNT}] {${POST_FIELDS}}
`;

const DETAIL_QUERY = /* groq */ `
  *[_type == $type && slug.current == $slug][0] {${POST_FIELDS}}
`;

/**
 * Plain-text opening of a Portable Text body, for a missing excerpt.
 * Exported so the cut-at-a-word-boundary rule can be tested directly.
 */
export function deriveExcerpt(body: PortableTextNode[] = [], limit = 160): string {
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
    dropType: isDropType(raw.dropType) ? raw.dropType : DEFAULT_DROP_TYPE,
    excerpt: raw.excerpt?.trim() || deriveExcerpt(raw.body),
    body: raw.body ?? [],
  };
}

/** Every published post, newest first. */
export async function getAllPosts(): Promise<Post[]> {
  const posts = await cachedFetch<Post[]>(LIST_QUERY, { type: DOC_TYPE });
  return posts.map(normalise);
}

/** The newest few published posts, for the landing — not the whole list. */
export async function getLatestPosts(): Promise<Post[]> {
  const posts = await cachedFetch<Post[]>(LATEST_QUERY, { type: DOC_TYPE });
  return (posts ?? []).map(normalise);
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const post = await cachedFetch<Post | null>(DETAIL_QUERY, {
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
