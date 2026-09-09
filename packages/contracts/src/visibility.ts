/**
 * The registries of things the owner can switch on and off from `/admin`.
 *
 * A block or page that is not registered here cannot be hidden, so it cannot
 * ship (`specs/README.md`). This package is the single definition: the admin
 * UI lists these entries, the Astro middleware reads their keys, and
 * `public.site_visibility.key` in Supabase stores exactly the string
 * `visibilityKey()` produces.
 *
 * Both registries are deliberately empty here — spec 04 builds the shape, and
 * the specs that build the surfaces fill them in:
 *
 * | Registry | Filled by                                           |
 * | :------- | :-------------------------------------------------- |
 * | `BLOCKS` | spec 05 (landing blocks)                            |
 * | `PAGES`  | specs 07 (`page:sobre-kathu`), 08 (`page:drops`),    |
 * |          | 09 (`page:cuenta`), 11 (`page:tienda`)              |
 */

/** The two kinds of switchable thing. `/admin` itself is never switchable. */
export type VisibilityKind = 'block' | 'page';

export interface VisibilityEntry {
  /**
   * Stable, English, kebab-case. This is half of a database primary key, so
   * it is never renamed — a rename is a migration, not an edit.
   */
  readonly id: string;
  /** What the owner reads in `/admin`. Spanish, like all interface copy. */
  readonly label: string;
  /**
   * What the site does before anyone has touched the switch — that is, when
   * `site_visibility` has no row for this key yet.
   */
  readonly defaultVisible: boolean;
}

/**
 * `id` is a database key, so it is restricted to what a URL segment and a
 * Postgres text key can both carry without quoting.
 */
export const VISIBILITY_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Landing-page blocks (`/`), in the order they appear. Spec 05 fills this. */
export const BLOCKS: readonly VisibilityEntry[] = [];

/** Whole routes. Hiding one makes it 404 (spec 10). Specs 07/08/09/11 fill this. */
export const PAGES: readonly VisibilityEntry[] = [];

/**
 * The `site_visibility.key` for one entry: `block:hero`, `page:tienda`.
 * The only place this string is built, so the table, the admin UI and the
 * middleware cannot disagree about its shape.
 */
export function visibilityKey(kind: VisibilityKind, id: string): string {
  return `${kind}:${id}`;
}

/** Every registered key, both kinds — the full set `/admin` can toggle. */
export function allVisibilityKeys(): string[] {
  return [
    ...BLOCKS.map((block) => visibilityKey('block', block.id)),
    ...PAGES.map((page) => visibilityKey('page', page.id)),
  ];
}
