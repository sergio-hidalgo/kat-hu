/**
 * The landing's colour rhythm (guide §03, spec 05c; the owner's sequence of
 * 2026-09-28): after the hero, the bands come in two groups — who the
 * florapeuta is and how a session works on **Lavanda**, then the sessions
 * and what families say on **Crema** — and a botanical
 * silhouette is drawn only where the colour changes: over the hero's foot,
 * and between the two groups. Bands of one colour run on with no edge between
 * them.
 *
 * Each block has a fixed tone (`BLOCK_TONE`). Whether an edge shows, and
 * whether a band keeps room at its foot for the next band's edge, depends on
 * the neighbours that **actually render**: a block switched off by a flag, or
 * one that hides itself with nothing to show (no testimonials, no posts, the
 * shop before spec 11), leaves no element behind, so the rules are sibling
 * selectors over the rendered `<section>`s and hiding a block reflows them.
 *
 * Class strings written out in full, not built from `BLOCK_TONE`: Tailwind v4
 * generates only the classes it can read in the source. `rhythm.test.ts`
 * holds the literals to the table.
 */
import type { BlockId } from '@kat-hu/contracts';

export type Tone = 'lavender' | 'cream';

/** The hero is its own gradient; every other block sits in one tone. */
export const BLOCK_TONE: Record<Exclude<BlockId, 'hero'>, Tone> = {
  'about-teaser': 'lavender',
  'how-it-works': 'lavender',
  services: 'cream',
  testimonials: 'cream',
  'blog-teaser': 'cream',
  'shop-teaser': 'cream',
};

/** The two groups as selectors, exactly as they appear in `RHYTHM`. */
export const LAVENDER = ':is([data-block=about-teaser],[data-block=how-it-works])';
export const CREAM =
  ':is([data-block=services],[data-block=testimonials],[data-block=blog-teaser],[data-block=shop-teaser])';

export const RHYTHM = [
  // Surfaces.
  '[&>:is([data-block=about-teaser],[data-block=how-it-works])]:bg-lavender',
  '[&>:is([data-block=services],[data-block=testimonials],[data-block=blog-teaser],[data-block=shop-teaser])]:bg-cream',

  // An edge is the band's own colour, drawn over the band above…
  '[&>:is([data-block=about-teaser],[data-block=how-it-works])_[data-edge]]:text-lavender',
  '[&>:is([data-block=services],[data-block=testimonials],[data-block=blog-teaser],[data-block=shop-teaser])_[data-edge]]:text-cream',
  // …and only where the colour changes: after the hero, and between groups.
  '[&>section_[data-edge]]:hidden',
  '[&>[data-block=hero]+section_[data-edge]]:block',
  // Portrait phones from 380px and portrait tablets have every edge 50% taller
  // through `--edge-height` itself (`theme.css`, owner, 2026-10-06 and 07).
  '[&>:is([data-block=about-teaser],[data-block=how-it-works])+:is([data-block=services],[data-block=testimonials],[data-block=blog-teaser],[data-block=shop-teaser])_[data-edge]]:block',
  '[&>:is([data-block=services],[data-block=testimonials],[data-block=blog-teaser],[data-block=shop-teaser])+:is([data-block=about-teaser],[data-block=how-it-works])_[data-edge]]:block',

  // Two bands of one colour sit closer (owner, 2026-09-28): 5/8 of the
  // rhythm at the foot of the first and at the head of the second — first
  // halved, then a quarter back — so they read as one group. Joins between
  // groups keep the full distance.
  '[&>:is([data-block=about-teaser],[data-block=how-it-works]):has(+:is([data-block=about-teaser],[data-block=how-it-works]))]:pb-[calc(clamp(4rem,7vw,7.5rem)*5/8)]',
  '[&>:is([data-block=services],[data-block=testimonials],[data-block=blog-teaser],[data-block=shop-teaser]):has(+:is([data-block=services],[data-block=testimonials],[data-block=blog-teaser],[data-block=shop-teaser]))]:pb-[calc(clamp(4rem,7vw,7.5rem)*5/8)]',
  '[&>:is([data-block=about-teaser],[data-block=how-it-works])+:is([data-block=about-teaser],[data-block=how-it-works])]:pt-[calc(clamp(4rem,7vw,7.5rem)*5/8)]',
  '[&>:is([data-block=services],[data-block=testimonials],[data-block=blog-teaser],[data-block=shop-teaser])+:is([data-block=services],[data-block=testimonials],[data-block=blog-teaser],[data-block=shop-teaser])]:pt-[calc(clamp(4rem,7vw,7.5rem)*5/8)]',

  // Room at a band's foot for the edge drawn over it: before a change of
  // colour, and before the footer's closing edge.
  '[&>:is([data-block=about-teaser],[data-block=how-it-works]):has(+:is([data-block=services],[data-block=testimonials],[data-block=blog-teaser],[data-block=shop-teaser]))]:pb-[calc(clamp(4rem,7vw,7.5rem)+var(--edge-height))]',
  '[&>:is([data-block=services],[data-block=testimonials],[data-block=blog-teaser],[data-block=shop-teaser]):has(+:is([data-block=about-teaser],[data-block=how-it-works]))]:pb-[calc(clamp(4rem,7vw,7.5rem)+var(--edge-height))]',
  '[&>section:last-child:not([data-block=hero])]:pb-[calc(clamp(4rem,7vw,7.5rem)+var(--edge-height))]',
].join(' ');
