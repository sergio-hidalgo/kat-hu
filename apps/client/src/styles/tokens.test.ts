import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * `src/styles/kathu-tokens.css` is a byte-for-byte copy of the design
 * system's token file, and the copy follows the reference, never the other
 * way round. This test is the guard against drift.
 *
 * `references/` is local-only (gitignored), so a clean clone and CI have
 * nothing to compare against. There the test skips with a reason rather than
 * failing for a file that was never meant to be checked out.
 */
const copyPath = fileURLToPath(new URL('./kathu-tokens.css', import.meta.url));
const referencePath = fileURLToPath(
  new URL('../../../../references/kathu-tokens.css', import.meta.url),
);

const hasReference = existsSync(referencePath);

describe('kathu-tokens.css', () => {
  it('exists in the app', () => {
    expect(existsSync(copyPath)).toBe(true);
  });

  it.skipIf(!hasReference)(
    'is byte-for-byte identical to references/kathu-tokens.css',
    () => {
      expect(readFileSync(copyPath, 'utf8')).toBe(
        readFileSync(referencePath, 'utf8'),
      );
    },
  );

  it.runIf(!hasReference)(
    'skips the parity check when references/ is not in this checkout',
    () => {
      expect(hasReference).toBe(false);
    },
  );
});
