import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Testimonial from './Testimonial.astro';
import { initials } from './initials';

/** Guide v2 §07, *Testimonios* (spec 05c). Synthetic people only. */
async function render(props: Record<string, unknown>) {
  const container = await AstroContainer.create();
  return container.renderToString(Testimonial, {
    props,
    slots: { default: 'Mochi vuelve a dormir tranquilo.' },
  });
}

describe('Testimonial', () => {
  it('is the services’ card, quoting in Latin quotation marks', async () => {
    const html = await render({ name: 'Ana García', cat: 'Mochi' });

    expect(html).toMatch(/^<figure class="[^"]*\bbg-cream\b[^"]*\bshadow-sm\b/);
    expect(html).toContain('«Mochi vuelve a dormir tranquilo.»');
    expect(html).not.toMatch(/\bitalic\b/);
  });

  it('signs with initials, the name in Lora and “Familia de …”', async () => {
    const html = await render({ name: 'Ana García', cat: 'Mochi' });

    expect(html).toMatch(/<span aria-hidden="true" class="[^"]*\bbg-stone\b[^"]*\btext-ink\b[^"]*">\s*AG\s*<\/span>/);
    expect(html).toMatch(/font-heading[^>]*>Ana García</);
    expect(html).toContain('Familia de Mochi');
  });

  it('leaves the family line out when there is no cat’s name', async () => {
    const html = await render({ name: 'Ana García' });

    expect(html).toContain('Ana García');
    expect(html).not.toContain('Familia de');
  });
});

describe('initials', () => {
  it.each([
    ['Ana García', 'AG'],
    ['Ana', 'A'],
    ['  luis  pérez  ruiz ', 'LP'],
    ['Álvaro Íñiguez', 'ÁÍ'],
    ['', ''],
  ])('%j → %j', (name, letters) => {
    expect(initials(name)).toBe(letters);
  });
});
