import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import BannerFrame from './BannerFrame.astro';
import { BAND_TOP, CHROME_TOP } from '../site/header';

/**
 * The frame is four mirrors of one drawing (spec 04b). Which way each one
 * faces is the whole design, so the test pins every position's flip, and the
 * box's top offset to the chrome's own numbers.
 */

async function render(stripe: boolean) {
  const container = await AstroContainer.create();
  return container.renderToString(BannerFrame, { props: { stripe } });
}

type Placed = { name: string; classes: string };

const ornaments = (html: string): Placed[] =>
  [...html.matchAll(/data-ornament="([^"]+)" class="([^"]*)"/g)].map(
    ([, name, classes]) => ({ name, classes }),
  );

const flips = ({ classes }: Placed) =>
  [classes.includes('-scale-x-100') && 'x', classes.includes('-scale-y-100') && 'y']
    .filter(Boolean)
    .join('');

const at = (placed: Placed[], name: string, ...positions: string[]) =>
  placed.find(
    (item) =>
      item.name === name &&
      positions.every((position) => item.classes.split(' ').includes(position)),
  );

describe('BannerFrame', () => {
  it('renders the four corners and nothing else, all hidden decoration', async () => {
    const html = await render(false);
    const placed = ornaments(html);

    // Corners only: the owner removed the edge-centre pieces (spec 04b).
    expect(placed).toHaveLength(4);
    expect(placed.every((item) => item.name === 'big-corner')).toBe(true);
    expect(html).toContain('pointer-events-none');
    expect(html.match(/aria-hidden="true"/g)?.length).toBeGreaterThanOrEqual(5);
  });

  it('mirrors each ornament so its base sits against its own edge', async () => {
    const placed = ornaments(await render(false));

    expect(flips(at(placed, 'big-corner', 'top-0', 'left-0')!)).toBe('');
    expect(flips(at(placed, 'big-corner', 'top-0', 'right-0')!)).toBe('x');
    expect(flips(at(placed, 'big-corner', 'bottom-0', 'left-0')!)).toBe('y');
    expect(flips(at(placed, 'big-corner', 'bottom-0', 'right-0')!)).toBe('xy');
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
