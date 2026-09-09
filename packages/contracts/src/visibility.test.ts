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
 * The registries are empty until specs 05/07/08/11 fill them, so these run
 * over whatever is there. They are written to start catching real mistakes —
 * a duplicate id, a shouted id, an English label — the moment an entry lands,
 * rather than to be rewritten then.
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

describe('allVisibilityKeys', () => {
  it('never repeats a key across the two registries', () => {
    const keys = allVisibilityKeys();
    expect(new Set(keys).size).toBe(keys.length);
  });
});
