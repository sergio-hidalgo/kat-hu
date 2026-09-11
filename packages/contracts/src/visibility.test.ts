import { describe, expect, it } from 'vitest';
import {
  allVisibilityKeys,
  BLOCKS,
  PAGES,
  VISIBILITY_ID_PATTERN,
  visibilityKey,
  type VisibilityEntry,
} from './visibility.js';

/**
 * These run over whatever each registry holds, so they catch a duplicate id,
 * a shouted id or an empty label the moment an entry lands. `BLOCKS` is also
 * pinned exactly (spec 05): the page renders in its order, and the database
 * stores its ids.
 */
const registries: Array<[string, readonly VisibilityEntry[]]> = [
  ['BLOCKS', BLOCKS],
  ['PAGES', PAGES],
];

describe('visibilityKey', () => {
  it('builds the key the site_visibility table stores', () => {
    expect(visibilityKey('block', 'hero')).toBe('block:hero');
    expect(visibilityKey('page', 'sobre-kathu')).toBe('page:sobre-kathu');
  });
});

describe.each(registries)('%s', (name, entries) => {
  it('has no duplicate ids', () => {
    const ids = entries.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has ids a database key and a URL can both carry', () => {
    for (const entry of entries) {
      expect(entry.id, `${name} id ${entry.id}`).toMatch(VISIBILITY_ID_PATTERN);
    }
  });

  it('labels the owner can read', () => {
    for (const entry of entries) {
      expect(entry.label.trim().length, `${name} id ${entry.id}`).toBeGreaterThan(0);
    }
  });
});

describe('BLOCKS', () => {
  it('lists exactly the eight landing blocks, in the order the page shows them', () => {
    expect(BLOCKS.map((block) => block.id)).toEqual([
      'hero',
      'services',
      'how-it-works',
      'about-teaser',
      'testimonials',
      'blog-teaser',
      'shop-teaser',
      'cta',
    ]);
  });

  it('starts every block visible except the two teasers', () => {
    const hidden = BLOCKS.filter((block) => !block.defaultVisible).map((block) => block.id);

    expect(hidden).toEqual(['blog-teaser', 'shop-teaser']);
  });
});

describe('allVisibilityKeys', () => {
  it('never repeats a key across the two registries', () => {
    const keys = allVisibilityKeys();
    expect(new Set(keys).size).toBe(keys.length);
  });
});
