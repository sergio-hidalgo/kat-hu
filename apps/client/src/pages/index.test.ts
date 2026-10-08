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
import { RHYTHM } from '../components/blocks/rhythm';

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

  it('puts nothing between two bands, so the rhythm’s sibling selectors hold (spec 05e)', async () => {
    const wrapper = main(await render());

    expect(wrapper).not.toMatch(/<\/section>\s*<(script|link|style)\b/);
  });

  it('removes a hidden block without leaving a section, a gap or a comment', async () => {
    const html = await render({ ...defaultFlags(), 'block:services': false });

    expect(rendered(html)).not.toContain('services');
    expect(html).not.toContain('Sesiones que se adaptan a tu casa');
    expect(main(html).match(/<section\b[^>]*data-block=/g)).toHaveLength(rendered(html).length);
    expect(main(html)).not.toContain('<!--');
  });

  it('shows a teaser only when its flag is on', async () => {
    expect(rendered(await render())).not.toContain('shop-teaser');

    const html = await render({ ...defaultFlags(), 'block:shop-teaser': true });
    // On, but spec 11 has not given it products: still nothing, still no gap.
    expect(main(html).match(/<section\b[^>]*data-block=/g)).toHaveLength(rendered(html).length);
  });

  it('drops the testimonials block, and only it, when there are none', async () => {
    vi.mocked(getTestimonials).mockResolvedValue([]);

    const ids = rendered(await render());
    expect(ids).not.toContain('testimonials');
    expect(ids).toContain('services');
  });

  it('keeps the filled primary actions to the hero’s and the one preferred session’s (HIE-01)', async () => {
    const html = await render();
    const hero = html.slice(
      html.indexOf('data-block="hero"'),
      html.indexOf('data-block="', html.indexOf('data-block="hero"') + 1),
    );

    expect(hero.match(/bg-violet text-cream hover:bg-violet-hover/g)).toHaveLength(1);
    // The owner's exception (2026-10-02): the preferred session's button is filled too.
    expect(html.match(/bg-violet text-cream hover:bg-violet-hover/g)).toHaveLength(2);
    expect(html.match(/data-badge/g)).toHaveLength(1);
  });

  it('wraps the blocks in the colour rhythm, each block a direct child band', async () => {
    const html = await render();
    const wrapper = (html.match(/<div data-landing class="([^"]*)">/)?.[1] ?? '').replaceAll('&amp;', '&');

    expect(wrapper).toBe(RHYTHM);
    // Every rendered block is a <section> straight under the wrapper, which
    // is what the structural selectors count.
    const inside = html.slice(html.indexOf('data-landing'));
    for (const id of rendered(html)) expect(inside).toMatch(new RegExp(`<section[^>]*data-block="${id}"`));
  });

  it('leaves the footer’s edge room to its last band, not to main (spec 05c)', async () => {
    const html = await render();

    expect(html).not.toMatch(/<main[^>]*pb-\(--edge-height\)/);
  });

  it('sets the hero title and every section title in Violeta (owner, 2026-09-28)', async () => {
    const titles = [...main(await render()).matchAll(/<h[12]\b[^>]*class="([^"]*)"/g)].map(([, c]) => c.split(' '));

    // hero, about, how it works, services, testimonials — the blog teaser is off by default.
    expect(titles.length).toBeGreaterThanOrEqual(5);
    for (const classes of titles) {
      expect(classes).toContain('text-violet');
      expect(classes).not.toContain('text-ink');
    }
  });

  it('starts the hero below the bar rather than under it', async () => {
    const html = await render();

    expect(html).toMatch(/<main[^>]*class="[^"]*\bpt-/);
  });
});
