import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import ServiceCard from './ServiceCard.astro';

/**
 * The session card takes whatever the owner wrote (spec 05b): every line under
 * the title is optional, an empty one is left out rather than filled, and the
 * slot is 160×160 whether it holds the owner's image or the stand-in (CON-03).
 */

const full = {
  title: 'Sesión de bienestar',
  description: 'Para ti y para Mochi.',
  duration: '45 min',
  modality: 'Online',
  price: '40 €',
  href: '/reservar?servicio=bienestar',
  actionLabel: 'Reservar esta sesión',
  illustration: 'flower' as const,
};

async function render(props: Record<string, unknown>) {
  const container = await AstroContainer.create();
  return container.renderToString(ServiceCard, { props });
}

describe('ServiceCard', () => {
  it('shows the owner’s image whole in the 160×160 slot, with the alt it was given', async () => {
    const html = await render({ ...full, image: { src: 'https://cdn.sanity.io/x.png', alt: 'Lavanda en acuarela' } });
    const img = html.match(/<img[^>]*>/)?.[0] ?? '';

    expect(img).toContain('src="https://cdn.sanity.io/x.png"');
    expect(img).toContain('alt="Lavanda en acuarela"');
    expect(img).toContain('width="160"');
    expect(img).toContain('height="160"');
    expect(img).toMatch(/class="[^"]*\bsize-40\b[^"]*\bobject-contain\b/);
    // The base layer rounds every image by 8px; a watercolour keeps its edges.
    expect(img).toMatch(/class="[^"]*\brounded-none\b/);
    expect(img).not.toMatch(/object-cover|aspect-/);
    expect(html).not.toContain('data-spot');
  });

  it('keeps an empty alt for a decorative image', async () => {
    const html = await render({ ...full, image: { src: 'https://cdn.sanity.io/x.png', alt: '' } });
    const img = html.match(/<img[^>]*>/)?.[0] ?? '';

    // Astro may print an empty attribute bare; `alt` and `alt=""` are the same to a browser.
    expect(img).toMatch(/\salt(=""|[\s>/])/);
    expect(img).not.toMatch(/\salt="[^"]+"/);
  });

  it('draws the stand-in in the same slot when there is no image', async () => {
    const html = await render(full);

    expect(html).not.toContain('<img');
    expect(html).toMatch(/data-spot="flower"[^>]*class="[^"]*size-40/);
  });

  it('leaves out the price when there is none, but keeps the button at the bottom', async () => {
    const html = await render({ ...full, price: undefined });

    expect(html).not.toContain('text-h4 text-violet-700');
    expect(html).not.toContain('€');
    expect(html).toMatch(/<div class="mt-auto flex flex-col pt-4">\s*<a[^>]*href="\/reservar\?servicio=bienestar"/);
  });

  it('shows duration and modality with a dot only when both are there', async () => {
    expect(await render(full)).toContain('45 min<span class="text-mist"> • </span>Online');

    const durationOnly = await render({ ...full, modality: undefined });
    expect(durationOnly).toContain('45 min');
    expect(durationOnly).not.toContain(' • ');

    const neither = await render({ ...full, duration: undefined, modality: undefined });
    expect(neither).not.toContain('text-xs text-slate');
  });

  it('writes no default text into a card the owner left almost empty', async () => {
    const html = await render({ title: 'Sesión corta', href: '/reservar?servicio=corta', actionLabel: 'Reservar esta sesión', illustration: 'cat' });

    expect(html).toContain('Sesión corta');
    expect(html).not.toMatch(/Online|min\b|€|text-graphite/);
  });

  it('keeps its elements in one order: title, description, meta, price, button', async () => {
    const html = await render(full);
    const positions = [full.title, full.description, full.duration, full.price, full.actionLabel].map((text) =>
      html.indexOf(text),
    );

    expect(positions.every((position) => position > -1)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });
});
