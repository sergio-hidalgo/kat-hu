import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Field from './Field.astro';
import Toast from './Toast.astro';

/** Guide v2 §07, *Formularios* and *Avisos* (spec 05c). */
async function render(component: typeof Field | typeof Toast, props: Record<string, unknown>, slot?: string) {
  const container = await AstroContainer.create();
  return container.renderToString(component, { props, slots: slot ? { default: slot } : {} });
}

describe('Field', () => {
  it('marks the optional field, not the required one — and only when told', async () => {
    expect(await render(Field, { for: 'nombre', label: 'Nombre', required: true })).not.toContain('(opcional)');
    expect(await render(Field, { for: 'telefono', label: 'Teléfono', optional: true })).toContain('(opcional)');
    // A slotted control may carry `required` itself; the label never guesses.
    expect(await render(Field, { for: 'mensaje', label: 'Mensaje' })).not.toMatch(/\((opcional|obligatorio)\)/);
  });

  it('is a 48px Crema control with a Piedra-fuerte border and a Violeta focus', async () => {
    const input = (await render(Field, { for: 'email', label: 'Email', type: 'email' })).match(/<input[^>]*>/)?.[0] ?? '';

    expect(input).toMatch(/class="[^"]*\bh-12\b[^"]*"/);
    expect(input).toContain('bg-cream');
    expect(input).toContain('border border-stone-strong');
    expect(input).toContain('focus:border-violet');
  });

  it('says what to fix, with an icon, and a 2px error border', async () => {
    const html = await render(Field, { for: 'telefono', label: 'Teléfono', error: 'Escribe un número de nueve cifras' });

    expect(html).toContain('border-2 border-error');
    expect(html).toContain('aria-invalid="true"');
    expect(html).toMatch(/<p id="telefono-error"[^>]*text-error[^>]*>[\s\S]*<svg[\s\S]*Escribe un número de nueve cifras/);
  });
});

describe('Toast', () => {
  it.each([
    ['success', 'border-l-success', 'role="status"'],
    ['info', 'border-l-violet', 'role="status"'],
    ['warning', 'border-l-warning-accent', 'role="status"'],
    ['error', 'border-l-error', 'role="alert"'],
  ])('%s: a 4px accent, an icon, Ink text, and announced (%s)', async (state, accent, role) => {
    const html = await render(Toast, { state }, 'Texto del aviso.');

    expect(html).toContain('border-l-4');
    expect(html).toContain(accent);
    expect(html).toContain('<svg');
    expect(html).toContain('text-sm text-ink');
    expect(html).toContain(role);
  });

  it('never writes text or the icon in the bright amber', async () => {
    const html = await render(Toast, { state: 'warning' }, 'Esta franja se llena a menudo.');

    expect(html).not.toMatch(/text-warning-accent/);
    expect(html).toContain('text-warning');
  });
});
