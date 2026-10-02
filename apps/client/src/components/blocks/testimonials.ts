/**
 * Where each testimonial card sits (spec 05c). Three cards fill a row from
 * `lg`; one or two would sit in the left third under a centred heading, so a
 * short row starts where it centres on the grid instead. Spans stay the
 * cards' own — only the starting column moves (I-001).
 */
const SPAN = 'col-span-12 md:col-span-6 lg:col-span-4';

export function testimonialPlace(count: number, index: number): string {
  if (count === 1) return `${SPAN} md:col-start-4 lg:col-start-5`;
  if (count === 2) return `${SPAN} ${index === 0 ? 'lg:col-start-3' : 'lg:col-start-7'}`;
  return SPAN;
}

/**
 * More testimonials than a desktop row holds turn the row into a carousel
 * (owner, 2026-10-01); up to this many it stays the static row above.
 */
export const CAROUSEL_FROM = 3;
