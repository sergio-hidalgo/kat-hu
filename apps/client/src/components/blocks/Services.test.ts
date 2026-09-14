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
    duration: '45 min',
    modality: 'Online',
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

  it('shows duration • modality and the price with the euro sign after it (guide §7.4)', async () => {
    const html = await render();

    for (const item of defaults.items) {
      expect(html).toContain(item.price);
      expect(html).toContain(`${item.duration}<span class="text-mist"> • </span>${item.modality}`);
    }
  });

  it('keeps every card button outlined — the page’s one filled action is the hero’s (HIE-01)', async () => {
    const html = await render({ ...defaults, items: sessions(5) });

    expect(html).not.toContain('bg-violet-700 text-cloud');
    expect(html.match(/border border-violet-700 text-violet-700/g)).toHaveLength(5);
  });

  it('cycles the stand-ins by position, so the default three look as they did', async () => {
    const html = await render({ ...defaults, items: sessions(4) });

    expect([...html.matchAll(/data-spot="([a-z]+)"/g)].map(([, name]) => name)).toEqual([
      'flower',
      'cat',
      'sprout',
      'flower',
    ]);
  });

  it('shows the owner’s image from the CDN within twice the slot, uncropped, with its alt, instead of the stand-in', async () => {
    const [first, second] = sessions(2);
    const html = await render({
      ...defaults,
      items: [
        {
          ...first,
          image: {
            _type: 'image',
            asset: { _ref: 'image-Tb9Ew8CXIwaY6R1kjMvI0uRR-600x600-png', _type: 'reference' },
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
    expect(params.get('w')).toBe('320');
    // A width and a height together make the URL builder crop to that aspect.
    expect(params.has('h')).toBe(false);
    expect(params.has('rect')).toBe(false);
    expect(img).toContain('alt="Lavanda en acuarela"');
    expect(html.match(/data-spot=/g)).toHaveLength(1);
  });

  it('puts its heading on a row of its own, so no card climbs up beside it', async () => {
    const html = await render();
    const heading = html.match(/<div class="([^"]*)">\s*<h2/)?.[1];

    expect(heading).toBe('col-span-12');
  });
});
