import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Button from './Button.astro';

/**
 * Guide v2 §07's buttons (spec 05c): 48px, one radius, Urbanist 500, and three
 * filled variants plus the disabled look, which must never be confused with
 * the filled Piedra secondary.
 */

async function render(props: Record<string, unknown>) {
  const container = await AstroContainer.create();
  return container.renderToString(Button, { props, slots: { default: 'Reserva tu sesión' } });
}

const classes = (html: string) => html.match(/class="([^"]*)"/)?.[1].split(' ') ?? [];

describe('Button', () => {
  it('is 48px, 8px radius, Urbanist 500 on one line', async () => {
    const list = classes(await render({ href: '/reservar' }));

    expect(list).toEqual(
      expect.arrayContaining(['h-12', 'rounded', 'font-body', 'font-medium', 'whitespace-nowrap']),
    );
  });

  it('fills the primary in Violeta with a Crema label, darker on hover and press', async () => {
    const list = classes(await render({ href: '/reservar' }));

    expect(list).toEqual(
      expect.arrayContaining(['bg-violet', 'text-cream', 'hover:bg-violet-hover', 'active:bg-violet-active']),
    );
  });

  it('fills the secondary in Piedra with an Ink label', async () => {
    const list = classes(await render({ variant: 'secondary' }));

    expect(list).toEqual(expect.arrayContaining(['bg-stone', 'text-ink', 'hover:bg-stone-hover']));
    expect(list).not.toContain('bg-violet');
  });

  it('turns Crema with a Violeta label on a Violeta surface', async () => {
    const list = classes(await render({ variant: 'on-violet' }));

    expect(list).toEqual(expect.arrayContaining(['bg-cream', 'text-violet', 'hover:bg-lavender']));
  });

  it('draws a disabled button as a dashed outline, never a fill, and says why', async () => {
    const html = await render({ disabled: true, disabledReason: 'Elige antes una franja' });

    expect(html).toContain('border-dashed border-stone-strong bg-transparent text-slate');
    expect(html).not.toMatch(/\bbg-stone\b/);
    expect(html).toContain('aria-disabled="true"');
    expect(html).toContain('Elige antes una franja');
  });

  it('renders a link with href and a button with a type', async () => {
    expect(await render({ href: '/reservar' })).toMatch(/^<a\b[^>]*href="\/reservar"/);
    expect(await render({ type: 'submit' })).toMatch(/^<button\b[^>]*type="submit"/);
  });
});
