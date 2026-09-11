import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { BLOCKS } from '@kat-hu/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../data/landing', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../data/landing')>();
  return { ...actual, getLandingCopy: vi.fn(async () => actual.LANDING_DEFAULTS) };
});
vi.mock('../data/testimonials', () => ({ getTestimonials: vi.fn() }));
vi.mock('../data/posts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../data/posts')>()),
  getLatestPosts: vi.fn(async () => []),
}));
vi.mock('../lib/likes', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../lib/likes')>()),
  getLikeCounts: vi.fn(async () => ({})),
}));

import Index from './index.astro';
import { getTestimonials } from '../data/testimonials';
import { defaultFlags, type Flags } from '../lib/flags';

/**
 * The landing is the registry, rendered (spec 05): visible blocks in registry
 * order, a hidden one gone without a trace, and one filled action on the page.
 */

async function render(flags: Flags = defaultFlags()) {
  const container = await AstroContainer.create();
  return container.renderToString(Index, {
    locals: { flags, session: null },
    request: new Request('https://kathu.es/'),
  });
}

const main = (html: string) => html.slice(html.indexOf('<main'), html.indexOf('</main>'));
const rendered = (html: string) => [...main(html).matchAll(/data-block="([^"]+)"/g)].map(([, id]) => id);

beforeEach(() => {
  vi.mocked(getTestimonials).mockResolvedValue([
    { id: 't1', quote: 'Mochi vuelve a dormir tranquilo.', name: 'Ana García', cat: 'Mochi' },
    { id: 't2', quote: 'Nube y Trufa ya comparten sofá.', name: 'Luis Pérez', cat: 'Nube' },
  ]);
});

describe('landing page', () => {
  it('renders the visible blocks in registry order', async () => {
    const expected = BLOCKS.filter(({ defaultVisible }) => defaultVisible).map(({ id }) => id);

    expect(rendered(await render())).toEqual(expected);
  });

  it('removes a hidden block without leaving a section, a gap or a comment', async () => {
    const html = await render({ ...defaultFlags(), 'block:services': false });

    expect(rendered(html)).not.toContain('services');
    expect(html).not.toContain('Sesiones que se adaptan a tu casa');
    expect(main(html).match(/<section\b/g)).toHaveLength(rendered(html).length);
    expect(main(html)).not.toContain('<!--');
  });

  it('shows a teaser only when its flag is on', async () => {
    expect(rendered(await render())).not.toContain('shop-teaser');

    const html = await render({ ...defaultFlags(), 'block:shop-teaser': true });
    // On, but spec 11 has not given it products: still nothing, still no gap.
    expect(main(html).match(/<section\b/g)).toHaveLength(rendered(html).length);
  });

  it('drops the testimonials block, and only it, when there are none', async () => {
    vi.mocked(getTestimonials).mockResolvedValue([]);

    const ids = rendered(await render());
    expect(ids).not.toContain('testimonials');
    expect(ids).toContain('cta');
  });

  it('keeps exactly one filled primary action on the page (HIE-01)', async () => {
    const html = await render();

    expect(html.match(/bg-violet-700 text-cloud hover:bg-violet-600/g)).toHaveLength(1);
  });

  it('starts the hero below the bar rather than under it', async () => {
    const html = await render();

    expect(html).toMatch(/<main[^>]*class="[^"]*\bpt-/);
  });
});
