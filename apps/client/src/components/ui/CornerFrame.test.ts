import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import CornerFrame from './CornerFrame.astro';
import { KNOCKOUT_TONE, ORNAMENTS } from './ornament';

/**
 * Four mirrors of one drawing over a photograph (spec 04c). `small-corner` is
 * drawn bottom-left, so which way each copy faces is the whole design: the
 * test pins every position's flip, and that all four are white knockout marks
 * rather than the cards' violet.
 */

async function render(props: Record<string, unknown>) {
  const container = await AstroContainer.create();
  return container.renderToString(CornerFrame, { props });
}

type Placed = { name: string; classes: string[] };

const ornaments = (html: string): Placed[] =>
  [...html.matchAll(/data-ornament="([^"]+)" class="([^"]*)"/g)].map(
    ([, name, classes]) => ({ name, classes: classes.split(' ') }),
  );

const flips = ({ classes }: Placed) =>
  [classes.includes('-scale-x-100') && 'x', classes.includes('-scale-y-100') && 'y']
    .filter(Boolean)
    .join('');

const at = (placed: Placed[], ...positions: string[]) => {
  const found = placed.find((item) => positions.every((position) => item.classes.includes(position)));
  if (!found) throw new Error(`no ornament at ${positions.join(' ')}`);
  return found;
};

describe('CornerFrame', () => {
  it('renders four small corners and nothing else, all hidden decoration', async () => {
    const html = await render({ top: 'top-0' });
    const placed = ornaments(html);

    expect(placed).toHaveLength(4);
    expect(placed.every((item) => item.name === 'small-corner')).toBe(true);
    expect(html).toContain('pointer-events-none');
    expect(html.match(/aria-hidden="true"/g)?.length).toBeGreaterThanOrEqual(5);
  });

  it('paints every corner white, not the cards’ violet', async () => {
    const placed = ornaments(await render({ top: 'top-0' }));

    for (const item of placed) {
      expect(item.classes).toContain(KNOCKOUT_TONE);
      expect(item.classes).not.toContain(ORNAMENTS['small-corner'].tone);
    }
  });

  it('mirrors the bottom-left drawing so each base sits against its own edges', async () => {
    const placed = ornaments(await render({ top: 'top-0' }));

    expect(flips(at(placed, 'top-0', 'left-0'))).toBe('y');
    expect(flips(at(placed, 'top-0', 'right-0'))).toBe('xy');
    expect(flips(at(placed, 'bottom-0', 'left-0'))).toBe('');
    expect(flips(at(placed, 'bottom-0', 'right-0'))).toBe('x');
  });

  it('starts the box where the caller says', async () => {
    const html = await render({ top: 'top-20 md:top-22' });

    expect(html).toMatch(/class="[^"]*\babsolute inset-x-0 bottom-0\b[^"]*top-20 md:top-22"/);
  });
});
