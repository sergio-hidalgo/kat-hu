import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Flora from './Flora.astro';
import SectionEdge from './SectionEdge.astro';
import { LINE_STUDIES, aspectRatio } from './flora';
import sharp from 'sharp';
import { FOOTER_ASPECT, FOOTER_LAYER, GROUND_LAYER, PLANTS_LAYER, footerMaskStyle, maskStyle, plantsMaskStyle, sidesOnly } from './edge';

/**
 * Spec 05c's vectors. The owner's drawings are recoloured by token, so every
 * file must take its colour from CSS — no hex, no style block, no script.
 * The two botanical edges are traced from the owner's PNGs and cropped so the
 * ground line sits on the band's edge; that half reads `references/`, which is
 * local-only, so it skips on a clean clone the way `styles/tokens.test.ts` does.
 */

const brand = (file: string) =>
  fileURLToPath(new URL(`../../assets/brand/${file}`, import.meta.url));
const reference = (file: string) =>
  fileURLToPath(new URL(`../../../../../references/${file}`, import.meta.url));

const STYLE_TAG = /<\s*style\b/i;
const HEX = /#[0-9a-fA-F]{3,8}\b/;
const SCRIPT = /<\s*script\b|\son[a-z]+=/i;

/** Each edge and the owner's drawing it was traced from (2026-09-27). */
const EDGES = {
  'edge-plants.svg': 'flower_profile.png',
  'edge-footer.svg': 'animals_profile.png',
} as const;

/** Attribute values as a browser reads them. */
const decode = (html: string) => html.replaceAll('&quot;', '"').replaceAll('&#34;', '"').replaceAll('&amp;', '&');

const viewBox = (svg: string) => svg.match(/viewBox="([^"]+)"/)?.[1].split(' ').map(Number) ?? [];

const hasReferences = Object.values(EDGES).every((file) => existsSync(reference(file)));

/** The rows the drawing occupies in the source PNG (alpha over half). */
async function opaqueRows(file: string): Promise<[number, number]> {
  const { data, info } = await sharp(reference(file)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let top = info.height;
  let bottom = 0;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (data[(y * info.width + x) * 4 + 3] > 128) {
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
        break;
      }
    }
  }
  return [top, bottom];
}

async function render(component: Parameters<AstroContainer['renderToString']>[0], props: Record<string, unknown>) {
  const container = await AstroContainer.create();
  return container.renderToString(component, { props });
}

