import { existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { BLOCKS } from '@kat-hu/contracts';
import { describe, expect, it } from 'vitest';
import { BLOCK_COMPONENTS, blockFileName } from './registry';

/**
 * The registry in `packages/contracts`, the files in this folder and the map
 * in `registry.ts` must describe the same eight blocks (spec 05). A block
 * that is registered but has no file cannot render; a file that is not
 * registered could never be switched off.
 */
const folder = fileURLToPath(new URL('.', import.meta.url));

describe('block registry', () => {
  it('names a block’s file after its id', () => {
    expect(blockFileName('hero')).toBe('Hero.astro');
    expect(blockFileName('how-it-works')).toBe('HowItWorks.astro');
    expect(blockFileName('cta')).toBe('Cta.astro');
  });

  it('has a component file for every registered block', () => {
    for (const { id } of BLOCKS) {
      expect(existsSync(`${folder}${blockFileName(id)}`), id).toBe(true);
    }
  });

  it('has no block file the registry does not know', () => {
    const files = readdirSync(folder).filter((file) => file.endsWith('.astro')).sort();

    expect(files).toEqual(BLOCKS.map(({ id }) => blockFileName(id)).sort());
  });

  it('maps every registered id to a component, and nothing else', () => {
    expect(Object.keys(BLOCK_COMPONENTS).sort()).toEqual(BLOCKS.map(({ id }) => id).sort());
    for (const { id } of BLOCKS) expect(BLOCK_COMPONENTS[id], id).toBeTypeOf('function');
  });
});
