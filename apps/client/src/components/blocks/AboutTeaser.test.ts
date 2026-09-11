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

  it('is text alone, not an empty frame, until there is a photo', async () => {
    const html = await render({ copy });

    expect(html).not.toContain('<img');
    expect(html).toContain('md:col-span-8');
  });

  it('shows the photo as a 4:5 crop with its Spanish alt once there is one', async () => {
    const html = await render({ copy: { ...copy, image } });
    const img = html.match(/<img[^>]*>/)?.[0] ?? '';

    expect(img).toContain(`alt="${image.alt}"`);
    expect(img).toContain('width="640" height="800"');
    expect(img).toContain('loading="lazy"');
    expect(html).toContain('md:col-start-6');
  });
});
