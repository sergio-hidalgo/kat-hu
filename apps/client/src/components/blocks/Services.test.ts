import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Services from './Services.astro';
import { LANDING_DEFAULTS, type LandingCopy, type ServiceItem } from '../../data/landing';

const defaults = LANDING_DEFAULTS.services;

/** `count` synthetic sessions, as the owner might write them. */
const sessions = (count: number): ServiceItem[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `sesion-${index + 1}`,
    title: `Sesión número ${index + 1}`,
    description: 'Para ti y para Mochi.',
    features: ['Sesión de 45 minutos', 'Online'],
    preferred: false,
    price: '40 €',
  }));

async function render(copy: LandingCopy['services'] = defaults) {
  const container = await AstroContainer.create();
  return container.renderToString(Services, { props: { copy } });
}

const CARD_CELL = 'class="col-span-12 md:col-span-6 lg:col-span-4"';

describe('Services', () => {
  it('renders its headline and one card per default session, each booking that session', async () => {
    const html = await render();

    expect(html).toContain(defaults.headline);
    for (const item of defaults.items) {
      expect(html).toContain(item.title);
      expect(html).toContain(`href="/reservar?servicio=${item.id}"`);
    }
  });

  it.each([1, 3, 5])('renders %i sessions as that many cards, each on the same columns', async (count) => {
    const items = sessions(count);
    const html = await render({ ...defaults, items });

    expect(html.match(/href="\/reservar\?servicio=/g)).toHaveLength(count);
    expect(html.split(CARD_CELL).length - 1).toBe(count);
    for (const item of items) expect(html).toContain(`href="/reservar?servicio=${item.id}"`);
  });

  it('shows the price large, euro sign after it, and what the session includes as checks (guide §07)', async () => {
    const html = await render();

    for (const item of defaults.items) {
      expect(html).toMatch(new RegExp(`data-price[^>]*text-price[^>]*>\\s*${item.price}\\s*<`));
      expect(item.price).toMatch(/^\d+ €$/);
      for (const line of item.features) expect(html).toContain(line);
    }
  });

  it('gives the preferred session the badge and the one filled button; the rest stay Piedra', async () => {
    const items = sessions(5).map((item, index) => ({
      ...item,
      preferred: index === 1,
    }));
    const html = await render({ ...defaults, items });

    expect(html.match(/data-badge/g)).toHaveLength(1);
    expect(html.match(/bg-violet text-cream hover/g)).toHaveLength(1);
    expect(html.match(/bg-stone text-ink/g)).toHaveLength(4);
  });

  it('leans one línea-fina daisy in from the margin, on desktop only (guide §06)', async () => {
    const html = await render();
    const daisy = html.match(/<div[^>]*data-flora="line-daisy"[^>]*>/)?.[0] ?? '';

    expect(daisy).toContain('aria-hidden="true"');
    expect(daisy).toMatch(/\bhidden\b[^"]*\blg:block\b/);
    expect(daisy).toContain('-z-10');
  });

  it('words each button as the owner wrote it, and falls back to the default', async () => {
    const [first, second] = sessions(2);
    const html = await render({ ...defaults, items: [{ ...first, buttonLabel: 'Reserva tu sesión inicial' }, second] });

    expect(html).toContain('Reserva tu sesión inicial');
    expect(html).toContain('Reservar esta sesión');
  });

  it('shows a Piedra placeholder at the top of a card with no image', async () => {
    const html = await render({ ...defaults, items: sessions(2) });

    expect(html.match(/data-placeholder/g)).toHaveLength(2);
    expect(html).not.toContain('<img');
  });

  it('shows the owner’s image from the CDN, cropped to the card’s slot, with its alt, instead of the placeholder', async () => {
    const [first, second] = sessions(2);
    const html = await render({
      ...defaults,
      items: [
        {
          ...first,
          image: {
            _type: 'image',
            asset: {
              _ref: 'image-Tb9Ew8CXIwaY6R1kjMvI0uRR-600x600-png',
              _type: 'reference',
            },
            alt: ' Lavanda en acuarela ',
          },
        },
        second,
      ],
    });
    const img = html.match(/<img[^>]*>/)?.[0] ?? '';

    const src = img.match(/src="([^"]*)"/)?.[1].replaceAll('&amp;', '&') ?? '';
    const params = new URL(src).searchParams;

    expect(src).toMatch(/^https:\/\/cdn\.sanity\.io\/images\//);
    // Twice the slot's width for dense screens, at the slot's 13:6.
    expect(params.get('w')).toBe('800');
    expect(params.get('h')).toBe('369');
    expect(img).toContain('alt="Lavanda en acuarela"');
    expect(html.match(/data-placeholder/g)).toHaveLength(1);
  });

  it('puts its heading on a row of its own, so no card climbs up beside it', async () => {
    const html = await render();
    const heading = html.match(/<div class="([^"]*)">\s*<h2/)?.[1];

    // A full row on a phone; centred on the middle eight columns from md.
    expect(heading).toBe('col-span-12 text-center md:col-span-8 md:col-start-3');
  });
});
