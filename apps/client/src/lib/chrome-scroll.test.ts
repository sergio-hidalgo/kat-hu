import { describe, expect, it } from 'vitest';
import {
  AT_TOP,
  hideLineFor,
  nextAnchor,
  nextChromeState,
  REVEAL_PX,
  TOP_THRESHOLD_PX,
  type ChromeState,
} from './chrome-scroll';

/**
 * The whole policy of the header lives in these two functions, so this is the
 * only place the thresholds are exercised. The header's script does nothing
 * but hand them the scroll position and write the answer onto an attribute.
 */

const VIEWPORT = 800;

/**
 * Replays a sequence of scroll positions the way the script does — feeding
 * each answer back in as `previous`, and keeping the anchor with `nextAnchor`
 * — and returns the state after the last one.
 */
function scroll(positions: number[], from: ChromeState = AT_TOP): ChromeState {
  let previous = from;
  let lastY = 0;

  for (const scrollY of positions) {
    previous = nextChromeState({
      scrollY,
      viewportHeight: VIEWPORT,
      previous,
      lastY,
    });
    lastY = nextAnchor({ scrollY, band: previous.band, lastY });
  }

  return previous;
}

describe('nextChromeState', () => {
  it('is at the top until 40px of scroll', () => {
    expect(scroll([0]).band).toBe('top');
    expect(scroll([TOP_THRESHOLD_PX]).band).toBe('top');
  });

  it('turns to glass one pixel past the threshold', () => {
    expect(scroll([TOP_THRESHOLD_PX + 1]).band).toBe('glass');
  });

  it('stays glass while the reader is inside the first viewport', () => {
    expect(scroll([100, 400, VIEWPORT]).band).toBe('glass');
  });

  it('hides the band past one viewport, going down', () => {
    expect(scroll([100, 400, VIEWPORT + 1]).band).toBe('hidden');
  });

  it('with a page line, hides below it and shows above it, by position alone (owner, 2026-09-28)', () => {
    const LINE = 712;
    const step = (scrollY: number, lastY: number, band: 'glass' | 'hidden') =>
      nextChromeState({ scrollY, viewportHeight: VIEWPORT, previous: { band, topButton: band === 'hidden' }, lastY, hideAfter: LINE }).band;

    // Going down: shown until the band's bottom passes the edge's bottom.
    expect(step(LINE, LINE - 10, 'glass')).toBe('glass');
    expect(step(LINE + 1, LINE, 'glass')).toBe('hidden');
    // Going back up deep in the page: stays hidden, however far it travels…
    expect(step(3000, 3400, 'hidden')).toBe('hidden');
    expect(step(LINE + 1, 2000, 'hidden')).toBe('hidden');
    // …and returns only once the edge is back at the top of the screen.
    expect(step(LINE, LINE + 1, 'hidden')).toBe('glass');
    // The top threshold still wins.
    expect(step(20, 30, 'hidden')).toBe('top');
  });

  it('without a page line, keeps the one-viewport rule and the 80px way back', () => {
    expect(scroll([100, 400, VIEWPORT + 1]).band).toBe('hidden');
    expect(scroll([100, 400, VIEWPORT + 1, 2000, 2000 - REVEAL_PX]).band).toBe('glass');
  });

  it('never lets a page’s line hide the band later than a viewport, or inside the top threshold', () => {
    expect(hideLineFor(VIEWPORT, 5000)).toBe(VIEWPORT);
    expect(hideLineFor(VIEWPORT, 10)).toBe(TOP_THRESHOLD_PX);
    expect(hideLineFor(VIEWPORT, Number.NaN)).toBe(VIEWPORT);
    expect(hideLineFor(VIEWPORT)).toBe(VIEWPORT);
  });

  it('does not hide the band when the reader is going up', () => {
    // Deep in the page, then upward: never hidden on the way back.
    expect(scroll([2000, 1500]).band).toBe('glass');
  });

  it('keeps the band hidden while the reader carries on down', () => {
    expect(scroll([100, 1000, 2000, 3000]).band).toBe('hidden');
  });

  it('needs 80px of upward travel to bring the band back', () => {
    const justShort = scroll([100, 1000, 2000, 2000 - (REVEAL_PX - 1)]);
    expect(justShort.band).toBe('hidden');

    const enough = scroll([100, 1000, 2000, 2000 - REVEAL_PX]);
    expect(enough.band).toBe('glass');
  });

  it('measures the 80px from the deepest point, not from the last sample', () => {
    // Down to 2000, on to 3000, then a 79px twitch back up: still hidden,
    // because the anchor moved down with the reader.
    expect(scroll([100, 1000, 2000, 3000, 3000 - 79]).band).toBe('hidden');
    expect(scroll([100, 1000, 2000, 3000, 3000 - 80]).band).toBe('glass');
  });

  it('restores the stripe only at the very top', () => {
    expect(scroll([100, 2000, 500, TOP_THRESHOLD_PX + 1]).band).toBe('glass');
    expect(scroll([100, 2000, 500, 0]).band).toBe('top');
  });

  it('shows the back-to-top button exactly when the band is hidden', () => {
    const positions = [0, 40, 41, 400, 801, 900, 820, 700, 0];
    let previous = AT_TOP;
    let lastY = 0;

    for (const scrollY of positions) {
      previous = nextChromeState({
        scrollY,
        viewportHeight: VIEWPORT,
        previous,
        lastY,
      });
      lastY = nextAnchor({ scrollY, band: previous.band, lastY });

      expect(previous.topButton).toBe(previous.band === 'hidden');
    }
  });
});

describe('nextAnchor', () => {
  it('follows the reader when the band is visible', () => {
    expect(nextAnchor({ scrollY: 500, band: 'glass', lastY: 900 })).toBe(500);
    expect(nextAnchor({ scrollY: 0, band: 'top', lastY: 900 })).toBe(0);
  });

  it('keeps the deepest point while the band is hidden', () => {
    expect(nextAnchor({ scrollY: 1200, band: 'hidden', lastY: 900 })).toBe(1200);
    expect(nextAnchor({ scrollY: 800, band: 'hidden', lastY: 900 })).toBe(900);
  });
});
