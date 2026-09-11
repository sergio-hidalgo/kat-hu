import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import HowItWorks from './HowItWorks.astro';
import { LANDING_DEFAULTS } from '../../data/landing';
import { SCROLL_MT } from '../site/header';

const copy = LANDING_DEFAULTS['how-it-works'];

async function render() {
  const container = await AstroContainer.create();
  return container.renderToString(HowItWorks, { props: { copy } });
}

describe('HowItWorks', () => {
  it('renders its headline under the anchor the hero links to, clear of the bar', async () => {
    const html = await render();

    expect(html).toContain(copy.headline);
    expect(html).toMatch(new RegExp(`<section[^>]*id="como-funciona"[^>]*class="[^"]*${SCROLL_MT}`));
  });

  it('lists the three steps in order, as an ordered list', async () => {
    const html = await render();
    const positions = copy.steps.map((step) => html.indexOf(step.title));

    expect(html).toContain('<ol role="list"');
    expect(html.match(/<li\b/g)).toHaveLength(3);
    expect(positions.every((position) => position > -1)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
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
