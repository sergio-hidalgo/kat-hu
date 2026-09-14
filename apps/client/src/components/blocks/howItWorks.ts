/**
 * The columns each step of `block:how-it-works` takes, from how many steps the
 * owner wrote (spec 05b), so a row of steps fills the grid: one alone spans
 * it, two halve it, three are thirds, and four or more go in rows of four from
 * `lg` (two per row from `md`). Classes are written out whole so Tailwind sees
 * them.
 */
export function stepSpan(count: number): string {
  if (count <= 1) return 'col-span-12';
  if (count === 2) return 'col-span-12 md:col-span-6';
  if (count === 3) return 'col-span-12 md:col-span-4';
  return 'col-span-12 md:col-span-6 lg:col-span-3';
}
