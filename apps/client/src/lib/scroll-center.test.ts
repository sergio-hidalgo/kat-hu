import { describe, expect, it } from 'vitest';
import { FOOT_AIR, landingScrollTop } from './scroll-center';

describe('landingScrollTop', () => {
  it('puts the bottom of the edge a little above the bottom of the screen', () => {
    // A band from 2000 whose edge ends at 2750, on an 820px screen: 2750 + the air − 820.
    expect(landingScrollTop({ top: 2000, foot: 2750, viewportHeight: 820, maxScroll: 9000 })).toBe(1930 + FOOT_AIR);
  });

  it('starts a band taller than the screen at its top, keeping its heading', () => {
    expect(landingScrollTop({ top: 2000, foot: 3200, viewportHeight: 820, maxScroll: 9000 })).toBe(2000);
  });

  it('never scrolls outside the page', () => {
    expect(landingScrollTop({ top: 100, foot: 500, viewportHeight: 820, maxScroll: 9000 })).toBe(0);
    expect(landingScrollTop({ top: 8900, foot: 9600, viewportHeight: 820, maxScroll: 8500 })).toBe(8500);
  });
});
