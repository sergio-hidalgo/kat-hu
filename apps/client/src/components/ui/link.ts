/**
 * A link that is an action rather than a word in running prose — *Conoce la
 * historia de kathu*, *Ver todos los drops*, *¿Cómo funciona?* (spec 05).
 * Guide §07's *Enlace*: Violeta, underlined, no box, with a 44px target
 * (INT-01) — a bare inline anchor is only its line box.
 *
 * Class strings, like `field.ts` and `header.ts`: Tailwind v4 scans `.ts`.
 */
const base =
  'inline-flex min-h-11 items-center font-body text-sm font-medium underline decoration-1 underline-offset-4 transition-colors duration-fast hover:decoration-2';

/** On Crema, Hueso or Lavanda. */
export const TEXT_LINK = `${base} text-violet hover:text-violet-hover`;

/**
 * On the hero's gradient (owner's diagonal, 2026-09-27): Violeta text drops to
 * 3.4–4.1:1 where the words reach the Glicina side, so the words are Ink and
 * the Violeta underline is what says *link*.
 */
export const TEXT_LINK_ON_HERO = `${base} text-ink decoration-violet`;

/** On Violeta — the footer and the announcement. */
export const TEXT_LINK_ON_VIOLET = `${base} text-cream hover:text-lavender`;
