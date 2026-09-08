/**
 * Entry reveals for `/drops` (spec 03c).
 *
 * Two kinds of arrival, one policy object:
 *
 * - `fade` — opacity only, no travel, immediately. The featured block, which
 *   is above the fold and already carries the ranking.
 * - `observe` — a 10px rise plus a fade as the element crosses into the
 *   viewport, once per element, never replayed.
 *
 * The rules live here rather than in the page's script so they can be tested
 * without a browser, and so there is one place that knows what "reveal" means.
 *
 * Three things this module guarantees, because each of them is a way the
 * feature would otherwise become a defect:
 *
 * 1. **Nothing is hidden by the markup.** The `opacity: 0` is set here, when
 *    an element is registered. A reader with no JS, with reduced motion, or
 *    on a browser without `IntersectionObserver` gets the page fully visible
 *    and never learns there was an animation.
 * 2. **An element is animated at most once.** Registration is idempotent and
 *    the observer stops watching an element the moment it has arrived, so a
 *    re-deal cannot replay a reveal.
 * 3. **Re-renders do not animate.** `/drops` re-deals its cards on resize and
 *    again when the like counts land; those paths register nothing new, so a
 *    card either keeps waiting for its own scroll or stays as it was. Paging
 *    is the one path that calls `settle`, which shows a card at once with no
 *    animation — a page change is a jump, and cards sliding in under a scroll
 *    that did not happen is noise.
 *
 * Animation is the Web Animations API, not CSS keyframes: `@keyframes` would
 * need a stylesheet and `global.css` is a single import by rule (`ui-kathu`).
 * A scripted animation is also outside the token file's blanket
 * `prefers-reduced-motion` rule, so the guard below is this module's own job.
 */

export type Reveal = {
  /** Register elements to reveal as they enter the viewport. */
  observe(elements: Iterable<Element>): void;
  /**
   * Show an element now, without animating it, and stop watching it.
   * For cards a page change puts on screen.
   */
  settle(element: Element): void;
  /** Reveal now with a fade only, no travel. */
  fade(elements: Iterable<Element>): void;
  disconnect(): void;
};

/**
 * The slice of `window` this module uses. Named rather than taken as `Window`
 * because `IntersectionObserver` lives on `typeof globalThis`, not on the
 * `Window` interface — and because a test then has three things to script
 * instead of a whole window to fake.
 */
export interface RevealView {
  document: Document;
  matchMedia?: (query: string) => { matches: boolean };
  getComputedStyle: (element: Element) => { getPropertyValue: (name: string) => string };
  IntersectionObserver?: typeof IntersectionObserver;
}

export interface RevealOptions {
  /** Injected by the tests; defaults to the real one. */
  window?: RevealView;
}

/** How far a card travels. Small enough to read as settling, not as sliding. */
const RISE_PX = 10;
/**
 * An entrance runs at twice `--duration-slow`.
 *
 * The token scale tops out at 320ms because it is sized for *state changes* —
 * a hover, a border, a background — where anything longer feels unresponsive.
 * An entrance is not a state change: nobody is waiting on it, and at 320ms it
 * reads as a flick rather than as something settling into place. Derived from
 * the token rather than written as 640ms, so the two still move together if
 * the design system's pace ever changes.
 */
const DURATION_FACTOR = 2;
/** Cards arriving together are dealt out this far apart… */
const STAGGER_MS = 120;
/** …for at most this many steps, so a row arrives as a row, not as a queue. */
const MAX_STAGGER_STEPS = 3;

/**
 * Used only when the tokens cannot be read (a detached document in a test).
 * They are the values of `--duration-slow` and `--ease-out-soft`; the real
 * numbers are read from `:root` below so the two cannot drift apart. The
 * duration is then multiplied — see `DURATION_FACTOR`.
 */
const FALLBACK_DURATION_MS = 320;
const FALLBACK_EASING = 'cubic-bezier(0.22, 0.61, 0.36, 1)';

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

/** Everything off, nothing hidden: what reduced motion and old browsers get. */
const inert: Reveal = Object.freeze({
  observe() {},
  settle() {},
  fade() {},
  disconnect() {},
});

/** A CSS time — `320ms`, `0.32s` — in milliseconds. */
function millis(value: string): number | undefined {
  const number = Number.parseFloat(value);
  if (!Number.isFinite(number) || number <= 0) return undefined;
  return value.trim().endsWith('ms') ? number : number * 1000;
}

