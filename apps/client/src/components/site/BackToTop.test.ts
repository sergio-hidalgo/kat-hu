import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import BackToTop from './BackToTop.astro';

/**
 * One circle, one arrow, and — before any script runs — nothing at all: the
 * button ships `hidden`, so it is never a focus stop while it is invisible.
 */
async function render() {
  const container = await AstroContainer.create();
  return container.renderToString(BackToTop);
}

describe('BackToTop', () => {
  it('ships hidden and labelled in Spanish', async () => {
    const html = await render();

    expect(html).toContain('hidden');
    expect(html).toContain('aria-label="Volver arriba"');
    expect(html).toContain('type="button"');
  });

  it('is one 48px violet circle with a single arrow', async () => {
    const html = await render();

    expect(html).toContain('h-12 w-12');
    expect(html).toContain('rounded-full');
    expect(html).toContain('bg-violet-700');
    expect((html.match(/<svg/g) ?? []).length).toBe(1);
    // No ring, no label, no second button.
    expect(html).not.toContain('progress');
    expect(html).not.toContain('Volver arriba<');
  });
});
