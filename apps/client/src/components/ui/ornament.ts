/**
 * The two classical ornaments `/drops` wears (specs 04b, 04c), and the one
 * place their colour is decided.
 *
 * The owner's files carry their own fills; the design system allows no hex,
 * so each shape takes the nearest token. Recolouring a shape later is a
 * one-line change here.
 *
 * Class strings rather than colour values, like `header.ts` and `field.ts`:
 * Tailwind v4 scans `.ts` sources, so the utilities are still generated.
 */
export const ORNAMENTS = {
  /** `#574490` in the source → Violeta (v2). A card's bottom corners. */
  'small-corner': { tone: 'text-violet' },
  /**
   * `#9383bf` in the source, but the card corners' purple by the owner's
   * decision of 2026-09-10 — Violeta since v2. The pagination's flanks.
   */
  side: { tone: 'text-violet' },
} as const;

export type OrnamentName = keyof typeof ORNAMENTS;

/**
 * An ornament laid over a photograph — the `/drops` banner and a drop's main
 * image (spec 04c) — is the lightest tone instead of its own, by the owner's
 * decision of 2026-09-11. That was white under guide v1.5; v2 has no white at
 * all ("nunca blanco puro"), so it is Crema, the palette's lightest (spec 05c).
 */
export const KNOCKOUT_TONE = 'text-cream';

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
