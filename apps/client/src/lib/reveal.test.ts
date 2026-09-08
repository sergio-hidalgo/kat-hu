// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createReveal, type RevealView } from './reveal';

/**
 * jsdom implements neither `IntersectionObserver` nor the Web Animations API,
 * which suits us: both are scripted here, so a test can say exactly when an
 * element crosses into view and read back the keyframes it was given.
 *
 * Everything the module touches comes off the `window` it is handed, so each
 * test builds one with `view()` rather than mutating the global.
 */

type Observed = { target: Element; isIntersecting: boolean };

class FakeObserver {
  static last: FakeObserver | undefined;

  readonly observed = new Set<Element>();
  readonly unobserved: Element[] = [];
  disconnected = false;

  constructor(
    private readonly callback: (entries: Observed[]) => void,
    readonly options?: IntersectionObserverInit,
  ) {
    FakeObserver.last = this;
  }

  observe(element: Element) {
    this.observed.add(element);
  }

  unobserve(element: Element) {
    this.observed.delete(element);
    this.unobserved.push(element);
  }

  disconnect() {
    this.disconnected = true;
  }

  /** Cross into view, in the order the browser would report them. */
  enter(...elements: Element[]) {
    this.callback(elements.map((target) => ({ target, isIntersecting: true })));
  }

  /** The callback a browser fires for an element that is not yet in view. */
  miss(...elements: Element[]) {
    this.callback(elements.map((target) => ({ target, isIntersecting: false })));
  }
}

type Animation = {
  keyframes: Keyframe[];
  options: KeyframeAnimationOptions;
  cancel: ReturnType<typeof vi.fn>;
  onfinish: (() => void) | null;
};

const animations: Animation[] = [];

/** Stands in for `Element.prototype.animate`, and records the call. */
function animate(this: Element, keyframes: Keyframe[], options: KeyframeAnimationOptions) {
  const animation: Animation = {
    keyframes,
    options,
    cancel: vi.fn(),
    onfinish: null,
  };
  animations.push(animation);
  return animation as unknown as globalThis.Animation;
}

const tokens: Record<string, string> = {
  '--duration-slow': '320ms',
  '--ease-out-soft': 'cubic-bezier(0.22, 0.61, 0.36, 1)',
};

function view(overrides: Partial<RevealView> = {}, values = tokens): RevealView {
  return {
    document,
    IntersectionObserver: FakeObserver as unknown as typeof IntersectionObserver,
    matchMedia: () => ({ matches: false }),
    getComputedStyle: () => ({
      getPropertyValue: (name: string) => values[name] ?? '',
    }),
    ...overrides,
  };
}

/** `count` cards in document order, already in the page. */
function cards(count: number): HTMLElement[] {
  document.body.innerHTML = Array.from(
    { length: count },
    (_, index) => `<article id="card-${index}"></article>`,
  ).join('');
  return Array.from(document.body.children) as HTMLElement[];
}

beforeEach(() => {
  animations.length = 0;
  FakeObserver.last = undefined;
  document.body.innerHTML = '';
  Element.prototype.animate = animate as unknown as Element['animate'];
});

