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
 *              the band is opaque Crema.
 * - `glass`  — past 40px of scroll. The stripe is collapsed and the band is
 *              translucent Crema with a blur and `shadow-sm`.
 * - `hidden` — the band is translated out of the way and the back-to-top
 *              button takes over.
 *
 * **When the page gives a line of its own** (`hideAfter`) the band follows
 * position alone: hidden below the line, shown above it, whichever way the
 * reader is going. On the landing the line is where the band's bottom passes
 * the bottom of the botanical edge under the hero, so the band leaves once
 * the hero is behind it and comes back only when that edge is back at the top
 * of the screen (owner, 2026-09-28 — it used to leave too late and come back
 * too early).
 *
 * **Otherwise** it hides past one viewport while going down, and returns at
 * `glass` after 80px of upward travel — a hysteresis, so a trackpad twitch
 * cannot flicker it. Either way the stripe comes back only at the very top: it
 * belongs to the top of the page, not to the header.
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
  /**
   * The page's own line, when it has one: below it the band is hidden, above
   * it the band is shown — by position alone (see the module note). Never
   * later than the viewport.
   */
  hideAfter?: number;
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
  hideAfter,
}: ChromeInput): ChromeState {
  if (scrollY <= TOP_THRESHOLD_PX) return state('top');

  // The page's own line: position alone decides, either way.
  if (hideAfter !== undefined && Number.isFinite(hideAfter)) {
    return state(scrollY > hideLineFor(viewportHeight, hideAfter) ? 'hidden' : 'glass');
  }

  if (previous.band === 'hidden') {
    // Only a deliberate move back up brings it back, and never the stripe.
    return state(lastY - scrollY >= REVEAL_PX ? 'glass' : 'hidden');
  }

  const goingDown = scrollY > lastY;

  return state(goingDown && scrollY > viewportHeight ? 'hidden' : 'glass');
}

/**
 * Where hiding may start: the page's own line when it gives a usable one,
 * one viewport otherwise — never later than the viewport, and never inside
 * the top threshold, where the band must stay.
 */
export function hideLineFor(viewportHeight: number, hideAfter?: number): number {
  if (hideAfter === undefined || !Number.isFinite(hideAfter)) return viewportHeight;
  return Math.min(viewportHeight, Math.max(TOP_THRESHOLD_PX, hideAfter));
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
