/**
 * Guide §06's botanical borders, as CSS masks painted with `currentColor`.
 *
 * Two drawings, both the owner's, traced from `references/` (spec 05c,
 * redrawn 2026-09-27): `edge-plants.svg` (from `flower_profile.png`) closes
 * every band in the colour of the band that follows, and `edge-footer.svg`
 * (from `animals_profile.png` — plants with a dog, a rabbit and a cat) closes
 * the page above the footer. The colour comes from a `text-*` token, so one
 * drawing serves every transition.
 *
 * Masks rather than inlined SVG: the files are 42 KB and 58 KB, and a landing
 * carries up to eight edges, so one cached request each beats repeating the
 * paths in the HTML.
 */

/** The plants, repeated along the bottom at the edge's height (guide §06). */
export const PLANTS_LAYER = 'center bottom / auto 100% repeat-x';

/** The animals once, centred, at the edge's height. */
export const FOOTER_LAYER = 'center bottom / auto 100% no-repeat';

/**
 * The animal strip's width over its height (its viewBox, 2164 × 255). Half of
 * it, times the edge's height, is how far the strip reaches either side of
 * the centre.
 */
export const FOOTER_ASPECT = 2164 / 255;

/**
 * How far the animal strip sits off the centre. Nothing on a wide screen; a
 * narrow one crops the strip, and the three animals are not in its middle (the
 * rabbit is), so `theme.css` moves it left there (owner, 2026-10-06) for the
 * three to look centred.
 */
const SHIFT = 'var(--edge-shift, 0px)';

/**
 * A mask that is opaque where the plants may show — the two sides — and clear
 * over the animal strip, which has its own plants; without it the two
 * drawings' foliage would pile up in the middle. (`black` only means opaque: a
 * mask reads alpha, never colour.)
 */
export function sidesOnly(aspect: number): string {
  const left = `calc(50% + ${SHIFT} - ${(aspect / 2).toFixed(3)} * var(--edge-height))`;
  const right = `calc(50% + ${SHIFT} + ${(aspect / 2).toFixed(3)} * var(--edge-height))`;
  return `linear-gradient(to right, black ${left}, transparent ${left}, transparent ${right}, black ${right})`;
}

/**
 * A solid strip along the bottom, the ground line's own thickness, under every
 * edge. A traced ground line is anti-aliased and not perfectly straight, so on
 * its own it lets a hairline of the band behind show through at the seam; the
 * strip makes every silhouette land flush on the next band.
 */
export const GROUND_LAYER = 'linear-gradient(black, black) center bottom / 100% 6% no-repeat';

/** A `style` value for the mask layers, prefixed for Safari before 15.4. */
export function maskStyle(layers: Array<[url: string, layer: string]>): string {
  const value = layers.map(([url, layer]) => `url("${url}") ${layer}`).join(', ');
  return `-webkit-mask: ${value}; mask: ${value};`;
}

/**
 * A band's edge: the plants, repeated, over the ground strip.
 *
 * The mask waits in a custom property: a `url()` is only fetched when a property
 * uses it, and `lib/flora-boot.ts` (and, for the first edge on a page, a rule in
 * `theme.css`) turns it into a `mask` when the edge is near the screen.
 */
export function plantsMaskStyle(plants: string): string {
  return `--edge-mask: ${GROUND_LAYER}, url("${plants}") ${PLANTS_LAYER};`;
}

/**
 * The closing edge: the animal strip in the middle, the plants only on the
 * sides, the ground strip under both. Layers composite from the bottom up —
 * the plants, cut to the sides (`intersect`), then the animals and the ground
 * added on top (`add`).
 *
 * The images are *deferred*: this edge is the last thing on the page, so its
 * files wait for the page to load and for the edge to come near the screen.
 */
export function footerMaskStyle(footer: string, plants: string): string {
  const image = `linear-gradient(black, black), url("${footer}"), ${sidesOnly(FOOTER_ASPECT)}, url("${plants}")`;
  const position = `center bottom, calc(50% + ${SHIFT}) bottom, 0 0, center bottom`;
  const size = '100% 6%, auto 100%, 100% 100%, auto 100%';
  const repeat = 'no-repeat, no-repeat, no-repeat, repeat-x';
  return [
    // Held back in a custom property so the two files are not requested until
    // `lib/flora-boot.ts` switches the edge on (the rule is in `theme.css`).
    `--edge-mask-image: ${image}`,
    `-webkit-mask-position: ${position}`,
    `mask-position: ${position}`,
    `-webkit-mask-size: ${size}`,
    `mask-size: ${size}`,
    `-webkit-mask-repeat: ${repeat}`,
    `mask-repeat: ${repeat}`,
    '-webkit-mask-composite: source-over, source-over, source-in',
    'mask-composite: add, add, intersect',
  ].join('; ') + ';';
}
