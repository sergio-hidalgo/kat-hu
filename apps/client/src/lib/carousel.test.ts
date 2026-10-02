import { describe, expect, it } from 'vitest';
import { cardsPerView, currentPage, nextPage, pageCount } from './carousel';

describe('carousel', () => {
  it('counts the cards that fit, counting the gap between them', () => {
    // 3 cards of 7 units with 1-unit gaps in a 23-unit track.
    expect(cardsPerView({ trackWidth: 23, cardWidth: 7, pitch: 8 })).toBe(3);
    expect(cardsPerView({ trackWidth: 23, cardWidth: 23, pitch: 24 })).toBe(1);
  });

  it('pages by the cards in view', () => {
    expect(pageCount(4, 3)).toBe(2);
    expect(pageCount(6, 3)).toBe(2);
    expect(pageCount(3, 3)).toBe(1);
  });

  it('reads the last page at the end of the track, even when it is clamped short', () => {
    // 4 cards, 3 in view, pitch 8: the second page would start at 24 but the track ends at 8.
    expect(currentPage({ scrollLeft: 8, maxScroll: 8, step: 24, pages: 2 })).toBe(1);
    expect(currentPage({ scrollLeft: 0, maxScroll: 8, step: 24, pages: 2 })).toBe(0);
  });

  it('wraps from the last page to the first', () => {
    expect(nextPage(0, 3)).toBe(1);
    expect(nextPage(2, 3)).toBe(0);
    expect(nextPage(0, 1)).toBe(0);
  });
});
