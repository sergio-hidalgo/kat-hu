import { describe, expect, it } from 'vitest';
import { BLOCKS, PAGES } from '@kat-hu/contracts';
import { defaultFlags, isVisible, readFlags } from './flags';

describe('defaultFlags', () => {
  it('has one entry per registered block and page', () => {
    expect(Object.keys(defaultFlags())).toHaveLength(BLOCKS.length + PAGES.length);
  });

  it('keys entries the way site_visibility stores them', () => {
    for (const key of Object.keys(defaultFlags())) {
      expect(key).toMatch(/^(block|page):[a-z0-9-]+$/);
    }
  });
});

describe('isVisible', () => {
  it('is false for a surface nobody registered', () => {
    expect(isVisible({}, 'block', 'not-registered')).toBe(false);
    expect(isVisible({}, 'page', 'tienda')).toBe(false);
  });

  it('reads the flag when there is one', () => {
    expect(isVisible({ 'block:hero': true }, 'block', 'hero')).toBe(true);
    expect(isVisible({ 'block:hero': false }, 'block', 'hero')).toBe(false);
  });
});

describe('readFlags', () => {
  it('resolves to the defaults until spec 10 gives it a database', async () => {
    await expect(readFlags()).resolves.toEqual(defaultFlags());
  });
});
