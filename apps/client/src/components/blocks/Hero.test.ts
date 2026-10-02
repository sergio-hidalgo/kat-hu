import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Hero from './Hero.astro';
import { announcement } from '../../data/announcement';
import { LANDING_DEFAULTS } from '../../data/landing';
import { defaultFlags, type Flags } from '../../lib/flags';
import { BAND_SCREEN_MIN_H, CHROME_SCREEN_MIN_H } from '../site/header';

/**
 * The hero as the owner specified it on 2026-09-11/12 (spec 05), reskinned to
 * guide v2 (spec 05c): the gradient band filling the first screen below the
 * bar, the words and the page's one primary action in the light half, the
 * colour cut-out of Laura and her cat — whole, never cropped — pinned to the
 * bottom-right edge, and a botanical edge closing the band.
 */

const copy = LANDING_DEFAULTS.hero;

async function render(flags: Flags = defaultFlags()) {
  const container = await AstroContainer.create();
  return container.renderToString(Hero, { props: { copy, flags } });
}

/** Button's primary variant — the only filled Violeta action (HIE-01). */
const FILLED = /bg-violet text-cream hover:bg-violet-hover/g;

describe('Hero', () => {
  it('renders its headline and its primary action', async () => {
    const html = await render();

    expect(html).toMatch(new RegExp(`<h1 class="text-display text-violet">\\s*${copy.headline}\\s*</h1>`));
    expect(html).toContain(copy.lead);
    expect(html).toMatch(/<a[^>]*href="\/reservar"[^>]*>\s*Reserva tu sesión\s*<\/a>/);
    expect(html).toContain('data-block="hero"');
  });

  it('carries exactly one filled Violeta action (HIE-01)', async () => {
    const html = await render();

    expect(html.match(FILLED)).toHaveLength(1);
    // No white edge any more: the gradient gives the violet its own contrast.
    expect(html).not.toContain('border-white');
  });

  it('offers ¿Cómo funciona? beside it only while that block is visible (INT-02)', async () => {
    const html = await render();

    expect(html).toMatch(/href="#como-funciona" data-scroll-center class="[^"]*text-ink decoration-violet[^"]*">\s*¿Cómo funciona\?\s*<\/a>/);
    expect(await render({ ...defaultFlags(), 'block:how-it-works': false })).not.toContain(
      '#como-funciona',
    );
  });

  it('sizes the picture by the band’s height from lg, never past 62% of the width', async () => {
    const img = (await render()).match(/<img[^>]*alt="Laura, la florapeuta[^"]*"[^>]*>/)?.[0] ?? '';

    expect(img).toMatch(/lg:w-\[min\(62%,calc\(\(100svh_-_(8|5\.5)rem\)\*1\.58\)\)\]/);
    expect(img).not.toContain('lg:w-1/2');
  });

  it('is the gradient band, filling the first screen below the chrome', async () => {
    const html = await render();
    const section = html.match(/<section[^>]*>/)?.[0] ?? '';

    expect(section).toContain(announcement.enabled ? CHROME_SCREEN_MIN_H : BAND_SCREEN_MIN_H);
    expect(section).toMatch(/\bbg-hero\b/);
    expect(section).toContain('flex flex-col');
    // No photograph behind it and no tint over it.
    expect(html).not.toMatch(/lavender_fields|object-cover|bg-linear/);
  });

  it('keeps the words in the light half: a Violeta headline, the smaller words in Ink', async () => {
    const html = await render();

    expect(html).toMatch(/<div class="relative col-span-12 lg:col-span-6">\s*<h1/);
    expect(html).toMatch(/<p class="mt-6 text-lead text-ink">/);
    // On the owner's diagonal gradient Pizarra falls to 3.05:1, so the micro
    // line is Ink at every size.
    expect(html).toMatch(/text-sm text-ink italic">Todo online · Tus peludos no se mueven de casa</);
  });

  it('pins Laura and her cat to the bottom-right edge, whole and large, with no margin', async () => {
    const html = await render();
    const img = html.match(/<img[^>]*alt="Laura, la florapeuta[^"]*"[^>]*>/)?.[0] ?? '';
    const classes = img.match(/class="([^"]*)"/)?.[1].split(' ') ?? [];

    // Part of the composition, not a portrait: never cropped (owner, 2026-09-11).
    expect(img).toMatch(/\bwidth="1404" height="783"/);
    expect(classes).toEqual(expect.arrayContaining(['h-auto', 'rounded-none', 'mt-auto', 'self-end']));
    expect(classes).toEqual(expect.arrayContaining(['lg:absolute', 'lg:right-0', 'lg:bottom-0']));
    expect(classes).toEqual(expect.arrayContaining(['w-4/5', 'md:w-3/5']));
    expect(img).not.toMatch(/object-cover|aspect-|rounded-full|col-span|\b-?m[rb]-|\bp[rb]?-/);
    expect(img).toContain('fetchpriority="high"');
    expect(html.indexOf(img)).toBeGreaterThan(html.indexOf('Reserva tu sesión'));
  });

  it('lays a faint Violeta leaf on the right like the Terapeuta band’s, and a faint amber daisy behind the title, from lg', async () => {
    const html = await render();
    const tokens = (name: string) =>
      html.match(new RegExp(`<div[^>]*data-flora="line-${name}"[^>]*class="([^"]*)"`))?.[1].split(' ') ??
      html.match(new RegExp(`<div[^>]*class="([^"]*)"[^>]*data-flora="line-${name}"`))?.[1].split(' ') ??
      [];

    // The same place past the screen edge as the Terapeuta leaf (-right-16, w-48), in Violeta at 30%:
    // Glicina vanished on the gradient's Glicina end.
    // 40% larger than the Terapeuta leaf's w-48: w-67 (268px).
    expect(tokens('leaf')).toEqual(
      expect.arrayContaining(['-right-16', 'w-67', 'top-1/2', '-translate-y-1/2', 'text-violet', 'opacity-30', '-z-10', 'hidden', 'lg:block']),
    );
    expect(tokens('leaf')).not.toContain('text-wisteria');
    // Behind the words, reaching up past the band's top (clipped under the header), about 40% past the screen edge.
    expect(tokens('daisy')).toEqual(
      expect.arrayContaining([
        '-top-33',
        'xl:-top-42',
        '-z-10',
        '-left-[calc(4vw+3.75rem)]',
        'w-36',
        'xl:-left-[calc(4vw+5rem)]',
        'xl:w-48',
        'text-warning',
        'opacity-35',
        'hidden',
        'lg:block',
      ]),
    );
  });


  it('draws no edge of its own — the band after it draws its silhouette over the hero’s foot', async () => {
    const html = await render();

    expect(html).not.toContain('data-edge');
    // The white corners it wore under v1.5 are gone.
    expect(html).not.toContain('data-ornament');
  });
});
