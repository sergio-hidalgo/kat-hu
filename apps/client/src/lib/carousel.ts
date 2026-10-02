/**
 * The arithmetic of the testimonials carousel: which page the track is on, and
 * which one comes next. A page is as many cards as fit the screen at once; the
 * track scrolls a page at a time, so the last page may be shorter and the
 * browser clamps its position to the end of the track.
 */

/** Cards that fit the track at once, from the distance between two cards. */
export function cardsPerView({
  trackWidth,
  cardWidth,
  pitch,
}: {
  trackWidth: number;
  cardWidth: number;
  pitch: number;
}): number {
  const gap = pitch - cardWidth;
  return Math.max(1, Math.round((trackWidth + gap) / pitch));
}

export function pageCount(cards: number, perView: number): number {
  return Math.max(1, Math.ceil(cards / perView));
}

/** The page the track shows. At the very end it is the last one, even if clamped short of its start. */
export function currentPage({
  scrollLeft,
  maxScroll,
  step,
  pages,
}: {
  scrollLeft: number;
  maxScroll: number;
  step: number;
  pages: number;
}): number {
  if (pages <= 1) return 0;
  if (scrollLeft >= maxScroll - 2) return pages - 1;
  return Math.min(Math.max(Math.round(scrollLeft / step), 0), pages - 1);
}

/** The page after this one, wrapping from the last to the first. */
export function nextPage(page: number, pages: number): number {
  return (page + 1) % Math.max(pages, 1);
}
