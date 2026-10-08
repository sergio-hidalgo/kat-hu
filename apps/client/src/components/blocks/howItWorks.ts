/**
 * The columns each step of `block:how-it-works` takes, from how many steps the
 * owner wrote (spec 05b), so a row of steps fills the grid: one alone spans
 * it, two halve it, three are thirds, and four or more go in rows of four.
 * From `lg` only: below it the steps are the slides of a carousel (spec 05e),
 * where a column span would mean nothing. Classes are written out whole so
 * Tailwind sees them.
 */
export function stepSpan(count: number): string {
  if (count <= 1) return 'lg:col-span-12';
  if (count === 2) return 'lg:col-span-6';
  if (count === 3) return 'lg:col-span-4';
  return 'lg:col-span-3';
}
