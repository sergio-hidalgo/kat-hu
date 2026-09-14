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
    [1, 'col-span-12'],
    [2, 'col-span-12 md:col-span-6'],
    [3, 'col-span-12 md:col-span-4'],
    [4, 'col-span-12 md:col-span-6 lg:col-span-3'],
    [6, 'col-span-12 md:col-span-6 lg:col-span-3'],
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
    const numerals = [...html.matchAll(/<p aria-hidden="true"[^>]*>\s*(\d+)\s*<\/p>/g)].map(([, n]) => Number(n));

    expect(html).toContain('<ol role="list"');
    expect(html.match(/<li\b/g)).toHaveLength(count);
    expect(html.split(`<li class="${stepSpan(count)}"`).length - 1).toBe(count);
    expect(positions.every((position) => position > -1)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
    expect(numerals).toEqual(Array.from({ length: count }, (_, index) => index + 1));
  });

  it('leaves out an explanation the owner did not write', async () => {
    const html = await render({ ...defaults, steps: [{ title: 'Hablamos' }, { title: 'Te acompañamos' }] });

    expect(html).toContain('Hablamos');
    expect(html).not.toContain('text-sm text-graphite');
  });

  it('has no action of its own — it explains; the hero and the closing block book', async () => {
    expect(await render()).not.toMatch(/<a\b|<button\b/);
  });

  it('puts its heading on a row of its own, so no card climbs up beside it', async () => {
    const html = await render();
    const heading = html.match(/<div class="([^"]*)">\s*<h2/)?.[1];

    expect(heading).toBe('col-span-12');
  });
});
