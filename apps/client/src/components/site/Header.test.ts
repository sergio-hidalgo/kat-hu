import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it, vi } from 'vitest';

/**
 * The chrome renders on the server, so everything that must be true before a
 * single byte of JavaScript arrives is assertable here: the links, the
 * Spanish labels, the stripe following `announcement.enabled`, and the fact
 * that the band's height is only ever the one `header.ts` publishes.
 *
 * The scroll policy itself is not tested through the markup — it is a pure
 * function with its own suite in `lib/chrome-scroll.test.ts`.
 */

const LINKS = ['/reservar', '/sobre-kathu', '/drops', '/tienda'];

async function renderHeader(url = 'https://kathu.es/drops') {
  // Fresh module graph per render, so a mocked announcement is picked up.
  const { default: Header } = await import('./Header.astro');
  const container = await AstroContainer.create();
  return container.renderToString(Header, { request: new Request(url) });
}

describe('Header', () => {
  it('renders the four Spanish nav links', async () => {
    const html = await renderHeader();

    for (const href of LINKS) expect(html).toContain(`href="${href}"`);
    expect(html).toContain('Sobre kathu');
    expect(html).toContain('Reservar');
  });

  it('labels its controls in Spanish', async () => {
    const html = await renderHeader();

    expect(html).toContain('aria-label="Principal"');
    expect(html).toContain('aria-label="Abrir el menú"');
    expect(html).toContain('aria-label="Cerrar el menú"');
    expect(html).toContain('aria-label="kathu — inicio"');
  });

  it('marks the current page', async () => {
    const html = await renderHeader('https://kathu.es/drops');

    expect(html).toContain('href="/drops" aria-current="page"');
  });

  it('starts in the `top` state with an opaque band and one violet lockup', async () => {
    const html = await renderHeader();

    expect(html).toContain('data-band="top"');
    expect(html).toContain('bg-shell');
    // No knockout swap, ever: exactly one lockup in the band, and the light
    // variant is the footer's alone.
    expect(html).not.toContain('kathu-logo--light');
    expect(html).not.toContain('data-transparent');
  });

  it('takes its height only from header.ts', async () => {
    const { BAND_H } = await import('./header');
    const html = await renderHeader();

    expect(html).toContain(BAND_H);
    expect(html).not.toMatch(/h-16|h-18/);
  });

  it('renders the lockup as real text plus one inline SVG, not an image', async () => {
    const html = await renderHeader();

    expect(html).toContain('class="kathu-logo__word">kat<span>hu</span>');
    expect(html).toContain('viewBox="0 0 174 255"');
    expect(html).not.toContain('logo_text');
  });

  it('renders the mobile menu as a details disclosure with a white sheet', async () => {
    const html = await renderHeader();

    expect(html).toContain('<details');
    expect(html).toContain('<summary');
    expect(html).toContain('fixed inset-x-0 bottom-0 z-50 flex flex-col bg-white');
  });

  it('starts the sheet below the stripe, so opening the menu moves nothing', async () => {
    const { STRIPE_TOP } = await import('./header');
    const html = await renderHeader();

    expect(html).toContain(STRIPE_TOP);
    // …and takes the whole screen once the stripe has collapsed.
    expect(html).toContain('group-data-[band=glass]:top-0');
  });

  it('centres the sheet’s links and gives them no rules between', async () => {
    const html = await renderHeader();

    expect(html).toContain('flex-1 content-center');
    expect(html).toContain('flex list-none flex-col items-center');
    expect(html).not.toContain('<li class="border-b border-mist">');
  });

  it('renders the stripe when the announcement is enabled', async () => {
    // Read from the module, not retyped: the copy is the owner's to change.
    const { announcement } = await import('../../data/announcement');
    const html = await renderHeader();

    expect(announcement.enabled).toBe(true);
    expect(html).toContain(announcement.text);
    expect(html).toContain(announcement.linkLabel);
  });

  it('emits no stripe at all when the announcement is disabled', async () => {
    vi.resetModules();
    vi.doMock('../../data/announcement', () => ({
      announcement: { enabled: false, text: 'no debería aparecer' },
    }));

    const html = await renderHeader();

    expect(html).not.toContain('no debería aparecer');
    expect(html).not.toContain('bg-violet-700');

    vi.doUnmock('../../data/announcement');
    vi.resetModules();
  });
});
