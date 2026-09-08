import { describe, expect, it } from 'vitest';
import { rankPosts, type Rankable } from './likes';

/** Synthetic posts — id, ISO date and a like count are all `rankPosts` reads. */
const post = (id: string, date: string, likes: number): Rankable => ({
  id,
  date,
  likes,
});

describe('rankPosts', () => {
  it('features the three most-liked posts, most-liked first', () => {
    const items = [
      post('a', '2026-01-01', 5),
      post('b', '2026-01-02', 40),
      post('c', '2026-01-03', 12),
      post('d', '2026-01-04', 1),
      post('e', '2026-01-05', 30),
    ];

    const { featured } = rankPosts(items);

    expect(featured.map((item) => item.id)).toEqual(['b', 'e', 'c']);
  });

  it('breaks a tie on likes with the newer date', () => {
    const items = [
      post('older', '2026-01-01', 10),
      post('newer', '2026-06-01', 10),
      post('middle', '2026-03-01', 10),
    ];

    const { featured } = rankPosts(items);

    expect(featured.map((item) => item.id)).toEqual([
      'newer',
      'middle',
      'older',
    ]);
  });

  it('orders the rest by date, newest first, and never repeats a featured post', () => {
    const items = [
      post('a', '2026-01-01', 5),
      post('b', '2026-01-02', 40),
      post('c', '2026-01-03', 12),
      post('d', '2026-01-04', 1),
      post('e', '2026-01-05', 30),
    ];

    const { featured, rest } = rankPosts(items);

    expect(rest.map((item) => item.id)).toEqual(['d', 'a']);
    const featuredIds = featured.map((item) => item.id);
    expect(rest.some((item) => featuredIds.includes(item.id))).toBe(false);
    expect(featured.length + rest.length).toBe(items.length);
  });

  it('features every post and leaves no rest when there are fewer than three', () => {
    const items = [post('a', '2026-01-01', 2), post('b', '2026-01-02', 9)];

    const { featured, rest } = rankPosts(items);

    expect(featured.map((item) => item.id)).toEqual(['b', 'a']);
    expect(rest).toEqual([]);
  });

  it('returns two empty lists for an empty input', () => {
    expect(rankPosts([])).toEqual({ featured: [], rest: [] });
  });

  it('does not mutate the array it is given', () => {
    const items = [
      post('a', '2026-01-01', 5),
      post('b', '2026-01-02', 40),
      post('c', '2026-01-03', 12),
      post('d', '2026-01-04', 1),
    ];
    const original = items.map((item) => item.id);

    rankPosts(items);

    expect(items.map((item) => item.id)).toEqual(original);
  });

  it('honours a custom featured count', () => {
    const items = [
      post('a', '2026-01-01', 5),
      post('b', '2026-01-02', 40),
      post('c', '2026-01-03', 12),
    ];

    const { featured, rest } = rankPosts(items, 1);

    expect(featured.map((item) => item.id)).toEqual(['b']);
    expect(rest.map((item) => item.id)).toEqual(['c', 'a']);
  });
});
