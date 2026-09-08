import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import PostCard from './PostCard.astro';
import type { SanityImage } from '../../lib/sanity';

/**
 * The card's height is capped in lines (spec 03c): two of title, five of
 * summary. The cap is visual — `line-clamp` — so the test's job is to prove
 * that the clamp is on the right elements *and* that nothing was shortened on
 * the server, since the whole sentence has to stay in the DOM for search
 * engines and screen readers.
 */

const title = 'Muerde cuando lo acaricias: entender la agresividad felina en casa';

const excerpt = Array.from(
  { length: 40 },
  () => 'Casi ninguna agresividad felina es gratuita y conviene leer los avisos.',
).join(' ');

const post = {
  id: 'post-1',
  slug: 'agresividad-felina',
  title,
  excerpt,
  date: '2026-09-02',
  likes: 4,
};

const mainImage: SanityImage = {
  _type: 'image',
  asset: { _ref: 'image-Tb9Ew8CXIwaY6R1kjMvI0uRR-2000x3000-jpg', _type: 'reference' },
  alt: 'Un gato atigrado mordisquea con suavidad una mano',
};

async function render(props: Record<string, unknown>) {
  const container = await AstroContainer.create();
  return container.renderToString(PostCard, { props });
}

describe('PostCard', () => {
  it('clamps the title to two lines and the summary to five', async () => {
    const html = await render({ ...post, mainImage });

    expect(html).toContain('line-clamp-2');
    expect(html).toContain('line-clamp-5');
  });

  it('keeps the whole title and summary in the markup', async () => {
    const html = await render({ ...post, mainImage });

    expect(html).toContain(title);
    // The last words of a 40-sentence excerpt: nothing is truncated server-side.
    expect(html).toContain('conviene leer los avisos.');
    expect(html).not.toContain('…');
  });

  it('caps its height without naming one', async () => {
    const html = await render({ ...post, mainImage });

    // A pixel height would have to be re-guessed every time the type scale
    // moves, and would break the masonry's short cards (spec 03c).
    expect(html).not.toMatch(/\bmax-h-|\bmin-h-|\bh-\[/);
  });

  it('renders the 16:9 crop with its alt text', async () => {
    const html = await render({ ...post, mainImage });

    expect(html).toContain('width="800"');
    expect(html).toContain('height="450"');
    expect(html).toContain(`alt="${mainImage.alt}"`);
  });

  it('clamps the same way on a card with no image', async () => {
    const html = await render(post);

    expect(html).not.toContain('<img');
    expect(html).toContain('line-clamp-2');
    expect(html).toContain('line-clamp-5');
  });

  it('shows the date in Spanish and the like count', async () => {
    const html = await render({ ...post, mainImage });

    expect(html).toContain('2 de septiembre de 2026');
    expect(html).toContain('>4<');
  });
});
