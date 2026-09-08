/**
 * The chrome's scroll policy (spec 03d).
 *
 * The header's script listens and paints; every decision it paints is taken
 * here, as a pure function, so the thresholds can be tested without a browser
 * and so there is one place that knows what "the header is hidden" means.
 *
 * Three states, one attribute:
 *
 * - `top`    — the reader is at the top of the page. The stripe is shown and
 *              the band is opaque Shell.
 * - `glass`  — past 40px of scroll. The stripe is collapsed and the band is
 *              translucent Shell with a blur, a Mist rule and `shadow-sm`.
 * - `hidden` — past one full viewport and still going down. The band is
 *              translated out of the way and the back-to-top button takes
 *              over.
 *
 * Coming back up, the band returns at `glass` after 80px of upward travel —
 * a hysteresis, so a trackpad twitch cannot flicker it. The stripe comes back
 * only at the very top: it belongs to the top of the page, not to the header.
 */

export type BandState = 'top' | 'glass' | 'hidden';

export type ChromeState = {
  band: BandState;
  topButton: boolean;
};

/** Below this the page still counts as "at the top". */
export const TOP_THRESHOLD_PX = 40;

/** How far back up the reader must travel before the band returns. */
export const REVEAL_PX = 80;

export const AT_TOP: ChromeState = { band: 'top', topButton: false };

export type ChromeInput = {
  scrollY: number;
  viewportHeight: number;
  previous: ChromeState;
  /**
   * The point the next decision is measured from: the previous sample's
   * position, or — while the band is hidden — the deepest point reached since
   * it hid, which is what the 80px hysteresis counts back from.
   * `nextAnchor` maintains it.
   */
  lastY: number;
};

/**
 * `topButton` is derived, never decided: the button exists to undo the state
 * the band is in, so one rule settles both and they cannot disagree.
 */
function state(band: BandState): ChromeState {
  return { band, topButton: band === 'hidden' };
}

export function nextChromeState({
  scrollY,
  viewportHeight,
  previous,
  lastY,
}: ChromeInput): ChromeState {
  if (scrollY <= TOP_THRESHOLD_PX) return state('top');

  if (previous.band === 'hidden') {
    // Only a deliberate move back up brings it back, and never the stripe.
    return state(lastY - scrollY >= REVEAL_PX ? 'glass' : 'hidden');
  }

  const goingDown = scrollY > lastY;
  const pastOneViewport = scrollY > viewportHeight;

  return state(goingDown && pastOneViewport ? 'hidden' : 'glass');
}

/**
 * The reference point for the next decision. While the band is hidden it is
 * the deepest position reached, so scrolling further down does not shorten
 * the 80px it takes to bring the band back; otherwise it is simply where the
 * reader is now.
 */
export function nextAnchor({
  scrollY,
  band,
  lastY,
}: {
  scrollY: number;
  band: BandState;
  lastY: number;
}): number {
  return band === 'hidden' ? Math.max(lastY, scrollY) : scrollY;
}
