import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Hero from './Hero.astro';
import { announcement } from '../../data/announcement';
import { LANDING_DEFAULTS } from '../../data/landing';
import { defaultFlags, type Flags } from '../../lib/flags';
import { BAND_SCREEN_MIN_H, BAND_TOP, CHROME_SCREEN_MIN_H, CHROME_TOP } from '../site/header';
import { KNOCKOUT_TONE } from '../ui/ornament';

/**
 * The hero as the owner specified it on 2026-09-11/12 (spec 05): a photograph
 * filling the first screen below the bar, four white corners, the words and
 * the page's one primary action at the top, and the picture of Laura and her
 * cat — whole, never cropped — pinned to the bottom-right edge.
 */

const copy = LANDING_DEFAULTS.hero;

async function render(flags: Flags = defaultFlags()) {
  const container = await AstroContainer.create();
  return container.renderToString(Hero, { props: { copy, flags } });
}

/** Button's primary variant — the only filled violet-700 action (HIE-01). */
const FILLED = /bg-violet-700 text-cloud hover:bg-violet-600/g;

describe('Hero', () => {
  it('renders its headline and its primary action', async () => {
    const html = await render();

    expect(html).toMatch(new RegExp(`<h1[^>]*>\\s*${copy.headline}\\s*</h1>`));
    expect(html).toContain(copy.lead);
    expect(html).toMatch(/<a[^>]*href="\/reservar"[^>]*>\s*Reserva tu sesión\s*<\/a>/);
    expect(html).toContain('data-block="hero"');
  });

  it('carries exactly one filled violet-700 action, edged in white over the photo (HIE-01)', async () => {
    const html = await render();

    expect(html.match(FILLED)).toHaveLength(1);
    expect(html).toMatch(/href="\/reservar"[^>]*class="[^"]*\bborder border-white\b/);
  });

  it('offers Cómo funciona beside it only while that block is visible (INT-02)', async () => {
    expect(await render()).toContain('href="#como-funciona"');
    expect(await render({ ...defaultFlags(), 'block:how-it-works': false })).not.toContain(
      '#como-funciona',
    );
  });

  it('fills the first screen below the chrome, cropping only the band photo', async () => {
    const html = await render();
    const section = html.match(/<section[^>]*>/)?.[0] ?? '';

    expect(section).toContain(announcement.enabled ? CHROME_SCREEN_MIN_H : BAND_SCREEN_MIN_H);
    expect(section).toContain('flex flex-col');
    expect(section).not.toContain('items-end');
    expect(html).toContain('object-cover');
    expect(html).not.toMatch(/80vh|\bmin-h-svh\b/);
  });

  it('frames the photo with the four white corners, drawn over the picture', async () => {
    const html = await render();
    const corners = [...html.matchAll(/data-ornament="small-corner" class="([^"]*)"/g)].map(([, c]) => c.split(' '));

    expect(corners).toHaveLength(4);
    expect(corners.some((c) => c.includes('right-0') && c.includes('bottom-0'))).toBe(true);
    expect(html.match(new RegExp(`\\b${KNOCKOUT_TONE}\\b`, 'g'))).toHaveLength(4);
    // Later in the markup than the picture, so the bottom-right corner paints on top of it.
    expect(html.indexOf('data-ornament')).toBeGreaterThan(html.indexOf('alt="Laura'));
    // The band starts below the chrome, so the frame must not offset again.
    expect(html).toMatch(/inset-x-0 bottom-0 p-2 lg:p-3 top-0/);
    expect(html).not.toContain(CHROME_TOP);
    expect(html).not.toContain(BAND_TOP);
  });

  it('puts the words and the actions at the top of the band', async () => {
    const html = await render();
    const grid = html.match(/<div class="([^"]*)">\s*<div class="[^"]*">\s*<h1/)?.[1] ?? '';

    expect(grid).toMatch(/\bpt-14\b/);
    expect(grid).toContain('relative z-10');
    expect(html.indexOf('<h1')).toBeLessThan(html.indexOf('alt="Laura'));
  });

  it('pins Laura and her cat to the bottom-right edge, whole and large, with no margin', async () => {
    const html = await render();
    const img = html.match(/<img[^>]*alt="Laura, la florapeuta[^"]*"[^>]*>/)?.[0] ?? '';
    const classes = img.match(/class="([^"]*)"/)?.[1].split(' ') ?? [];

    // Part of the composition, not a portrait: never cropped (owner, 2026-09-11).
    expect(img).toMatch(/\bwidth="1536" height="1024"/);
    expect(classes).toEqual(expect.arrayContaining(['h-auto', 'rounded-none', 'mt-auto', 'self-end']));
    expect(classes).toEqual(expect.arrayContaining(['lg:absolute', 'lg:right-0', 'lg:bottom-0']));
    // 2–3× the old column widths: 80% of a phone, 60% from md, half from lg.
    expect(classes).toEqual(expect.arrayContaining(['w-4/5', 'md:w-3/5', 'lg:w-1/2']));
    expect(img).not.toMatch(/object-cover|aspect-|rounded-full|rounded-sm|col-span|\b-?m[rb]-|\bp[rb]?-/);
    expect(html.indexOf(img)).toBeGreaterThan(html.indexOf('Reserva tu sesión'));
  });

  it('keeps the band photograph decorative', async () => {
    const band = (await render()).match(/<img[^>]*fetchpriority="high"[^>]*>/)?.[0] ?? '';

    // An empty `alt` is serialised as a bare `alt` attribute — still decorative.
    expect(band).toMatch(/\salt(?:="")?(?=[\s>])/);
  });
});
