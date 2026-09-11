import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import FramedImage from './FramedImage.astro';
import { KNOCKOUT_TONE } from '../ui/ornament';

/**
 * A drop's image, a faint tint, and four white corners, stacked in that order
 * (spec 04c). The tint exists so white never lands on a light photograph, and
 * the owner asked for it to stay subtle — so the test holds its colour to the
 * guide's overlay violet and its strength well under the hero's.
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

  it('tints in violet-900, darker at the edges and clear in the middle', async () => {
    const tint = tintTag(await render());

    expect(tint).toContain('aria-hidden="true"');
    expect(tint).toContain('pointer-events-none');
    expect(tint).toContain('rounded-sm');
    expect(tint).toContain('bg-linear-to-b');
    expect(tint).toMatch(/\bfrom-violet-900\/\d+/);
    expect(tint).toContain('via-violet-900/0');
    expect(tint).toMatch(/\bto-violet-900\/\d+/);
    expect(tint).not.toMatch(/black|#[0-9a-f]{3,8}/i);
  });

  it('stays subtle: the edges are at most 40%, half the hero overlay’s 80%', async () => {
    const tint = tintTag(await render());
    const edges = [...tint.matchAll(/\b(?:from|to)-violet-900\/(\d+)/g)].map(([, alpha]) => Number(alpha));

    expect(edges).toHaveLength(2);
    for (const alpha of edges) expect(alpha).toBeLessThanOrEqual(40);
  });

  it('wears the four white corners', async () => {
    const html = await render();

    expect(html.match(/data-ornament="small-corner"/g)).toHaveLength(4);
    expect(html.match(new RegExp(`\\b${KNOCKOUT_TONE}\\b`, 'g'))).toHaveLength(4);
  });

  it('passes the caller’s placement through', async () => {
    expect(await render({ class: 'mb-8' })).toMatch(/class="relative mb-8"/);
  });
});
