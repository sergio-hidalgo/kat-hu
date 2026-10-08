import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import HowItWorks from './HowItWorks.astro';
import { stepSpan } from './howItWorks';
import { LANDING_DEFAULTS, type LandingCopy, type StepItem } from '../../data/landing';
import { SCROLL_MT } from '../site/header';

const defaults = LANDING_DEFAULTS['how-it-works'];

/** `count` synthetic steps, as the owner might name them. */
const steps = (count: number): StepItem[] =>
  Array.from({ length: count }, (_, index) => ({
    title: `Paso llamado ${index + 1}`,
    description: `Lo que pasa en el paso ${index + 1}.`,
  }));

async function render(copy: LandingCopy['how-it-works'] = defaults) {
  const container = await AstroContainer.create();
  return container.renderToString(HowItWorks, { props: { copy } });
}

describe('stepSpan', () => {
  it.each([
    [1, 'lg:col-span-12'],
    [2, 'lg:col-span-6'],
    [3, 'lg:col-span-4'],
    [4, 'lg:col-span-3'],
    [6, 'lg:col-span-3'],
  ])('gives %i steps %s each, so a row of steps fills the grid', (count, span) => {
    expect(stepSpan(count)).toBe(span);
  });
});

describe('HowItWorks', () => {
  it('renders its headline under the anchor the hero links to, clear of the bar', async () => {
    const html = await render();

    expect(html).toContain(defaults.headline);
    expect(html).toMatch(new RegExp(`<section[^>]*id="como-funciona"[^>]*class="[^"]*${SCROLL_MT}`));
  });

  it.each([2, 3, 4])('lists %i steps in order, numbered, on the columns their count gives', async (count) => {
    const items = steps(count);
    const html = await render({ ...defaults, steps: items });
    const positions = items.map((step) => html.indexOf(step.title));
    const numerals = [...html.matchAll(/<span aria-hidden="true">(\d+)\. <\/span>/g)].map(([, n]) => Number(n));

    expect(html).toContain('<ol role="list"');
    expect(html.match(/<li\b/g)).toHaveLength(count);
    expect(
      html.split(`<li class="${stepSpan(count)} flex snap-start flex-col items-center px-6 text-center md:px-[20%] lg:px-6"`)
        .length - 1,
    ).toBe(count);
    expect(positions.every((position) => position > -1)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
    expect(numerals).toEqual(Array.from({ length: count }, (_, index) => index + 1));
  });

  it('holds the steps in one Panel, a subgrid of the page grid (guide §07, I-001)', async () => {
    const html = await render();
    const panel = html.match(/<section[^>]*class="([^"]*)"[^>]*data-panel/)?.[1].split(' ') ?? [];

    expect(panel).toEqual(
      expect.arrayContaining([
        'col-span-12',
        'lg:grid',
        'lg:grid-cols-subgrid',
        'bg-panel',
        'rounded',
        'border',
        'border-cream/70',
      ]),
    );
    // Not a second grid: no column count of its own.
    expect(panel.some((c) => /^grid-cols-\d/.test(c))).toBe(false);
  });

  it('puts the steps in a carousel below lg, never on a timer (spec 05e)', async () => {
    const html = await render({ ...defaults, steps: steps(3) });

    expect(html).toContain('data-carousel');
    expect(html).toContain('aria-label="Pasos de la sesión"');
    expect(html).not.toContain('data-autoplay');
    // The numbered list is the track itself.
    expect(html).toMatch(/<ol role="list" data-track/);
  });

  it('holds a Violeta placeholder over each step that has no picture yet, one shape per step', async () => {
    const html = await render({ ...defaults, steps: steps(3) });

    expect(
      html.match(/data-placeholder aria-hidden="true" class="[^"]*\baspect-\[7\/3\][^"]*\bbg-violet\b/g),
    ).toHaveLength(3);
    expect(html).not.toContain('<img');
  });

  it('shows the owner’s picture from the CDN, cropped to the slot, with its alt, instead of the placeholder', async () => {
    const [first, second] = steps(2);
    const html = await render({
      ...defaults,
      steps: [
        {
          ...first,
          image: {
            _type: 'image',
            asset: { _ref: 'image-Tb9Ew8CXIwaY6R1kjMvI0uRR-600x600-png', _type: 'reference' },
            alt: ' Una videollamada ',
          },
        },
        second,
      ],
    });
    const img = html.match(/<img[^>]*>/)?.[0] ?? '';
    const src = img.match(/src="([^"]*)"/)?.[1].replaceAll('&amp;', '&') ?? '';
    const params = new URL(src).searchParams;

    expect(src).toMatch(/^https:\/\/cdn\.sanity\.io\/images\//);
    expect(params.get('w')).toBe('800');
    expect(params.get('h')).toBe('343');
    const set = (img.match(/srcset="([^"]*)"/)?.[1] ?? '').split(', ').map((entry) => entry.split(' ')[1]);
    expect(set).toEqual(['320w', '480w', '640w', '800w']);
    // Two steps across from lg: half of the Panel less the step's padding.
    expect(img).toContain('sizes="(min-width: 1024px) calc(92vw / 2 - 48px), (min-width: 760px) 55vw, calc(92vw - 48px)"');
    expect(img).toContain('alt="Una videollamada"');
    expect(img).toMatch(/class="[^"]*\baspect-\[7\/3\][^"]*\bobject-cover\b/);
    expect(html.match(/data-placeholder/g)).toHaveLength(1);
  });

  it('writes the descriptions in Grafito — Pizarra is under AA on the Panel', async () => {
    const html = await render();

    expect(html).toContain('text-sm text-graphite');
    expect(html).not.toMatch(/<li[^>]*>[\s\S]*?text-slate/);
  });

  it('leaves out an explanation the owner did not write', async () => {
    const html = await render({ ...defaults, steps: [{ title: 'Hablamos' }, { title: 'Te acompañamos' }] });

    expect(html).toContain('Hablamos');
    expect(html).not.toContain('text-sm text-graphite');
  });

  it('has no action of its own — it explains; the hero and the closing block book', async () => {
    // The carousel's dots are a `<template>`, cloned by script: not an action of the band.
    expect((await render()).replace(/<template[\s\S]*?<\/template>/g, '')).not.toMatch(/<a\b|<button\b/);
  });

  it('puts its heading on a row of its own, so no card climbs up beside it', async () => {
    const html = await render();
    const heading = html.match(/<div class="([^"]*)">\s*<h2/)?.[1];

    // A full row on a phone; centred on the middle eight columns from md.
    expect(heading).toBe('col-span-12 text-center md:col-span-8 md:col-start-3');
  });
});
