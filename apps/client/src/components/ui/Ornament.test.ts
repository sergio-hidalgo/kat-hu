import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Ornament from './Ornament.astro';
import { KNOCKOUT_TONE, ORNAMENTS, type OrnamentName } from './ornament';

/**
 * The ornaments are the owner's drawings (spec 04b). What the app may change
 * is the wrapper — no style block, no ids, no hex, colour from CSS — and never
 * the shapes. The second half of this suite holds the geometry to
 * `references/`, which is local-only, so it skips on a clean clone the way
 * `styles/tokens.test.ts` does.
 */

const NAMES = Object.keys(ORNAMENTS) as OrnamentName[];

const REFERENCE_FILE: Record<OrnamentName, string> = {
  'small-corner': 'small_corner.svg',
  side: 'side.svg',
};

const appPath = (name: OrnamentName) =>
  fileURLToPath(new URL(`../../assets/brand/ornament-${name}.svg`, import.meta.url));
const referencePath = (name: OrnamentName) =>
  fileURLToPath(
    new URL(`../../../../../references/${REFERENCE_FILE[name]}`, import.meta.url),
  );

const hasReferences = NAMES.every((name) => existsSync(referencePath(name)));

/** Every geometry attribute, in document order. */
const geometry = (svg: string) =>
  [...svg.matchAll(/\b(d|cx|cy|r)="([^"]*)"/g)].map(([, key, value]) => `${key}=${value}`);
const viewBox = (svg: string) => svg.match(/viewBox="([^"]+)"/)?.[1];

/**
 * A style element in any spelling. Written as a pattern rather than the
 * literal tag, so this file does not itself trip the `ui-review.md` grep.
 */
const STYLE_TAG = /<\s*style\b/i;

async function render(props: Record<string, unknown>) {
  const container = await AstroContainer.create();
  return container.renderToString(Ornament, { props });
}

describe('Ornament', () => {
  it.each(NAMES)('renders %s as hidden decoration with no style, id or hex', async (name) => {
    const html = await render({ name });

    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('pointer-events-none');
    expect(html).toContain('<svg');
    expect(html).not.toMatch(STYLE_TAG);
    expect(html).not.toMatch(/\sid="/);
    expect(html).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });

  it.each(NAMES)('takes the token tone for %s', async (name) => {
    const html = await render({ name });

    expect(html).toContain(ORNAMENTS[name].tone);
  });

  it.each(NAMES)('paints %s white instead when it is a knockout over a photograph', async (name) => {
    const html = await render({ name, knockout: true });

    expect(html).toContain(KNOCKOUT_TONE);
    expect(html).not.toContain(ORNAMENTS[name].tone);
  });

  it('mirrors on x, y or both, and not at all without a flip', async () => {
    const none = await render({ name: 'side' });
    const x = await render({ name: 'side', flip: 'x' });
    const y = await render({ name: 'side', flip: 'y' });
    const both = await render({ name: 'side', flip: 'both' });

    expect(none).not.toMatch(/-scale-[xy]-100/);
    expect(x).toContain('-scale-x-100');
    expect(x).not.toContain('-scale-y-100');
    expect(y).toContain('-scale-y-100');
    expect(y).not.toContain('-scale-x-100');
    expect(both).toContain('-scale-x-100');
    expect(both).toContain('-scale-y-100');
  });

  it('passes the caller’s width and placement through', async () => {
    const html = await render({ name: 'small-corner', class: 'absolute w-12' });

    expect(html).toContain('absolute w-12');
  });
});

describe('ornament assets', () => {
  it.each(NAMES)('%s takes its colour from CSS', (name) => {
    const svg = readFileSync(appPath(name), 'utf8');

    expect(svg).toMatch(/^<svg [^>]*fill="currentColor"/);
    expect(svg).not.toContain('<?xml');
    expect(svg).not.toMatch(STYLE_TAG);
  });

  it.skipIf(!hasReferences).each(NAMES)(
    '%s keeps the viewBox and geometry of references/',
    (name) => {
      const copy = readFileSync(appPath(name), 'utf8');
      const original = readFileSync(referencePath(name), 'utf8');

      expect(viewBox(copy)).toBe(viewBox(original));
      expect(geometry(copy)).toEqual(geometry(original));
      expect(geometry(copy).length).toBeGreaterThan(0);
    },
  );
});
