/**
 * The chrome's height, in one place.
 *
 * The header is `fixed`, so its height is not a fact about the header alone:
 * the layout has to push `<main>` down by it, and anything the page scrolls to
 * has to reserve it as `scroll-margin-top` (issue I-007). Written down four
 * times, those numbers drift; written down here, they cannot.
 *
 * Class strings rather than pixel numbers, for the same reason `field.ts`
 * exports classes — Tailwind v4 scans `.ts` sources, so the utilities are
 * still generated, and no file has to translate a number into a utility.
 *
 * Sizes supersede guide §7.7 (72/64px) by the owner's decision of 2026-09-08:
 * the band is 20% taller so the lockup can be real text at a readable size.
 */

/** The bar itself: 80px, 88px from `md`. */
export const BAND_H = 'h-20 md:h-22';

/** The advisory stripe above it: 36px, 40px from `md`. */
export const STRIPE_H = 'h-9 md:h-10';

/** Stripe + band — what `<main>` clears when the announcement is on. */
export const CHROME_PT = 'pt-29 md:pt-32';

/** Band only — what `<main>` clears when the announcement is off. */
export const BAND_PT = 'pt-20 md:pt-22';

/**
 * Band only, deliberately: anything scrolled to is scrolled to, and by then
 * the stripe has collapsed.
 */
export const SCROLL_MT = 'scroll-mt-20 md:scroll-mt-22';

/** The lockup's `font-size` in the band. 30px ⇒ a 47px mark at `1.56em`. */
export const LOGO_SIZE = 30;
