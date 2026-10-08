import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Carousel from './Carousel.astro';

async function render(props: Record<string, unknown> = {}) {
  const container = await AstroContainer.create();
  return container.renderToString(Carousel, {
    props: { label: 'Sesiones', ...props },
    slots: { default: '<div>uno</div><div>dos</div>' },
  });
}

describe('Carousel (spec 05e)', () => {
  it('is a labelled carousel region around a focusable track', async () => {
    const html = await render();

    // A `section` with a name is the region landmark; no `role` needed.
    expect(html).toMatch(/<section data-carousel[^>]*aria-roledescription="carousel"/);
    expect(html).not.toContain('role="region"');
    expect(html).toContain('aria-roledescription="carousel"');
    expect(html).toContain('aria-label="Sesiones"');
    expect(html).toMatch(/<div[^>]*data-track[^>]*tabindex="0"/);
    expect(html).toContain('aria-label="Sesiones, desliza para ver más"');
  });

  it('is a scroll-snap track only below lg by default, with the dots hidden from lg', async () => {
    const html = await render();

    expect(html).toContain('max-lg:snap-x');
    expect(html).toContain('max-lg:auto-cols-[100%]');
    expect(html).toContain('max-lg:overflow-x-auto');
    expect(html).toMatch(/data-dots[^>]*class="[^"]*lg:hidden/);
  });

  it('scrolls at every width with scrollFrom="always", dots included', async () => {
    const html = await render({ scrollFrom: 'always' });

    expect(html).toContain('snap-x snap-mandatory auto-cols-[100%]');
    expect(html).not.toContain('max-lg:snap-x');
    expect(html).not.toMatch(/data-dots[^>]*class="[^"]*lg:hidden/);
  });

  it('only advances on its own when asked to', async () => {
    expect(await render()).not.toContain('data-autoplay');
    expect(await render({ autoplay: true })).toContain('data-autoplay');
  });

  it('can be a numbered list, and takes the block’s own layout from lg', async () => {
    const html = await render({ trackAs: 'ol', trackClass: 'lg:grid-cols-subgrid' });

    expect(html).toMatch(/<ol role="list" data-track/);
    expect(html).toContain('lg:grid-cols-subgrid');
  });

  it('has 44px dots (INT-01) with a 12px dot drawn inside', async () => {
    const html = await render();

    expect(html).toMatch(/<template data-dot>\s*<button[^>]*class="[^"]*\bsize-11\b/);
    expect(html).toContain('size-3 rounded-full');
  });

  it('renders the cards it is given, in order', async () => {
    const html = await render();

    expect(html.indexOf('uno')).toBeGreaterThan(-1);
    expect(html.indexOf('dos')).toBeGreaterThan(html.indexOf('uno'));
  });
});
