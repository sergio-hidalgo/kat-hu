import { afterEach, describe, expect, it, vi, type Mock } from 'vitest';

vi.mock('../lib/sanity', () => ({ sanityClient: { fetch: vi.fn() } }));

import { sanityClient } from '../lib/sanity';
import { getLandingCopy, LANDING_DEFAULTS, mergeCopy } from './landing';

/**
 * The landing must render finished Spanish copy whatever state the CMS is in
 * (spec 05): empty, half-filled, or unreachable. The CMS wins field by field,
 * and only where the editor has written something.
 */

// Sanity's `fetch` is typed per query; the fixtures here are plain objects.
const fetch = sanityClient.fetch as unknown as Mock<(...args: unknown[]) => Promise<unknown>>;

afterEach(() => {
  fetch.mockReset();
  vi.restoreAllMocks();
});

/** Every string anywhere inside a value. */
const strings = (value: unknown): string[] =>
  typeof value === 'string'
    ? [value]
    : value && typeof value === 'object'
      ? Object.values(value).flatMap(strings)
      : [];

describe('mergeCopy', () => {
  it('keeps the fallback where the CMS is missing, blank or not a string', () => {
    const fallback = { a: 'uno', b: 'dos', c: 'tres', d: 'cuatro' };

    expect(mergeCopy(fallback, { b: '', c: '   ', d: 42 })).toEqual(fallback);
    expect(mergeCopy(fallback, null)).toEqual(fallback);
  });

  it('takes written CMS strings, trimmed, and nothing the fallback does not have', () => {
    const merged = mergeCopy({ a: 'uno', nested: { b: 'dos' } }, {
      a: '  Hola  ',
      nested: { b: 'Adiós' },
      extra: 'no debería llegar',
    });

    expect(merged).toEqual({ a: 'Hola', nested: { b: 'Adiós' } });
  });

  it('merges lists position by position', () => {
    const fallback = [{ t: 'uno' }, { t: 'dos' }];

    expect(mergeCopy(fallback, [{ t: '' }, { t: 'Segundo' }])).toEqual([{ t: 'uno' }, { t: 'Segundo' }]);
    expect(mergeCopy(fallback, 'no es una lista')).toEqual(fallback);
  });

  it('never changes the fallback it was given', () => {
    const fallback = { a: 'uno' };

    mergeCopy(fallback, { a: 'otro' });
    expect(fallback).toEqual({ a: 'uno' });
  });
});

describe('LANDING_DEFAULTS', () => {
  it('has no empty string anywhere, so an empty CMS still reads as finished', () => {
    for (const text of strings(LANDING_DEFAULTS)) expect(text.trim().length).toBeGreaterThan(0);
  });

  it('prices with the euro sign after the number', () => {
    for (const service of ['individual', 'familia', 'seguimiento'] as const) {
      expect(LANDING_DEFAULTS.services[service].price).toMatch(/^\d+ €$/);
    }
  });
});

describe('getLandingCopy', () => {
  it('renders the Spanish defaults when there is no landing document', async () => {
    fetch.mockResolvedValueOnce(null);

    await expect(getLandingCopy()).resolves.toEqual(LANDING_DEFAULTS);
  });

  it('lets the CMS copy win where it is filled and keeps the defaults elsewhere', async () => {
    fetch.mockResolvedValueOnce({
      hero: { headline: 'Tu gato, más tranquilo', lead: '' },
      'how-it-works': { steps: [null, { title: 'Videollamada' }, null] },
    });

    const copy = await getLandingCopy();

    expect(copy.hero.headline).toBe('Tu gato, más tranquilo');
    expect(copy.hero.lead).toBe(LANDING_DEFAULTS.hero.lead);
    expect(copy['how-it-works'].steps[1].title).toBe('Videollamada');
    expect(copy['how-it-works'].steps[1].description).toBe(
      LANDING_DEFAULTS['how-it-works'].steps[1].description,
    );
    expect(copy.services).toEqual(LANDING_DEFAULTS.services);
  });

  it('falls back to the defaults when Sanity cannot be reached', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    fetch.mockRejectedValueOnce(new Error('offline'));

    await expect(getLandingCopy()).resolves.toEqual(LANDING_DEFAULTS);
  });

  it('passes the about image through only when it has an asset', async () => {
    const image = { _type: 'image', asset: { _ref: 'image-abc-800x1000-jpg', _type: 'reference' }, alt: 'Laura con un gato' };

    fetch.mockResolvedValueOnce({ 'about-teaser': { image } });
    expect((await getLandingCopy())['about-teaser'].image).toEqual(image);

    fetch.mockResolvedValueOnce({ 'about-teaser': { image: { _type: 'image' } } });
    expect((await getLandingCopy())['about-teaser'].image).toBeUndefined();
  });

  it('asks for the singleton with parameters, never by building the query', async () => {
    fetch.mockResolvedValueOnce(null);
    await getLandingCopy();

    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('_type == $type && _id == $id'), {
      type: 'landing',
      id: 'landing',
    });
  });
});
