import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Footer from './Footer.astro';

/**
 * The footer's surface, padding and watermark placement belong to the design
 * system's `.kathu-footer` / `.kathu-footer__watermark` classes, so what this
 * asserts is that the component *uses* them rather than re-deriving them —
 * plus the two things the guide's footer demo has and ours used to lack.
 */

async function render() {
  const container = await AstroContainer.create();
  return container.renderToString(Footer);
}

describe('Footer', () => {
  it('uses the design system classes rather than hand-rolled utilities', async () => {
    const html = await render();

    expect(html).toContain('kathu-footer');
    expect(html).toContain('kathu-footer__watermark');
    // The violet, the isolation and the padding come from the class; setting
    // any of them here would be setting them twice.
    expect(html).not.toContain('bg-violet-900');
    expect(html).not.toContain('isolate');
    expect(html).not.toContain('overflow-hidden');
    expect(html).not.toContain('pt-16');
  });

  it('inlines the watermark as decoration, out of the accessibility tree', async () => {
    const html = await render();

    expect(html).toMatch(/<svg class="kathu-footer__watermark[^"]*" aria-hidden="true"/);
    expect(html).toContain('focusable="false"');
    expect(html).toContain('viewBox="0 0 852 189"');
    expect(html).toContain('preserveAspectRatio="xMinYMax slice"');
    // It takes its colour from CSS, so it must be currentColor and not a hex.
    expect(html).toContain('fill="currentColor"');
    expect(html).not.toMatch(/#[0-9a-fA-F]{3,8}/);
  });

  it('runs the watermark the full width of the footer', async () => {
    const html = await render();

    // `max-w-none` removes the design system's 1320px cap; it is the only
    // `max-w-*` the grid rule allows, because it never chooses a width.
    expect(html).toContain('class="kathu-footer__watermark max-w-none"');
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

  it('puts the veterinary disclaimer in White under the copyright', async () => {
    const html = await render();

    expect(html).toContain('Todos los derechos reservados');
    expect(html).toMatch(
      /text-white">\s*kathu no sustituye la atención veterinaria\. Consulta siempre con tu\s+veterinaria de referencia\./,
    );
  });

  it('wears the knockout lockup, 20% up on the guide’s 24px', async () => {
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
