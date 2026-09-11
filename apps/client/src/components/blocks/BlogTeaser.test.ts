import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../data/posts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../data/posts')>()),
  getLatestPosts: vi.fn(),
}));
vi.mock('../../lib/likes', () => ({ getLikeCounts: vi.fn(async () => ({ p1: 4 })) }));

import BlogTeaser from './BlogTeaser.astro';
import { LANDING_DEFAULTS } from '../../data/landing';
import { getLatestPosts, type Post } from '../../data/posts';

const copy = LANDING_DEFAULTS['blog-teaser'];

const post = (n: number): Post => ({
  id: `p${n}`,
  slug: `drop-${n}`,
  title: `Drop número ${n}`,
  excerpt: 'Una idea práctica para entender mejor a tu gato.',
  date: `2026-09-0${n}`,
  body: [],
});

async function render() {
  const container = await AstroContainer.create();
  return container.renderToString(BlogTeaser, { props: { copy } });
}

afterEach(() => {
  vi.mocked(getLatestPosts).mockReset();
  vi.restoreAllMocks();
});

describe('BlogTeaser', () => {
  it('renders its headline, the three newest drops and the way to all of them', async () => {
    vi.mocked(getLatestPosts).mockResolvedValueOnce([post(1), post(2), post(3)]);

    const html = await render();

    expect(html).toContain(copy.headline);
    for (const n of [1, 2, 3]) expect(html).toContain(`href="/drops/drop-${n}/"`);
    expect(html).toMatch(/<a href="\/drops\/"[^>]*>\s*Ver todos los drops/);
    expect(html).toContain('data-likes="4"');
  });

  it('puts its heading on a row of its own, so no card climbs up beside it', async () => {
    vi.mocked(getLatestPosts).mockResolvedValueOnce([post(1), post(2), post(3)]);

    const heading = (await render()).match(/<div class="([^"]*)">\s*<h2/)?.[1];
    expect(heading).toBe('col-span-12');
  });

  it('renders nothing with no posts', async () => {
    vi.mocked(getLatestPosts).mockResolvedValueOnce([]);

    expect((await render()).trim()).toBe('');
  });

  it('renders nothing, and does not throw, when Sanity cannot be reached', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.mocked(getLatestPosts).mockRejectedValueOnce(new Error('offline'));

    expect((await render()).trim()).toBe('');
  });
});
