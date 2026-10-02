import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import AboutTeaser from './AboutTeaser.astro';
import { LANDING_DEFAULTS } from '../../data/landing';
import type { SanityImage } from '../../lib/sanity';

const copy = LANDING_DEFAULTS['about-teaser'];

const image: SanityImage = {
  _type: 'image',
  asset: { _ref: 'image-Tb9Ew8CXIwaY6R1kjMvI0uRR-2000x3000-jpg', _type: 'reference' },
  alt: 'Laura sostiene a una gata atigrada',
};

async function render(props: Record<string, unknown>) {
  const container = await AstroContainer.create();
  return container.renderToString(AboutTeaser, { props });
}

describe('AboutTeaser', () => {
  it('renders its headline and its link to the whole story', async () => {
    const html = await render({ copy });

    expect(html).toContain(copy.headline);
    expect(html).toContain(copy.paragraph);
    expect(html).toMatch(/<a href="\/sobre-kathu"[^>]*class="[^"]*min-h-11/);
  });

  it('shows Laura’s portrait from the brand assets until the Studio has a photo', async () => {
    const html = await render({ copy });
    const img = html.match(/<img[^>]*alt="Laura, la florapeuta[^"]*"[^>]*>/)?.[0] ?? '';

    expect(img).toContain('width="640" height="800"');
    expect(img).toContain('loading="lazy"');
    // Guide §06, a section photo: the base layer's 8px radius and the small shadow.
    expect(img).toContain('shadow-sm');
  });

  it('sizes the photo at 6¼ grid units from md — four columns, 25/28 filled — and keeps the words on seven', async () => {
    const html = await render({ copy });
    const img = html.match(/<img[^>]*alt="Laura, la florapeuta[^"]*"[^>]*>/)?.[0] ?? '';

    expect(html).toContain('<div class="relative col-span-9 sm:col-span-6 md:col-span-4">');
    expect(img).toContain('md:w-[calc(100%*25/28)]');
    expect(html).toContain('<div class="col-span-12 md:col-span-7 md:col-start-5">');
  });

  it('takes the link’s words and destination from the copy — the Studio’s «Terapeuta»', async () => {
    const html = await render({ copy: { ...copy, linkLabel: 'Lee mi historia', linkHref: '/sobre-kathu/laura' } });

    expect(html).toMatch(/<a href="\/sobre-kathu\/laura"[^>]*>Lee mi historia<\/a>/);
  });

  it('shows the Studio’s photo as a 4:5 crop with its Spanish alt once there is one', async () => {
    const html = await render({ copy: { ...copy, image } });
    const img = html.match(/<img[^>]*src="https:\/\/cdn\.sanity\.io[^>]*>/)?.[0] ?? '';

    expect(img).toContain(`alt="${image.alt}"`);
    expect(img).toContain('width="640" height="800"');
    expect(img).not.toContain('alt="Laura, la florapeuta');
  });

  it('carries three decorative flowers on a desktop, one of them on a phone', async () => {
    const html = await render({ copy });
    const pressed = html.match(/<img[^>]*data-flora="pressed-lilac"[^>]*>/)?.[0] ?? '';
    const flower = html.match(/<div[^>]*data-flora="line-flower"[^>]*>/)?.[0] ?? '';
    const leaf = html.match(/<div[^>]*data-flora="line-leaf"[^>]*>/)?.[0] ?? '';
    const tokens = (tag: string) => tag.match(/class="([^"]*)"/)?.[1].split(' ') ?? [];

    expect(pressed).toMatch(/\salt(?:="")?(?=[\s>])/);
    expect(pressed).toContain('aria-hidden="true"');
    expect(tokens(pressed)).not.toContain('hidden');
    expect(tokens(flower)).toEqual(expect.arrayContaining(['hidden', 'xl:block', 'top-0']));
    // The leaf at the bottom of the margin, in the flower's Glicina.
    expect(tokens(leaf)).toEqual(expect.arrayContaining(['hidden', 'xl:block', 'bottom-0', 'text-wisteria']));
    expect(html.match(/data-flora=/g)).toHaveLength(3);
  });

  it('lifts the band above the next one, so the lilac can hang into the process band', async () => {
    const section = (await render({ copy })).match(/<section[^>]*>/)?.[0] ?? '';

    expect(section).toMatch(/class="[^"]*\bz-10\b/);
    expect(section).not.toMatch(/\bisolate\b/);
  });

  it('mirrors the pressed lilac, turns it 72°, sets it at 90% and keeps it above the photo (owner, 2026-09-28)', async () => {
    const html = await render({ copy });
    const pressed = html.match(/<img[^>]*data-flora="pressed-lilac"[^>]*>/)?.[0] ?? '';
    const tokens = pressed.match(/class="([^"]*)"/)?.[1].split(' ') ?? [];

    // 25% smaller than 224/352px, and 60° further clockwise than its 12°.
    expect(tokens).toEqual(
      expect.arrayContaining(['-scale-x-100', 'rotate-72', 'opacity-90', 'z-10', 'w-42', 'md:w-66']),
    );
    // Left of the photo, hanging below its corner.
    expect(tokens).toEqual(expect.arrayContaining(['-left-24', 'md:-left-32', '-bottom-6', 'md:-bottom-24']));
    // Lower from md only: on a phone the heading sits right under the photo.
    // After the photo in the markup, so it paints over it.
    expect(html.indexOf('data-flora="pressed-lilac"')).toBeGreaterThan(html.indexOf('alt="Laura, la florapeuta'));
  });
});
