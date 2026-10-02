import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import FramedImage from './FramedImage.astro';
import { KNOCKOUT_TONE } from '../ui/ornament';

/**
 * A drop's image, a faint tint, and four light corners, stacked in that order
 * (spec 04c). The tint exists so the corners never land on a light photograph,
 * and the owner asked for it to stay subtle — so the test holds its colour to
 * the darkest token (Ink since spec 05c) and its strength
 * well under the banner's.
 */

const image = '<img src="/gato.jpg" alt="Un gato atigrado salta a por una pluma">';

async function render(props: Record<string, unknown> = {}) {
  const container = await AstroContainer.create();
  return container.renderToString(FramedImage, { props, slots: { default: image } });
}

const tintTag = (html: string) => html.match(/<div[^>]*data-image-tint[^>]*>/)?.[0] ?? '';

describe('FramedImage', () => {
  it('keeps the page’s own image, alt and all', async () => {
    expect(await render()).toContain(image);
  });

  it('lays the tint over the image and the corners over the tint', async () => {
    const html = await render();
    const img = html.indexOf('<img');
    const tint = html.indexOf('data-image-tint');
    const corner = html.indexOf('data-ornament');

    expect(img).toBeGreaterThan(-1);
    expect(tint).toBeGreaterThan(img);
    expect(corner).toBeGreaterThan(tint);
  });

  it('tints in Ink, darker at the edges and clear in the middle', async () => {
    const tint = tintTag(await render());

    expect(tint).toContain('aria-hidden="true"');
    expect(tint).toContain('pointer-events-none');
    expect(tint.match(/class="([^"]*)"/)?.[1].split(' ')).toContain('rounded');
    expect(tint).toContain('bg-linear-to-b');
    expect(tint).toMatch(/\bfrom-ink\/\d+/);
    expect(tint).toContain('via-ink/0');
    expect(tint).toMatch(/\bto-ink\/\d+/);
    expect(tint).not.toMatch(/black|#[0-9a-f]{3,8}/i);
  });

  it('stays subtle: the edges are at most 40%, half the banner overlay’s 80%', async () => {
    const tint = tintTag(await render());
    const edges = [...tint.matchAll(/\b(?:from|to)-ink\/(\d+)/g)].map(([, alpha]) => Number(alpha));

    expect(edges).toHaveLength(2);
    for (const alpha of edges) expect(alpha).toBeLessThanOrEqual(40);
  });

  it('wears the four knockout corners', async () => {
    const html = await render();

    expect(html.match(/data-ornament="small-corner"/g)).toHaveLength(4);
    expect(html.match(new RegExp(`\\b${KNOCKOUT_TONE}\\b`, 'g'))).toHaveLength(4);
  });

  it('passes the caller’s placement through', async () => {
    expect(await render({ class: 'mb-8' })).toMatch(/class="relative mb-8"/);
  });
});
