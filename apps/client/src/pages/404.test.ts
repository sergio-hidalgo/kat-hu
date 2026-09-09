import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import NotFound from './404.astro';

/**
 * PAT-08 in one page: Spanish, a route back, and wording that says what to do
 * rather than what failed. Spec 10 replaces it with the real one, which also
 * has to answer a page hidden in `/admin` (issue I-010) — these assertions are
 * the floor it inherits, not a description of this file's markup.
 */

async function render() {
  const container = await AstroContainer.create();
  return container.renderToString(NotFound, {
    request: new Request('https://kathu.es/no-existe'),
  });
}

describe('404', () => {
  it('offers two ways back, one of them home', async () => {
    const html = await render();

    expect(html).toContain('href="/"');
    expect(html).toContain('Ir al inicio');
    expect(html).toContain('href="/drops/"');
  });

  it('keeps exactly one filled primary action', async () => {
    const html = await render();

    // HIE-01. The string is Button's primary variant; the skip link, the
    // stripe and the back-to-top all carry violet-700 with other classes.
    expect(
      (html.match(/bg-violet-700 text-cloud hover:bg-violet-600/g) ?? []).length,
    ).toBe(1);
  });

  it('says what to do, in Spanish, and never what failed', async () => {
    const html = await render();

    expect(html).toContain('No encontramos esta página');
    expect(html).toContain('Desde el inicio llegas a todo lo que');
    expect(html).not.toMatch(/404|Not Found|Error/);
  });

  it('leaves display type to a hero, which this page has not got', async () => {
    const html = await render();

    // Guide §2.4: display is hero-only and once per page.
    expect(html).toContain('text-h1');
    expect(html).not.toContain('text-display');
  });
});
