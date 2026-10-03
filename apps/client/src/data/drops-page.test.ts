import { afterEach, describe, expect, it, vi, type Mock } from 'vitest';

vi.mock('../lib/sanity', () => ({ sanityClient: { fetch: vi.fn() } }));

import { sanityClient } from '../lib/sanity';
import { DROPS_PAGE_DEFAULTS, getDropsPageCopy } from './drops-page';

const fetch = sanityClient.fetch as unknown as Mock<(...args: unknown[]) => Promise<unknown>>;

afterEach(() => fetch.mockReset());

describe('getDropsPageCopy', () => {
  it('reads the singleton by type and fixed id', async () => {
    fetch.mockResolvedValueOnce(null);
    await getDropsPageCopy();

    expect(fetch.mock.calls[0][1]).toEqual({ type: 'dropsPage', id: 'dropsPage' });
  });

  it('lays what is written over the defaults, field by field', async () => {
    fetch.mockResolvedValueOnce({
      banner: { title: '  Drops de kathu ' },
      recent: { title: 'Más lecturas' },
    });

    expect(await getDropsPageCopy()).toEqual({
      banner: { title: 'Drops de kathu', subtitle: DROPS_PAGE_DEFAULTS.banner.subtitle },
      featured: DROPS_PAGE_DEFAULTS.featured,
      recent: { title: 'Más lecturas' },
    });
  });

  it('treats a blank string as not written and ignores unknown fields', async () => {
    fetch.mockResolvedValueOnce({ banner: { title: '   ', extra: 'x' }, other: 1 });

    expect(await getDropsPageCopy()).toEqual(DROPS_PAGE_DEFAULTS);
  });

  it('falls back to the defaults when Sanity cannot be reached', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    fetch.mockRejectedValueOnce(new Error('offline'));

    expect(await getDropsPageCopy()).toEqual(DROPS_PAGE_DEFAULTS);
    warn.mockRestore();
  });
});
