import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import BannerFrame from './BannerFrame.astro';
import { BAND_TOP, CHROME_TOP } from '../site/header';
import { KNOCKOUT_TONE } from '../ui/ornament';

/**
 * The banner's frame is `CornerFrame` (spec 04c), whose flips are pinned in
 * its own test. What belongs to the banner alone is which corners it wears and
 * where its box starts: below the chrome, by the chrome's own numbers.
 */

async function render(stripe: boolean) {
  const container = await AstroContainer.create();
  return container.renderToString(BannerFrame, { props: { stripe } });
}

describe('BannerFrame', () => {
  it('wears four white small corners and nothing else, all hidden decoration', async () => {
    const html = await render(false);
    const names = [...html.matchAll(/data-ornament="([^"]+)"/g)].map(([, name]) => name);

    // The big corners were retired for these by the owner (spec 04c).
    expect(names).toEqual(Array(4).fill('small-corner'));
    expect(html.match(new RegExp(`\\b${KNOCKOUT_TONE}\\b`, 'g'))).toHaveLength(4);
    expect(html).toContain('pointer-events-none');
    expect(html.match(/aria-hidden="true"/g)?.length).toBeGreaterThanOrEqual(5);
  });

  it('starts below the stripe and the band when the announcement is on', async () => {
    const html = await render(true);

    expect(html).toContain(CHROME_TOP);
    expect(html).not.toContain(BAND_TOP);
  });

  it('starts below the band alone when the announcement is off', async () => {
    const html = await render(false);

    expect(html).toContain(BAND_TOP);
    expect(html).not.toContain(CHROME_TOP);
  });
});
