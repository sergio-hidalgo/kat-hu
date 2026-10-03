import { afterEach, describe, expect, it, vi, type Mock } from 'vitest';

vi.mock('../lib/sanity', () => ({ sanityClient: { fetch: vi.fn() } }));

import { sanityClient } from '../lib/sanity';
import { getLatestPosts, LATEST_COUNT } from './posts';

/**
 * The landing's blog teaser asks Sanity for the newest three posts only
 * (spec 05) — never the whole list sliced on our side.
 */
// Sanity's `fetch` is typed per query; the fixtures here are plain objects.
const fetch = sanityClient.fetch as unknown as Mock<(...args: unknown[]) => Promise<unknown>>;

afterEach(() => fetch.mockReset());

describe('getLatestPosts', () => {
  it('asks for the newest three, by parameter', async () => {
    fetch.mockResolvedValueOnce([]);
    await getLatestPosts();

    const [query, params] = fetch.mock.calls[0];
    expect(LATEST_COUNT).toBe(3);
    expect(query).toContain('order(coalesce(publishedAt, _createdAt) desc) [0...3]');
    expect(params).toEqual({ type: 'post' });
  });

  it('fills a missing summary from the body, as the list does', async () => {
    fetch.mockResolvedValueOnce([
      {
        id: 'p1',
        slug: 'mochi',
        title: 'Mochi',
        excerpt: '',
        date: '2026-09-01',
        body: [{ _type: 'block', children: [{ text: 'Mochi aprende a jugar.' }] }],
      },
    ]);

    const [post] = await getLatestPosts();
    expect(post.excerpt).toBe('Mochi aprende a jugar.');
  });

  it('returns nothing when there is nothing', async () => {
    fetch.mockResolvedValueOnce(null);
    await expect(getLatestPosts()).resolves.toEqual([]);
  });
});

describe('dropType', () => {
  const raw = (dropType?: string) => ({
    id: 'p',
    slug: 'p',
    title: 'P',
    excerpt: 'x',
    date: '2026-09-02',
    dropType,
    body: [],
  });

  it('reads a known type as it is, and anything else as post', async () => {
    fetch.mockResolvedValueOnce([raw('curiosidad'), raw('truko'), raw(undefined)]);
    const posts = await getLatestPosts();

    expect(posts.map((post) => post.dropType)).toEqual(['curiosidad', 'post', 'post']);
  });

  it('is selected with a fallback in the query', async () => {
    fetch.mockResolvedValueOnce([]);
    await getLatestPosts();

    expect(fetch.mock.calls[0][0]).toContain('dropType');
  });
});