describe('vector assets', () => {
  const files = [
    ...Object.keys(EDGES),
    ...Object.keys(LINE_STUDIES).map((name) => `flora-line-${name}.svg`),
  ];

  it.each(files)('%s takes its colour from CSS and carries nothing executable', (file) => {
    const svg = readFileSync(brand(file), 'utf8');

    expect(svg).toMatch(/^<svg\b[^>]*\sxmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
    expect(svg).toContain('currentColor');
    expect(svg).not.toMatch(HEX);
    expect(svg).not.toMatch(STYLE_TAG);
    expect(svg).not.toMatch(SCRIPT);
    expect(svg).not.toContain('<?xml');
    expect(svg).not.toContain('<metadata');
  });

  it.each(Object.keys(LINE_STUDIES))('line study %s is one drawing, a line over a faint wash', (name) => {
    const svg = readFileSync(brand(`flora-line-${name}.svg`), 'utf8');

    expect(svg).toMatch(new RegExp(`^<svg [^>]*viewBox="${LINE_STUDIES[name as keyof typeof LINE_STUDIES].viewBox}"`));
    expect(svg).not.toMatch(/\sid="/);
    expect(svg.match(/<path\b/g)).toHaveLength(2);
    expect(svg).toContain('fill-opacity=".22"');
  });

  it.each(Object.keys(EDGES))('%s is one traced silhouette', (file) => {
    const svg = readFileSync(brand(file), 'utf8');

    expect(svg.match(/<path\b/g)).toHaveLength(1);
    expect(svg).toMatch(/^<svg [^>]*fill="currentColor"/);
  });

  it('knows the closing edge’s aspect, which the plants’ cut-out is sized by', () => {
    const [, , width, height] = viewBox(readFileSync(brand('edge-footer.svg'), 'utf8'));

    expect(FOOTER_ASPECT).toBeCloseTo(width / height, 5);
  });

  it.skipIf(!hasReferences).each(Object.entries(EDGES))(
    '%s is cropped to %s’s drawing, so its ground line sits on the band’s edge',
    async (file, source) => {
      const [, y, , height] = viewBox(readFileSync(brand(file), 'utf8'));
      const [top, bottom] = await opaqueRows(source);

      expect(y).toBe(top);
      expect(y + height - 1).toBe(bottom);
    },
  );
});

describe('Flora', () => {
  it('paints a line study through its file as a mask, Glicina by default, at its own aspect', async () => {
    const html = decode(await render(Flora, { line: 'leaf', class: 'w-24' }));

    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('text-wisteria');
    expect(html).toMatch(/class="[^"]*\bbg-current\b/);
    expect(html).toMatch(/[^-]mask: url\("[^"]*flora-line-leaf[^"]*\.svg"\) center \/ contain no-repeat;/);
    expect(html).toContain('aspect-ratio: 560 / 700;');
    // Not an <svg><use>: that would be fetched even while hidden on a phone.
    expect(html).not.toContain('<use');
  });

  it('reads a box’s aspect ratio off the viewBox', () => {
    expect(aspectRatio('0 0 640 640')).toBe('640 / 640');
  });

  it('takes the caller’s tone instead of the default — the point of a vector', async () => {
    const html = await render(Flora, { line: 'daisy', class: 'w-24 text-violet' });

    expect(html).toContain('text-violet');
    expect(html).not.toContain('text-wisteria');
  });
});

describe('SectionEdge', () => {
  it('is hidden decoration over the band above, one pixel into its own, painted through a mask', async () => {
    const html = decode(await render(SectionEdge, {}));

    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('data-edge="plants"');
    // One pixel past the wrapper's bottom, so the mask's soft last row is clipped away.
    expect(html).toMatch(/<div class="absolute inset-x-0 top-0 -bottom-px bg-current" style="/);
    // Sits on its own band's top edge, reaching up over the band above and one
    // pixel down into its own, so no hairline can open between them.
    expect(html).toContain('bottom-[calc(100%-1px)] h-[calc(var(--edge-height)+1px)]');
    expect(html).toContain('text-lavender');
    expect(html).toMatch(/[^-]mask: linear-gradient\(black, black\) center bottom \/ 100% 6% no-repeat, url\("[^"]*edge-plants[^"]*\.svg"\) center bottom \/ auto 100% repeat-x;/);
  });

  it('casts a faint, crisp Ink shadow upwards — from the wrapper, where the mask cannot cut it off', async () => {
    const html = decode(await render(SectionEdge, {}));
    const wrapper = html.match(/<div aria-hidden="true" data-edge="plants" class="([^"]*)"/)?.[1] ?? '';

    expect(wrapper).toContain('drop-shadow-[0_-1px_2px_color-mix(in_srgb,var(--color-ink)_20%,transparent)]');
    expect(wrapper).not.toContain('--color-violet');
    // Clipped at the ground line, so the blur never bleeds onto the band below.
    expect(wrapper).toContain('[clip-path:inset(-12px_0_0_0)]');
    // The masked child carries no filter of its own.
    expect(html).not.toMatch(/bg-current[^"]*drop-shadow/);
  });

  it('closes the page with the animals in the middle and the plants only on the sides, over the band above', async () => {
    const html = decode(await render(SectionEdge, { variant: 'footer', class: 'text-violet' }));

    expect(html).toContain('data-edge="footer"');
    expect(html).toContain('bottom-[calc(100%-1px)]');
    expect(html).toContain('text-violet');
    expect(html).toMatch(/mask-image: linear-gradient\(black, black\), url\("[^"]*edge-footer[^"]*"\), linear-gradient[^;]*, url\("[^"]*edge-plants[^"]*"\)/);
    expect(html).toContain('mask-composite: add, add, intersect;');
  });

  it('cuts the plants out exactly where the animal strip reaches', () => {
    const half = (FOOTER_ASPECT / 2).toFixed(3);

    expect(sidesOnly(FOOTER_ASPECT)).toBe(
      `linear-gradient(to right, black calc(50% - ${half} * var(--edge-height)), transparent calc(50% - ${half} * var(--edge-height)), transparent calc(50% + ${half} * var(--edge-height)), black calc(50% + ${half} * var(--edge-height)))`,
    );
    expect(footerMaskStyle('/f.svg', '/p.svg')).toContain('-webkit-mask-composite: source-over, source-over, source-in;');
  });

  it('writes both the prefixed and the standard mask', () => {
    const value = `url("/a.svg") ${FOOTER_LAYER}, url("/b.svg") ${PLANTS_LAYER}`;

    expect(maskStyle([['/a.svg', FOOTER_LAYER], ['/b.svg', PLANTS_LAYER]])).toBe(`-webkit-mask: ${value}; mask: ${value};`);
  });

  it('lays a band’s plants over a solid ground strip so no seam shows — edges only, never a flower', () => {
    const value = `${GROUND_LAYER}, url("/p.svg") ${PLANTS_LAYER}`;

    expect(plantsMaskStyle('/p.svg')).toBe(`-webkit-mask: ${value}; mask: ${value};`);
    expect(maskStyle([['/f.svg', PLANTS_LAYER]])).not.toContain('linear-gradient');
  });
});
