/**
 * The two classical ornaments `/drops` wears (specs 04b, 04c), and the one
 * place their colour is decided.
 *
 * The owner's files carry their own fills; the design system allows no hex,
 * so each shape takes the nearest of the sixteen tokens — both within 8/255
 * per channel of the original, which is not a visible change. Recolouring a
 * shape later is a one-line change here.
 *
 * Class strings rather than colour values, like `header.ts` and `field.ts`:
 * Tailwind v4 scans `.ts` sources, so the utilities are still generated.
 */
export const ORNAMENTS = {
  /** `#574490` in the source → violet-600. A card's bottom corners. */
  'small-corner': { tone: 'text-violet-600' },
  /**
   * `#9383bf` in the source, but violet-600 by the owner's decision of
   * 2026-09-10 — the same purple as the card corners. The pagination's flanks.
   */
  side: { tone: 'text-violet-600' },
} as const;

export type OrnamentName = keyof typeof ORNAMENTS;

/**
 * An ornament laid over a photograph — the `/drops` banner and a drop's main
 * image (spec 04c) — is white instead of its own tone, by the owner's decision
 * of 2026-09-11. Guide §3.4 sanctions white for knockout marks over
 * photography; this is that case and no other.
 */
export const KNOCKOUT_TONE = 'text-white';

/**
 * Each file is drawn in one orientation — small-corner as bottom-left, side
 * as the left flank — and every other position is a mirror of it. The rule is
 * that an ornament's base sits against the edge it decorates.
 */
export type Flip = 'x' | 'y' | 'both';

const FLIPS: Record<Flip, string> = {
  x: '-scale-x-100',
  y: '-scale-y-100',
  both: '-scale-x-100 -scale-y-100',
};

/**
 * A mirror as `scale`, which Tailwind v4 writes to its own CSS property — so
 * a flip composes with a `-translate-x-1/2` instead of overwriting it.
 */
export function flipClass(flip?: Flip): string {
  return flip ? FLIPS[flip] : '';
}
