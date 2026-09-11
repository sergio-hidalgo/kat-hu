import { afterEach, describe, expect, it, vi, type Mock } from 'vitest';

vi.mock('../lib/sanity', () => ({ sanityClient: { fetch: vi.fn() } }));

import { sanityClient } from '../lib/sanity';
import { getTestimonials } from './testimonials';

// Sanity's `fetch` is typed per query; the fixtures here are plain objects.
const fetch = sanityClient.fetch as unknown as Mock<(...args: unknown[]) => Promise<unknown>>;

afterEach(() => {
  fetch.mockReset();
  vi.restoreAllMocks();
});

describe('getTestimonials', () => {
  it('returns trimmed testimonials and drops any without a quote or a name', async () => {
    fetch.mockResolvedValueOnce([
      { id: 't1', quote: '  Mochi vuelve a dormir con nosotros.  ', name: 'Ana García', cat: ' Mochi ' },
      { id: 't2', quote: '   ', name: 'Luis Pérez' },
      { id: 't3', quote: 'Por fin hay paz en casa.', name: '', cat: 'Nube' },
      { id: 't4', quote: 'Muy recomendable.', name: 'Marta Ruiz', cat: '' },
    ]);

    await expect(getTestimonials()).resolves.toEqual([
      { id: 't1', quote: 'Mochi vuelve a dormir con nosotros.', name: 'Ana García', cat: 'Mochi' },
      { id: 't4', quote: 'Muy recomendable.', name: 'Marta Ruiz', cat: undefined },
    ]);
  });

  it('asks for at most three, lowest order first, by parameter', async () => {
    fetch.mockResolvedValueOnce([]);
    await getTestimonials();

    const [query, params] = fetch.mock.calls[0];
    expect(query).toContain('[0...3]');
    expect(query).toContain('order(coalesce(order, 1000) asc');
    expect(params).toEqual({ type: 'testimonial' });
  });

  it('shows none when there are none, or when Sanity cannot be reached', async () => {
    fetch.mockResolvedValueOnce(null);
    await expect(getTestimonials()).resolves.toEqual([]);

    vi.spyOn(console, 'warn').mockImplementation(() => {});
    fetch.mockRejectedValueOnce(new Error('offline'));
    await expect(getTestimonials()).resolves.toEqual([]);
  });
});
