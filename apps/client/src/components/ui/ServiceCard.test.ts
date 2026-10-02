import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import ServiceCard from './ServiceCard.astro';

/**
 * The session card takes whatever the owner wrote (spec 05b): every line is
 * optional, an empty one is left out rather than filled, and the picture slot
 * keeps one shape whether it holds the owner's image or the stand-in (CON-03).
 * The owner's mix of mock-up and Figma: image on top, title, subtitle, price,
 * up to three checks and a full-width button; the preferred session wears a
 * badge and the filled button.
 */

const full = {
  title: 'Sesión de bienestar',
  description: 'Para ti y para Mochi.',
  price: '40 €',
  features: ['Sesión de 45 minutos', 'Online', 'Esencias a medida'],
  href: '/reservar?servicio=bienestar',
  actionLabel: 'Reservar esta sesión',
};

async function render(props: Record<string, unknown>) {
  const container = await AstroContainer.create();
  return container.renderToString(ServiceCard, { props });
}

describe('ServiceCard', () => {
  it('shows the owner’s image across the top, in the 13:6 slot, with the alt it was given', async () => {
    const html = await render({
      ...full,
      image: { src: 'https://cdn.sanity.io/x.png', alt: 'Lavanda en acuarela' },
    });
    const img = html.match(/<img[^>]*>/)?.[0] ?? '';

    expect(img).toContain('src="https://cdn.sanity.io/x.png"');
    expect(img).toContain('alt="Lavanda en acuarela"');
    expect(img).toMatch(/class="[^"]*\baspect-\[13\/6\][^"]*\bobject-cover\b/);
    expect(html).not.toContain('data-placeholder');
  });

  it('keeps an empty alt for a decorative image', async () => {
    const html = await render({
      ...full,
      image: { src: 'https://cdn.sanity.io/x.png', alt: '' },
    });
    const img = html.match(/<img[^>]*>/)?.[0] ?? '';

    // Astro may print an empty attribute bare; `alt` and `alt=""` are the same to a browser.
    expect(img).toMatch(/\salt(=""|[\s>/])/);
    expect(img).not.toMatch(/\salt="[^"]+"/);
  });

  it('holds the same slot with a Piedra block when there is no image', async () => {
    const html = await render(full);

    expect(html).not.toContain('<img');
    expect(html).toMatch(/data-placeholder aria-hidden="true" class="[^"]*\baspect-\[13\/6\][^"]*\bbg-stone\b/);
  });

  it('shows the price large, in Urbanist with tabular figures', async () => {
    const price = (await render(full)).match(/<p data-price class="([^"]*)"[^>]*>\s*40 €\s*</)?.[1] ?? '';

    expect(price.split(' ')).toEqual(expect.arrayContaining(['font-body', 'text-price', 'tabular-nums']));
  });

  it('leaves out the price when there is none, but keeps the full-width button at the bottom', async () => {
    const html = await render({ ...full, price: undefined });

    expect(html).not.toContain('data-price');
    expect(html).not.toContain('€');
    expect(html).toMatch(
      /<div class="mt-auto flex flex-col pt-5">\s*<a[^>]*href="\/reservar\?servicio=bienestar"[^>]*class="[^"]*\bw-full\b/,
    );
  });

  it('lists what the session includes as checks, only the lines there are', async () => {
    const three = await render(full);
    expect(three.match(/<li class="flex items-center gap-2 text-sm text-graphite">/g)).toHaveLength(3);
    expect(three).toContain('Esencias a medida');

    const one = await render({ ...full, features: ['Online'] });
    expect(one.match(/<li\b/g)).toHaveLength(1);

    const none = await render({ ...full, features: [] });
    expect(none).not.toContain('<ul');
  });

  it('writes no default text into a card the owner left almost empty', async () => {
    const html = await render({
      title: 'Sesión corta',
      href: '/reservar?servicio=corta',
      actionLabel: 'Reservar esta sesión',
    });

    expect(html).toContain('Sesión corta');
    expect(html).not.toMatch(/Online|min\b|€|text-graphite|Preferido/);
  });

  it('keeps its elements in one order: image, title, subtitle, price, checks, button', async () => {
    const html = await render(full);
    const positions = [
      'data-placeholder',
      full.title,
      full.description,
      full.price,
      full.features[0],
      full.actionLabel,
    ].map((text) => html.indexOf(text));

    expect(positions.every((position) => position > -1)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });

  it('marks the preferred session with a centred badge and the filled Violeta button', async () => {
    const html = await render({ ...full, preferred: true });
    const badge = html.match(/<span\s+data-badge[^>]*class="([^"]*)"[^>]*>\s*Preferido\s*</)?.[1] ?? '';

    expect(badge.split(' ')).toEqual(
      expect.arrayContaining(['left-1/2', '-translate-x-1/2', 'top-0', '-translate-y-1/2']),
    );
    expect(badge).toMatch(/\bbg-violet\b/);
    expect(html).toMatch(/bg-violet text-cream/);
    expect(html).not.toMatch(/bg-stone text-ink/);
  });

  it('keeps an ordinary session with the Piedra button and no badge', async () => {
    const html = await render(full);

    expect(html).not.toContain('Preferido');
    expect(html).toMatch(/bg-stone text-ink/);
  });
});
