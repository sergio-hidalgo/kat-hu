import { describe, expect, it, vi } from 'vitest';
import { createTtlCache } from './ttl-cache';

/** A clock the test moves by hand. */
function setup() {
  let t = 0;
  const cache = createTtlCache({ ttlMs: 30_000, maxStaleMs: 120_000, now: () => t });
  return { cache, advance: (ms: number) => (t += ms) };
}

describe('createTtlCache', () => {
  it('loads once and answers from memory while fresh', async () => {
    const { cache, advance } = setup();
    const load = vi.fn(async () => 'a');

    expect(await cache.get('k', load)).toBe('a');
    advance(29_000);
    expect(await cache.get('k', load)).toBe('a');
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('serves the stale value at once and refreshes behind it, so the next read is new', async () => {
    const { cache, advance } = setup();
    let version = 'a';
    const load = vi.fn(async () => version);
    await cache.get('k', load);

    version = 'b';
    advance(31_000);
    expect(await cache.get('k', load)).toBe('a'); // stale, no waiting
    await Promise.resolve();
    await Promise.resolve();
    expect(await cache.get('k', load)).toBe('b');
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('waits for the load once the value is older than the ceiling', async () => {
    const { cache, advance } = setup();
    let version = 'a';
    const load = vi.fn(async () => version);
    await cache.get('k', load);

    version = 'b';
    advance(121_000);
    expect(await cache.get('k', load)).toBe('b');
  });

  it('shares one load between simultaneous readers', async () => {
    const { cache } = setup();
    const load = vi.fn(async () => {
      await Promise.resolve();
      return 'a';
    });

    const results = await Promise.all([cache.get('k', load), cache.get('k', load), cache.get('k', load)]);

    expect(results).toEqual(['a', 'a', 'a']);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('keeps the old value through a failed refresh, and never keeps a failure', async () => {
    const { cache, advance } = setup();
    await cache.get('k', async () => 'a');

    advance(200_000); // past the ceiling: it must try, and it fails
    expect(await cache.get('k', async () => Promise.reject(new Error('down')))).toBe('a');

    await expect(cache.get('new', async () => Promise.reject(new Error('down')))).rejects.toThrow('down');
    // The failure was not stored: the next call tries again.
    expect(await cache.get('new', async () => 'ok')).toBe('ok');
  });

  it('keeps keys apart', async () => {
    const { cache } = setup();

    expect(await cache.get('a', async () => 1)).toBe(1);
    expect(await cache.get('b', async () => 2)).toBe(2);
  });
});
