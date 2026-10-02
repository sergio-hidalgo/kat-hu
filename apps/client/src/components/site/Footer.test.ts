import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Footer from './Footer.astro';

/**
 * The footer's surface and padding belong to `.kathu-footer`, so what this
 * asserts is that the component *uses* it rather than re-deriving it. The band
 * carries no watermark since the owner's request of 2026-09-27.
 */

async function render() {
  const container = await AstroContainer.create();
  return container.renderToString(Footer);
}

describe('Footer', () => {
  it('uses the design system classes rather than hand-rolled utilities', async () => {
    const html = await render();

    expect(html).toContain('kathu-footer');
    // The violet, the isolation and the padding come from the class; setting
    // any of them here would be setting them twice.
    expect(html).not.toMatch(/bg-violet(?![\w-])/);
    expect(html).not.toContain('isolate');
    expect(html).not.toContain('overflow-hidden');
    expect(html).not.toContain('pt-16');
  });

  it('carries no watermark behind the content (owner, 2026-09-27)', async () => {
    const html = await render();

    expect(html).not.toContain('watermark');
    expect(html).not.toContain('viewBox="0 0 852 189"');
  });

  it('centres the copyright and the disclaimer, and nothing else', async () => {
    const html = await render();

    expect(html).toContain('col-span-12 text-center');
    // The columns above keep their own alignment.
    expect(html).not.toContain('lg:col-start-5 text-center');
  });

  it('starts its three columns at grid columns 5, 8 and 11 from lg', async () => {
    const html = await render();

    expect(html).toContain('lg:col-start-5');
    expect(html).toContain('lg:col-start-8');
    expect(html).toContain('lg:col-start-11');
    expect(html).toContain('lg:col-span-2');
  });

  it('carries the three Spanish column headings and the contact line', async () => {
    const html = await render();

    expect(html).toContain('Navegación');
    expect(html).toContain('Legal');
    expect(html).toContain('Contacto');
    expect(html).toContain('hola@kat-hu.com');
  });

  it('puts the veterinary disclaimer in Lavanda under the copyright', async () => {
    const html = await render();

    expect(html).toContain('Todos los derechos reservados');
    expect(html).toMatch(
      /text-lavender">\s*kathu no sustituye la atención veterinaria\. Consulta siempre con tu\s+veterinaria de referencia\./,
    );
    expect(html).not.toMatch(/\btext-white\b/);
  });

  it('sets column titles in Crema and links in Lavanda that turn Crema on hover (guide §07)', async () => {
    const html = await render();

    expect(html).toMatch(/<h2 id="footer-navegación" class="font-body text-xs font-bold text-cream"/);
    expect((html.match(/text-lavender no-underline transition-colors duration-fast hover:text-cream hover:underline/g) ?? []).length).toBe(8);
  });

  it('opens with the closing botanical edge, the dog, the rabbit and the cat, over the band above', async () => {
    const html = await render();
    const edge = html.match(/<div[^>]*data-edge="footer"[^>]*>/)?.[0] ?? '';

    expect(edge).toContain('aria-hidden="true"');
    expect(edge).toContain('bottom-[calc(100%-1px)]');
    expect(edge).toContain('text-violet');
    // A sibling of the band, drawn first.
    expect(html.indexOf('data-edge="footer"')).toBeLessThan(html.indexOf('class="kathu-footer"'));
  });

  it('wears the inverted lockup, 20% up on the guide’s 24px', async () => {
    const html = await render();

    expect(html).toContain('kathu-logo kathu-logo--light');
    expect(html).toContain('font-size: 29px');
  });

  it('gives every column link a 44px target, on the anchor', async () => {
    const html = await render();

    // Eight links across the three columns. The height has to be on the
    // anchor: padding on the `li` is dead space around a 25.6px line box
    // (INT-01, guide §9, spec 03e).
    expect((html.match(/inline-flex min-h-11 items-center/g) ?? []).length).toBe(8);
    expect(html).not.toContain('<li class="py-1">');
  });

  it('pairs Navegación and Legal on one row on a phone, centred as a block', async () => {
    const html = await render();

    // Four columns starting at 3 and at 7 are symmetric about the grid's
    // centre line, so the two lists read as one centred block rather than two
    // lists pushed to the edges. Contacto keeps its own row — its one link is
    // the longest label in the footer.
    expect(html).toContain('col-span-4 col-start-3');
    expect(html).toContain('col-span-4 col-start-7');
    expect(html).toContain('col-span-12 sm:col-span-4');
    // …and `sm` releases the phone's explicit start, or the three columns
    // could not share a row from 480px up.
    expect((html.match(/sm:col-start-auto/g) ?? []).length).toBe(2);
  });

  it('centres everything below lg and ranges it left from lg', async () => {
    const html = await render();

    // The brand block and all three columns.
    expect((html.match(/text-center/g) ?? []).length).toBe(5);
    expect((html.match(/lg:text-left/g) ?? []).length).toBe(4);
    // From sm the three columns still sit side by side.
    expect((html.match(/sm:col-span-4/g) ?? []).length).toBe(3);
  });
});
