/**
 * Where to scroll so a band lands whole on the screen (owner, 2026-09-29): the
 * hero's *¿Cómo funciona?* lands on the process band with the bottom of the
 * botanical edge over its foot — drawn by the next band — a little above the
 * bottom of the screen (`FOOT_AIR`), so the whole edge shows with the next
 * band's colour under it, and the band sits above, rather
 * than with its top under the bar and the band above still in view.
 *
 * A band taller than the screen cannot be seen whole, so it starts at its top
 * instead of losing its heading. Either way the answer stays inside the
 * page's scroll range.
 */
/**
 * Room left below the edge, in pixels, so the next band's colour shows under
 * the silhouette and the edge does not sit hard against the screen's bottom
 * (owner, 2026-10-01).
 */
export const FOOT_AIR = 64;

export function landingScrollTop({
  top,
  foot,
  viewportHeight,
  maxScroll,
}: {
  /** The band's top in document coordinates. */
  top: number;
  /** Where the screen's bottom should be: the bottom of the edge over the band's foot. */
  foot: number;
  viewportHeight: number;
  maxScroll: number;
}): number {
  const target = foot + FOOT_AIR - top <= viewportHeight ? foot + FOOT_AIR - viewportHeight : top;
  return Math.round(Math.min(Math.max(target, 0), Math.max(maxScroll, 0)));
}
