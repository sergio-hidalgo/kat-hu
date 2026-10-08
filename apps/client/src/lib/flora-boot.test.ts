// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/** The drawings wait for `load` and for the screen (`lib/flora-boot.ts`). */

const page = () => {
  document.body.innerHTML = '<div data-flora="line-daisy" data-mask-defer></div><div data-flora="line-leaf" data-mask-defer></div>';
  return Array.from(document.querySelectorAll<HTMLElement>('[data-flora]'));
};

let intersect: (entries: Array<{ target: Element; isIntersecting: boolean }>) => void;

beforeEach(() => {
  vi.resetModules();
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(callback: typeof intersect) {
        intersect = callback;
      }
      observe() {}
      unobserve() {}
    },
  );
});

afterEach(() => vi.unstubAllGlobals());

describe('flora-boot', () => {
  it('switches on only the drawings that come near the screen, once the page has loaded', async () => {
    const [daisy, leaf] = page();
    Object.defineProperty(document, 'readyState', { value: 'complete', configurable: true });

    await import('./flora-boot');
    expect(daisy.hasAttribute('data-mask-on')).toBe(false);

    intersect([{ target: daisy, isIntersecting: true }, { target: leaf, isIntersecting: false }]);
    expect(daisy.hasAttribute('data-mask-on')).toBe(true);
    expect(leaf.hasAttribute('data-mask-on')).toBe(false);
  });

  it('waits for the load event while the page is still loading', async () => {
    const [daisy] = page();
    Object.defineProperty(document, 'readyState', { value: 'loading', configurable: true });
    await import('./flora-boot');

    window.dispatchEvent(new Event('load'));
    intersect([{ target: daisy, isIntersecting: true }]);
    expect(daisy.hasAttribute('data-mask-on')).toBe(true);
  });

  it('switches everything on at once where there is no IntersectionObserver', async () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    delete (window as { IntersectionObserver?: unknown }).IntersectionObserver;
    const drawings = page();
    Object.defineProperty(document, 'readyState', { value: 'complete', configurable: true });

    await import('./flora-boot');

    expect(drawings.every((d) => d.hasAttribute('data-mask-on'))).toBe(true);
  });
});
