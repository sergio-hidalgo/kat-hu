// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initCarousel, SLIDE_EVERY_MS } from './carousel-init';

/**
 * jsdom has no layout, so the track's geometry is stated by hand: three cards
 * of 100px with a 10px gap in a 100px track, i.e. one card in view and three
 * pages (spec 05e: the phone carousel).
 */
function mount({ autoplay = false, scrollWidth = 320 } = {}) {
  document.body.innerHTML = `
    <div data-carousel ${autoplay ? 'data-autoplay' : ''}>
      <div data-track tabindex="0"><div>a</div><div>b</div><div>c</div></div>
      <div data-dots hidden></div>
      <template data-dot><button type="button"></button></template>
    </div>`;
  const root = document.querySelector<HTMLElement>('[data-carousel]')!;
  const track = root.querySelector<HTMLElement>('[data-track]')!;
  const cards = Array.from(track.children) as HTMLElement[];
  cards.forEach((card, index) => {
    Object.defineProperty(card, 'offsetLeft', { value: index * 110 });
    Object.defineProperty(card, 'offsetWidth', { value: 100 });
  });
  Object.defineProperty(track, 'clientWidth', { value: 100 });
  Object.defineProperty(track, 'scrollWidth', { value: scrollWidth });
  track.scrollTo = vi.fn() as never;
  return { root, track, cards };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  );
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {} }));
  vi.stubGlobal('requestAnimationFrame', (cb: () => void) => setTimeout(cb, 0));
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('initCarousel (spec 05e)', () => {
  it('announces each card as a slide, N de M', () => {
    const { root, cards } = mount();
    initCarousel(root);

    expect(cards.map((c) => c.getAttribute('aria-label'))).toEqual(['1 de 3', '2 de 3', '3 de 3']);
    expect(cards.every((c) => c.getAttribute('role') === 'group')).toBe(true);
    expect(cards[0].getAttribute('aria-roledescription')).toBe('slide');
  });

  it('leaves a figure without a role, which it may not take (aria-allowed-role)', () => {
    document.body.innerHTML = `
      <div data-carousel>
        <div data-track><figure>a</figure><figure>b</figure></div>
        <div data-dots hidden></div>
        <template data-dot><button type="button"></button></template>
      </div>`;
    const root = document.querySelector<HTMLElement>('[data-carousel]')!;
    initCarousel(root);

    expect(Array.from(root.querySelectorAll('figure')).every((f) => !f.hasAttribute('role'))).toBe(true);
  });

  it('leaves the role of a list item alone, so a numbered list stays a list', () => {
    document.body.innerHTML = `
      <div data-carousel>
        <ol data-track><li>a</li><li>b</li></ol>
        <div data-dots hidden></div>
        <template data-dot><button type="button"></button></template>
      </div>`;
    const root = document.querySelector<HTMLElement>('[data-carousel]')!;
    initCarousel(root);
    const items = Array.from(root.querySelectorAll('li'));

    expect(items.every((li) => !li.hasAttribute('role'))).toBe(true);
    expect(items.map((li) => li.getAttribute('aria-label'))).toEqual(['1 de 2', '2 de 2']);
  });

  it('draws one dot per card with one in view, the first current', () => {
    const { root } = mount();
    initCarousel(root);
    const dots = root.querySelectorAll('[data-dots] button');

    expect(root.querySelector<HTMLElement>('[data-dots]')!.hidden).toBe(false);
    expect(dots).toHaveLength(3);
    expect(dots[0].getAttribute('aria-current')).toBe('true');
    expect(dots[1].getAttribute('aria-current')).toBe('false');
  });

  it('jumps to a card with its dot', () => {
    const { root, track } = mount();
    initCarousel(root);
    root.querySelectorAll('[data-dots] button')[2].dispatchEvent(new MouseEvent('click'));

    expect(track.scrollTo).toHaveBeenCalledWith(expect.objectContaining({ left: 220 }));
  });

  it('moves one card with the arrow keys and stops at the ends', () => {
    const { root, track } = mount();
    initCarousel(root);

    track.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', cancelable: true }));
    expect(track.scrollTo).not.toHaveBeenCalled();

    const right = new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true });
    track.dispatchEvent(right);
    expect(right.defaultPrevented).toBe(true);
    expect(track.scrollTo).toHaveBeenCalledWith(expect.objectContaining({ left: 110 }));
  });

  it('has one page, no dots and no sliding when the track does not scroll (a desktop row)', () => {
    const { root } = mount({ scrollWidth: 100 });
    initCarousel(root);

    expect(root.querySelector<HTMLElement>('[data-dots]')!.hidden).toBe(true);
    expect(root.querySelectorAll('[data-dots] button')).toHaveLength(0);
  });

  it('never slides on its own without data-autoplay (sessions, steps, drops)', () => {
    const { root, track } = mount();
    initCarousel(root);
    vi.advanceTimersByTime(SLIDE_EVERY_MS * 3);

    expect(track.scrollTo).not.toHaveBeenCalled();
  });

  it('slides every 20 seconds with data-autoplay, and not while the tab is hidden', () => {
    const { root, track } = mount({ autoplay: true });
    initCarousel(root);

    vi.advanceTimersByTime(SLIDE_EVERY_MS);
    expect(track.scrollTo).toHaveBeenCalledTimes(1);
    expect(track.scrollTo).toHaveBeenLastCalledWith(expect.objectContaining({ left: 110 }));

    Object.defineProperty(document, 'hidden', { value: true, configurable: true });
    vi.advanceTimersByTime(SLIDE_EVERY_MS);
    expect(track.scrollTo).toHaveBeenCalledTimes(1);
    Object.defineProperty(document, 'hidden', { value: false, configurable: true });
  });

  it('does nothing with a single card', () => {
    document.body.innerHTML =
      '<div data-carousel><div data-track><div>a</div></div><div data-dots hidden></div><template data-dot><button></button></template></div>';
    const root = document.querySelector<HTMLElement>('[data-carousel]')!;
    initCarousel(root);

    expect(root.querySelector<HTMLElement>('[data-dots]')!.hidden).toBe(true);
  });
});
