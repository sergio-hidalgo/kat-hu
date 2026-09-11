/**
 * A link that is an action rather than a word in running prose — *Conoce la
 * historia de kathu*, *Ver todos los drops*, *Cómo funciona* (spec 05). Styled
 * as guide §2.3's prose link, but with a 44px target (INT-01): a bare inline
 * anchor is only its line box.
 *
 * Class strings, like `field.ts` and `header.ts`: Tailwind v4 scans `.ts`.
 */
const base =
  'inline-flex min-h-11 items-center font-body text-sm font-semibold underline decoration-1 underline-offset-4 transition-colors duration-fast hover:decoration-2';

/** On Shell or Cloud. */
export const TEXT_LINK = `${base} text-violet-700 hover:text-violet-600`;

/** Over a photograph under the violet-900 tint. */
export const TEXT_LINK_ON_DARK = `${base} text-cloud`;
