import { describe, expect, it } from 'vitest';
import { filterByType, offeredTypes, parseTypeParam } from './drop-filter';

const items = [
  { id: 'a', dropType: 'truco' },
  { id: 'b', dropType: 'post' },
  { id: 'c', dropType: 'truco' },
] as const;

describe('filterByType', () => {
  it('returns everything for all', () => {
    expect(filterByType([...items], 'all')).toHaveLength(3);
  });

  it('returns the matching subset in the order given', () => {
    expect(filterByType([...items], 'truco').map((item) => item.id)).toEqual(['a', 'c']);
  });

  it('returns nothing for a type with no drops', () => {
    expect(filterByType([...items], 'consejo')).toEqual([]);
  });
});

describe('parseTypeParam', () => {
  it('maps a known id to itself', () => {
    expect(parseTypeParam('curiosidad')).toBe('curiosidad');
  });

  it('maps unknown, empty or missing to all', () => {
    expect(parseTypeParam('nope')).toBe('all');
    expect(parseTypeParam('')).toBe('all');
    expect(parseTypeParam(null)).toBe('all');
    expect(parseTypeParam(undefined)).toBe('all');
  });
});

describe('offeredTypes', () => {
  it('offers only the types present, in the contract order', () => {
    expect(offeredTypes([...items])).toEqual(['post', 'truco']);
  });

  it('offers nothing when fewer than two types exist', () => {
    expect(offeredTypes([items[0], items[2]])).toEqual([]);
    expect(offeredTypes([])).toEqual([]);
  });
});
