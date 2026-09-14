import { afterEach, describe, expect, it, vi, type Mock } from 'vitest';

vi.mock('../lib/sanity', () => ({ sanityClient: { fetch: vi.fn() } }));

import { sanityClient } from '../lib/sanity';
import { getLandingCopy, LANDING_DEFAULTS, mergeCopy } from './landing';

/**
 * The landing must render finished Spanish copy whatever state the CMS is in
 * (spec 05): empty, half-filled, or unreachable. Headings win field by field;
 * the sessions and the steps are taken whole from the CMS or whole from the
 * defaults, never mixed (spec 05b).
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

const image = {
  _type: 'image',
  asset: { _ref: 'image-abc-320x320-png', _type: 'reference' },
  alt: 'Una rama de lavanda en acuarela',
};

/** A session row as the query returns it. Synthetic copy. */
const session = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  title: `Sesión ${id}`,
  description: `Descripción de ${id}`,
  duration: '45 min',
  modality: 'Online',
  price: '40 €',
  image: null,
  ...extra,
});

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

  it('never merges a list item by item — lists are taken whole elsewhere', () => {
    const fallback = { list: [{ t: 'uno' }, { t: 'dos' }] };

    expect(mergeCopy(fallback, { list: [{ t: 'otro' }] })).toEqual(fallback);
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
    for (const item of LANDING_DEFAULTS.services.items) expect(item.price).toMatch(/^\d+ €$/);
  });

  it('keeps the three sessions the /estilo sample and the seed name', () => {
    expect(LANDING_DEFAULTS.services.items.map(({ id }) => id)).toEqual(['individual', 'familia', 'seguimiento']);
  });

  it('does not count the steps in the lead — the owner decides how many there are', () => {
    expect(LANDING_DEFAULTS['how-it-works'].lead).not.toMatch(/\d|\b(uno|dos|tres|cuatro|cinco|seis)\b/i);
  });
});

describe('getLandingCopy', () => {
  it('renders the Spanish defaults when there is nothing in the CMS', async () => {
    fetch.mockResolvedValueOnce(null);
    await expect(getLandingCopy()).resolves.toEqual(LANDING_DEFAULTS);

    fetch.mockResolvedValueOnce({ landing: null, services: [], steps: [] });
    await expect(getLandingCopy()).resolves.toEqual(LANDING_DEFAULTS);
  });

  it('falls back to the defaults when Sanity cannot be reached', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    fetch.mockRejectedValueOnce(new Error('offline'));

    await expect(getLandingCopy()).resolves.toEqual(LANDING_DEFAULTS);
  });

  it('lets written headings win field by field and keeps the defaults elsewhere', async () => {
    fetch.mockResolvedValueOnce({
      landing: {
        hero: { headline: 'Tu gato, más tranquilo', lead: '' },
        'how-it-works': { headline: '  Así trabajamos  ' },
      },
      services: [],
      steps: [],
    });

    const copy = await getLandingCopy();

    expect(copy.hero.headline).toBe('Tu gato, más tranquilo');
    expect(copy.hero.lead).toBe(LANDING_DEFAULTS.hero.lead);
    expect(copy['how-it-works'].headline).toBe('Así trabajamos');
    expect(copy['how-it-works'].lead).toBe(LANDING_DEFAULTS['how-it-works'].lead);
    expect(copy.services.items).toEqual(LANDING_DEFAULTS.services.items);
  });

  it('takes four CMS sessions whole, in query order, with no default mixed in', async () => {
    const rows = ['bienestar', 'convivencia', 'duelo', 'repaso'].map((id) => session(id));
    fetch.mockResolvedValueOnce({ landing: null, services: rows, steps: [] });

    const { items } = (await getLandingCopy()).services;

    expect(items.map(({ id }) => id)).toEqual(['bienestar', 'convivencia', 'duelo', 'repaso']);
    expect(items.map(({ title }) => title)).not.toContain(LANDING_DEFAULTS.services.items[0].title);
  });

  it('takes a single CMS step as the whole list', async () => {
    fetch.mockResolvedValueOnce({ landing: null, services: [], steps: [{ title: 'Hablamos', description: null }] });

    expect((await getLandingCopy())['how-it-works'].steps).toEqual([{ title: 'Hablamos' }]);
  });

  it('drops an item without a title, or a session without an id, and uses the defaults if none is left', async () => {
    fetch.mockResolvedValueOnce({
      landing: null,
      services: [session('sin-titulo', { title: '  ' }), session('  '), session('buena')],
      steps: [{ title: '' }, { title: 'Hablamos' }],
    });

    const copy = await getLandingCopy();
    expect(copy.services.items.map(({ id }) => id)).toEqual(['buena']);
    expect(copy['how-it-works'].steps.map(({ title }) => title)).toEqual(['Hablamos']);

    fetch.mockResolvedValueOnce({ landing: null, services: [session('x', { title: '' })], steps: [{ title: ' ' }] });

    const fallback = await getLandingCopy();
    expect(fallback.services.items).toEqual(LANDING_DEFAULTS.services.items);
    expect(fallback['how-it-works'].steps).toEqual(LANDING_DEFAULTS['how-it-works'].steps);
  });

  it('leaves a blank optional line out rather than filling it, and keeps an image only with an asset', async () => {
    fetch.mockResolvedValueOnce({
      landing: null,
      services: [
        session('sin-precio', { description: ' ', duration: '', modality: null, price: '   ', image: { _type: 'image' } }),
        session('con-imagen', { image }),
      ],
      steps: [],
    });

    const [bare, withImage] = (await getLandingCopy()).services.items;

    expect(bare.description).toBeUndefined();
    expect(bare.duration).toBeUndefined();
    expect(bare.modality).toBeUndefined();
    expect(bare.price).toBeUndefined();
    expect(bare.image).toBeUndefined();
    expect(withImage.image).toEqual(image);
  });

  it('passes the about image through only when it has an asset', async () => {
    const photo = { ...image, alt: 'Laura con un gato' };

    fetch.mockResolvedValueOnce({ landing: { 'about-teaser': { image: photo } } });
    expect((await getLandingCopy())['about-teaser'].image).toEqual(photo);

    fetch.mockResolvedValueOnce({ landing: { 'about-teaser': { image: { _type: 'image' } } } });
    expect((await getLandingCopy())['about-teaser'].image).toBeUndefined();
  });

  it('asks for everything with parameters, never by building the query', async () => {
    fetch.mockResolvedValueOnce(null);
    await getLandingCopy();

    const [query, params] = fetch.mock.calls[0] as [string, Record<string, string>];

    expect(query).toContain('_type == $landingType && _id == $landingId');
    expect(query).toContain('_type == $serviceType');
    expect(query).toContain('_type == $stepType');
    expect(query).not.toMatch(/_type == ["']/);
    expect(params).toEqual({ landingType: 'landing', landingId: 'landing', serviceType: 'service', stepType: 'step' });
  });
});
