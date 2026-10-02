/**
 * The owner's flower drawings as vectors (spec 05c), traced from the PNGs in
 * `references/` so they can be recoloured by token rather than shipped once
 * per colour. Two of guide §06's three botanical languages:
 *
 * - **Siluetas planas** — `process-1..3`: one flat violet silhouette each, the
 *   large icons of the process steps. Small (≈5 KB), so they are inlined.
 * - **Línea fina** — `line-*`: a line drawing over a faint wash of the same
 *   colour (the wash is the silhouette at 22% opacity), for the margins of a
 *   band. 38–96 KB each, so each is a cached file used as a CSS mask over
 *   `currentColor`, like the botanical edges: the mask keeps the wash's 22%,
 *   and a browser does not fetch the mask of a hidden element, so a phone —
 *   where these are `hidden` — never downloads them. (An `<svg><use>` would
 *   have been fetched even when hidden: 214 KB on a phone, spec 05c.)
 *
 * The third language, the *flor prensada*, is a photograph of a real pressed
 * flower — the palette's one exception — and stays a raster.
 *
 * Every drawing is decoration: `aria-hidden`, never a target, and never
 * behind a paragraph (guide §06).
 */
import flower from '../../assets/brand/flora-line-flower.svg?url';
import leaf from '../../assets/brand/flora-line-leaf.svg?url';
import daisy from '../../assets/brand/flora-line-daisy.svg?url';
import sprig from '../../assets/brand/flora-line-sprig.svg?url';

export const LINE_STUDIES = {
  /** A four-petalled flower (from `lillac_flower_design_decorator.png`). */
  flower: { url: flower, viewBox: '0 0 640 640' },
  /** A pinnate leaf (from `lillac_leave_design_decorator.png`). */
  leaf: { url: leaf, viewBox: '0 0 560 700' },
  /** A daisy (from `yellow_daisy_design_decorator.png`). */
  daisy: { url: daisy, viewBox: '0 0 560 700' },
  /** A sprig of small blossoms (from `yellow_umbrella_design_decorator.png`). */
  sprig: { url: sprig, viewBox: '0 0 560 700' },
} as const;

export type LineStudy = keyof typeof LINE_STUDIES;

/** The drawing whole, centred in its box. */
export const LINE_LAYER = 'center / contain no-repeat';

/** The box's aspect ratio from the drawing's viewBox, as a CSS value. */
export function aspectRatio(viewBox: string): string {
  const [, , width, height] = viewBox.split(' ');
  return `${width} / ${height}`;
}

/** Guide §06: the línea fina is drawn in Glicina. */
export const LINE_TONE = 'text-wisteria';

/** Guide §07, *Panel de proceso*: the step silhouettes are violet on the Panel. */
export const PROCESS_TONE = 'text-violet';

/** The process drawings, cycled by step position. */
export const PROCESS_COUNT = 3;

export function processIndex(position: number): 1 | 2 | 3 {
  return ((position % PROCESS_COUNT) + 1) as 1 | 2 | 3;
}