describe('createReveal', () => {
  it('hides an element when it registers it, and not before', () => {
    const [card] = cards(1);
    const reveal = createReveal({ window: view() });

    expect(card.style.opacity).toBe('');
    reveal.observe([card]);
    expect(card.style.opacity).toBe('0');
  });

  it('rises and fades an element in when it enters the viewport', () => {
    const [card] = cards(1);
    createReveal({ window: view() }).observe([card]);

    FakeObserver.last?.enter(card);

    expect(animations).toHaveLength(1);
    expect(animations[0].keyframes).toEqual([
      { opacity: 0, transform: 'translateY(10px)' },
      { opacity: 1, transform: 'none' },
    ]);
  });

  it('takes its duration and easing from the motion tokens', () => {
    const [card] = cards(1);
    createReveal({ window: view() }).observe([card]);
    FakeObserver.last?.enter(card);

    // Twice `--duration-slow`: an entrance is not a state change.
    expect(animations[0].options).toMatchObject({
      duration: 640,
      easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
    });
  });

  it('falls back to the token values when :root cannot be read', () => {
    const [card] = cards(1);
    createReveal({ window: view({}, {}) }).observe([card]);
    FakeObserver.last?.enter(card);

    expect(animations[0].options).toMatchObject({
      duration: 640,
      easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
    });
  });

  it('reveals an element once and then stops watching it', () => {
    const [card] = cards(1);
    createReveal({ window: view() }).observe([card]);

    FakeObserver.last?.enter(card);
    FakeObserver.last?.enter(card);

    expect(animations).toHaveLength(1);
    expect(FakeObserver.last?.unobserved).toEqual([card]);
  });

  it('ignores an element that is reported as not intersecting', () => {
    const [card] = cards(1);
    createReveal({ window: view() }).observe([card]);

    FakeObserver.last?.miss(card);

    expect(animations).toHaveLength(0);
    expect(card.style.opacity).toBe('0');
  });

  it('registers an element only once, however often it is offered', () => {
    const [card] = cards(1);
    const reveal = createReveal({ window: view() });

    reveal.observe([card]);
    reveal.observe([card]);

    expect(FakeObserver.last?.observed.size).toBe(1);
  });

  it('staggers a group by 120ms in document order, capped at three steps', () => {
    const group = cards(6);
    createReveal({ window: view() }).observe(group);

    // Reported out of order, as a browser may: the delays must still follow
    // the page, not the callback.
    FakeObserver.last?.enter(group[2], group[0], group[5], group[1], group[4], group[3]);

    expect(animations.map((animation) => animation.options.delay)).toEqual([
      0, 120, 240, 360, 360, 360,
    ]);
  });

  it('clears the inline styles and drops the animation when it finishes', () => {
    const [card] = cards(1);
    createReveal({ window: view() }).observe([card]);
    FakeObserver.last?.enter(card);

    animations[0].onfinish?.();

    expect(card.style.opacity).toBe('');
    expect(card.style.transform).toBe('');
    expect(animations[0].cancel).toHaveBeenCalledTimes(1);
  });

  it('fades without travelling, for the featured block', () => {
    const group = cards(2);
    createReveal({ window: view() }).fade(group);

    expect(animations.map((animation) => animation.keyframes)).toEqual([
      [{ opacity: 0 }, { opacity: 1 }],
      [{ opacity: 0 }, { opacity: 1 }],
    ]);
    expect(animations.map((animation) => animation.options.delay)).toEqual([0, 120]);
    expect(FakeObserver.last?.observed.size).toBe(0);
  });

  it('settles a waiting card without animating it — the pagination path', () => {
    const [card] = cards(1);
    const reveal = createReveal({ window: view() });

    reveal.observe([card]);
    reveal.settle(card);

    expect(card.style.opacity).toBe('');
    expect(animations).toHaveLength(0);
    expect(FakeObserver.last?.unobserved).toEqual([card]);
  });

  it('never animates a settled card, even if it is offered again', () => {
    const [card] = cards(1);
    const reveal = createReveal({ window: view() });

    reveal.settle(card);
    reveal.observe([card]);

    expect(card.style.opacity).toBe('');
    expect(FakeObserver.last?.observed.size).toBe(0);
  });

  it('does nothing at all under prefers-reduced-motion', () => {
    const [card] = cards(1);
    const reveal = createReveal({
      window: view({ matchMedia: () => ({ matches: true }) }),
    });

    reveal.observe([card]);
    reveal.fade([card]);

    expect(card.style.opacity).toBe('');
    expect(animations).toHaveLength(0);
    expect(FakeObserver.last).toBeUndefined();
  });

  it('does nothing at all without IntersectionObserver', () => {
    const [card] = cards(1);
    const reveal = createReveal({
      window: view({ IntersectionObserver: undefined }),
    });

    reveal.observe([card]);
    reveal.fade([card]);

    expect(card.style.opacity).toBe('');
    expect(animations).toHaveLength(0);
  });

  it('shows an element rather than leaving it hidden when animate is missing', () => {
    const [card] = cards(1);
    Element.prototype.animate = undefined as unknown as Element['animate'];

    createReveal({ window: view() }).observe([card]);
    FakeObserver.last?.enter(card);

    expect(card.style.opacity).toBe('');
  });

  it('watches from just inside the fold', () => {
    createReveal({ window: view() }).observe(cards(1));

    expect(FakeObserver.last?.options).toEqual({
      threshold: 0.15,
      rootMargin: '0px 0px -8% 0px',
    });
  });

  it('disconnects the observer', () => {
    const reveal = createReveal({ window: view() });
    reveal.observe(cards(1));
    reveal.disconnect();

    expect(FakeObserver.last?.disconnected).toBe(true);
  });
});
