import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Button from './Button.astro';

/**
 * The knockout edge (spec 05): a primary button over a photograph gets a thin
 * white border, because its violet fill has no edge against a dark image. The
 * variants themselves predate this suite and are shown on `/estilo`.
 */

async function render(props: Record<string, unknown>) {
  const container = await AstroContainer.create();
  return container.renderToString(Button, { props, slots: { default: 'Reserva tu sesión' } });
}

describe('Button', () => {
  it('edges a primary button over a photograph in white', async () => {
    const html = await render({ href: '/reservar', knockout: true });

    expect(html).toContain('bg-violet-700');
    expect(html).toMatch(/class="[^"]*\bborder border-white\b/);
  });

  it('has no white edge by default', async () => {
    expect(await render({ href: '/reservar' })).not.toContain('border-white');
  });

  it('keeps the edge off the variants that draw their own, and off a disabled button', async () => {
    expect(await render({ variant: 'secondary', knockout: true })).not.toContain('border-white');
    expect(await render({ variant: 'quiet', knockout: true })).not.toContain('border-white');
    expect(await render({ disabled: true, knockout: true })).not.toContain('border-white');
  });
});
