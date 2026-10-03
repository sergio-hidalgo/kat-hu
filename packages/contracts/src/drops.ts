/**
 * The kinds of drop (spec 05d). The Studio offers these four, the client reads
 * them and filters by them, so the ids live here, once. The id is what is
 * stored in Sanity; the label is what the reader sees.
 */
export const DROP_TYPES = ['post', 'curiosidad', 'consejo', 'truco'] as const;

export type DropType = (typeof DROP_TYPES)[number];

export const DEFAULT_DROP_TYPE: DropType = 'post';

export const DROP_TYPE_LABELS: Record<DropType, string> = {
  post: 'Post',
  curiosidad: 'Curiosidad',
  consejo: 'Consejo',
  truco: 'Truco',
};

export function isDropType(value: unknown): value is DropType {
  return typeof value === 'string' && (DROP_TYPES as readonly string[]).includes(value);
}