/**
 * The duration and easing come from the token file, read once at start-up.
 * A scripted animation cannot name a token, and writing the numbers down a
 * second time is how a component and its design system drift apart.
 */
function motionFromTokens(view: RevealView): { duration: number; easing: string } {
  const styles = view.getComputedStyle(view.document.documentElement);
  const duration = millis(styles.getPropertyValue('--duration-slow'));
  const easing = styles.getPropertyValue('--ease-out-soft').trim();

  return {
    duration: (duration ?? FALLBACK_DURATION_MS) * DURATION_FACTOR,
    easing: easing || FALLBACK_EASING,
  };
}

export function createReveal(options: RevealOptions = {}): Reveal {
  const view =
    options.window ??
    (typeof window === 'undefined' ? undefined : (window as RevealView));

  if (!view || typeof view.IntersectionObserver !== 'function') return inert;
  const Observer = view.IntersectionObserver;
  if (view.matchMedia?.(REDUCED_MOTION).matches) return inert;

  const { duration, easing } = motionFromTokens(view);

  /**
   * `pending` — hidden, waiting for its own scroll. `done` — arrived, or
   * deliberately shown without animating. An element the map does not know
   * was never hidden, so it needs nothing.
   */
  const state = new WeakMap<Element, 'pending' | 'done'>();

  const observer = new Observer(
    (entries: IntersectionObserverEntry[]) => {
      const arrived = entries
        .filter((entry) => entry.isIntersecting)
        .map((entry) => entry.target as HTMLElement)
        .filter((element) => state.get(element) === 'pending')
        // Entries arrive in observation order, which is not reading order once
        // the cards have been dealt across columns.
        .sort(inDocumentOrder);

      arrived.forEach((element, index) => {
        state.set(element, 'done');
        observer.unobserve(element);
        play(element, rise, Math.min(index, MAX_STAGGER_STEPS) * STAGGER_MS);
      });
    },
    // A card starts moving once it is properly in view, not the instant its
    // top edge crosses the fold.
    { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
  );

  const rise: Keyframe[] = [
    { opacity: 0, transform: `translateY(${RISE_PX}px)` },
    { opacity: 1, transform: 'none' },
  ];
  const appear: Keyframe[] = [{ opacity: 0 }, { opacity: 1 }];

  function inDocumentOrder(a: Element, b: Element): number {
    // DOCUMENT_POSITION_FOLLOWING — b comes after a, so a sorts first.
    return a.compareDocumentPosition(b) & 4 ? -1 : 1;
  }

  function hide(element: HTMLElement): void {
    element.style.opacity = '0';
  }

  function show(element: HTMLElement): void {
    element.style.opacity = '';
    element.style.transform = '';
  }

  function play(element: HTMLElement, keyframes: Keyframe[], delay: number) {
    // `fill: 'both'` holds the first frame through the stagger delay, so a
    // card cannot flash at full opacity while it waits its turn.
    const animation = element.animate?.(keyframes, {
      duration,
      easing,
      delay,
      fill: 'both',
    });

    if (!animation) {
      show(element);
      return;
    }

    // Clear the inline state first, then drop the animation: doing it the
    // other way round shows one frame of the pre-animation styles.
    animation.onfinish = () => {
      show(element);
      animation.cancel();
    };
  }

  return {
    observe(elements) {
      for (const element of elements) {
        if (!isElement(element) || state.has(element)) continue;
        state.set(element, 'pending');
        hide(element);
        observer.observe(element);
      }
    },

    settle(element) {
      if (!isElement(element) || state.get(element) === 'done') return;
      state.set(element, 'done');
      observer.unobserve(element);
      show(element);
    },

    fade(elements) {
      let index = 0;
      for (const element of elements) {
        if (!isElement(element) || state.has(element)) continue;
        state.set(element, 'done');
        hide(element);
        play(element, appear, Math.min(index, MAX_STAGGER_STEPS) * STAGGER_MS);
        index += 1;
      }
    },

    disconnect() {
      observer.disconnect();
    },
  };
}

/** Duck-typed: the elements come from the page's own document. */
function isElement(value: Element): value is HTMLElement {
  return typeof (value as HTMLElement)?.style === 'object';
}
