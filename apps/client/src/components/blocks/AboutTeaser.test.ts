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

  it('sizes the photo at 6¼ grid units from lg — four columns, 25/28 filled — and keeps the words on seven', async () => {
    const html = await render({ copy });
    const img = html.match(/<img[^>]*alt="Laura, la florapeuta[^"]*"[^>]*>/)?.[0] ?? '';

    expect(html).toContain(
      '<div class="relative col-span-8 col-start-3 phone-xl:col-span-10 phone-xl:col-start-2 phone-md:col-span-10 phone-md:col-start-2 tablet:col-span-8 tablet:col-start-3 md:max-lg:landscape:col-span-6 md:max-lg:landscape:col-start-4 lg:col-span-4 lg:col-start-1">',
    );
    expect(img).toContain('lg:w-[calc(100%*25/28)]');
    expect(html).toContain(
      '<div class="col-span-12 text-center md:col-span-8 md:col-start-3 lg:col-span-7 lg:col-start-5 lg:text-left">',
    );
  });

  it('stacks below lg (spec 05e): the picture on top, centred, the words centred beneath it', async () => {
    const html = await render({ copy });
    const photo = html.indexOf('alt="Laura, la florapeuta');
    const words = html.indexOf(copy.headline);

    expect(photo).toBeGreaterThan(-1);
    expect(words).toBeGreaterThan(photo);
    // The photo's cell starts at column 3 (phone) or 4 (tablet) of 12 and spans 8 or 6: centred.
    expect(html).toContain('col-span-8 col-start-3');
    expect(html).toContain('md:max-lg:landscape:col-span-6 md:max-lg:landscape:col-start-4');
    expect(html).toContain('tablet:col-span-8 tablet:col-start-3');
    expect(html).toMatch(/<p class="mt-4 text-lead text-graphite max-lg:max-w-none">/);
  });

  it('takes the link’s words and destination from the copy — the Studio’s «Terapeuta»', async () => {
    const html = await render({ copy: { ...copy, linkLabel: 'Lee mi historia', linkHref: '/sobre-kathu/laura' } });

    expect(html).toMatch(/<a href="\/sobre-kathu\/laura"[^>]*>Lee mi historia<\/a>/);
  });

  it('shows the Studio’s photo as a 4:5 crop with its Spanish alt once there is one', async () => {
    const html = await render({ copy: { ...copy, image } });
    const img = html.match(/<img[^>]*src="https:\/\/cdn\.sanity\.io[^>]*>/)?.[0] ?? '';

    expect(img).toContain(`alt="${image.alt}"`);
    // The 4:5 crop at four widths, the largest (960×1200) its intrinsic size, so a phone is not handed 960px for 300.
    expect(img).toContain('width="960" height="1200"');
    const set = (img.match(/srcset="([^"]*)"/)?.[1] ?? '').split(', ').map((entry) => entry.split(' ')[1]);
    expect(set).toEqual(['320w', '400w', '480w', '560w', '640w', '800w', '960w']);
    expect(img).toContain('sizes="(min-width: 1024px) 25vw,');
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
      expect.arrayContaining(['-scale-x-100', 'rotate-72', 'opacity-90', 'z-10', 'w-42', 'md:max-lg:landscape:w-52', 'tablet:w-72', 'lg:w-66']),
    );
    // Left of the photo, hanging below its corner.
    expect(tokens).toEqual(expect.arrayContaining(['-left-10', 'lg:-left-32', '-bottom-6', 'lg:-bottom-24']));
    // Lower from lg only (and kept on screen below it): on a phone the heading sits right under the photo.
    // After the photo in the markup, so it paints over it.
    expect(html.indexOf('data-flora="pressed-lilac"')).toBeGreaterThan(html.indexOf('alt="Laura, la florapeuta'));
  });
});

describe('AboutTeaser on a large portrait phone (owner, 2026-10-06)', () => {
  it('has a photo 25% wider and its lilac against the screen edge, with the margin flower near the end of the words', async () => {
    const html = await render({ copy });
    const lilac = html.match(/<img[^>]*data-flora="pressed-lilac"[^>]*>/)?.[0] ?? '';
    const flower = html.match(/<div[^>]*data-flora="line-flower"[^>]*>/)?.[0] ?? '';
    const leaf = html.match(/<div[^>]*data-flora="line-leaf"[^>]*>/)?.[0] ?? '';

    // 10 of 12 columns against 8: 19 of the grid's 25 units against 15.
    expect(html).toContain('phone-xl:col-span-10 phone-xl:col-start-2');
    expect(lilac).toContain('phone-xl:-left-[12vw]');
    expect(flower).toContain('phone-xl:block');
    expect(flower).toContain('phone-xl:bottom-28');
    expect(flower).toContain('phone-xl:w-[76vw]');
    // The leaf never shows below `xl`.
    expect(leaf).not.toContain('phone-xl');
  });
});
