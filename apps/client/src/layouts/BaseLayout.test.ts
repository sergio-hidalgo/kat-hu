import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it, vi } from 'vitest';
import { BAND_PT, CHROME_PT } from '../components/site/header';

/**
 * The chrome is `fixed`, so the layout is the one place that has to know how
 * tall it is — and it must know it from `header.ts`, never by repeating a
 * number. Which of the two paddings applies is decided here, on the server,
 * which is what keeps the stripe from costing a layout shift.
 */
async function renderLayout() {
  const { default: BaseLayout } = await import('./BaseLayout.astro');
  const container = await AstroContainer.create();
  return container.renderToString(BaseLayout, {
    props: { title: 'Prueba' },
    slots: { default: '<p>contenido</p>' },
    request: new Request('https://kathu.es/prueba'),
  });
}

describe('BaseLayout', () => {
  it('clears the stripe and the band when the announcement is on', async () => {
    const html = await renderLayout();

    expect(html).toContain(CHROME_PT);
    expect(html).not.toMatch(/pt-16 md:pt-18/);
  });

  it('clears only the band when the announcement is off', async () => {
    vi.resetModules();
    vi.doMock('../data/announcement', () => ({
      announcement: { enabled: false, text: 'sin franja' },
    }));

    const html = await renderLayout();

    expect(html).toContain(BAND_PT);
    expect(html).not.toContain(CHROME_PT);

    vi.doUnmock('../data/announcement');
    vi.resetModules();
  });

  it('renders the skip link, the chrome and the back-to-top button once each', async () => {
    const html = await renderLayout();

    expect(html).toContain('Saltar al contenido');
    expect((html.match(/id="site-chrome"/g) ?? []).length).toBe(1);
    expect((html.match(/id="back-to-top"/g) ?? []).length).toBe(1);
    expect(html).toContain('lang="es"');
  });
});
