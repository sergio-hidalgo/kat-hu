import { describe, expect, it } from 'vitest';
import { DROP_TYPES, DROP_TYPE_LABELS, isDropType } from './drops.js';

describe('drop types', () => {
  it('are exactly post, curiosidad, consejo and truco', () => {
    expect([...DROP_TYPES]).toEqual(['post', 'curiosidad', 'consejo', 'truco']);
  });

  it('have a label each', () => {
    for (const type of DROP_TYPES) expect(DROP_TYPE_LABELS[type]).toBeTruthy();
  });

  it('accepts the four ids and nothing else', () => {
    for (const type of DROP_TYPES) expect(isDropType(type)).toBe(true);
    for (const value of ['truko', 'Post', '', null, undefined, 3]) {
      expect(isDropType(value)).toBe(false);
    }
  });
});
