import { BLOCKS, PAGES, visibilityKey } from '@kat-hu/contracts';

/**
 * Which blocks and pages a visitor may see, resolved once per request by
 * `src/middleware.ts` and read from `Astro.locals.flags`.
 *
 * **Stub.** Spec 10 replaces `readFlags` with a read of
 * `public.site_visibility` (publishable key, select-only — a public read, so
 * it does not go through Nest) plus a short cache. Everything else here —
 * the shape, the defaults, the `isVisible` question a page asks — is final,
 * so the pages specs 05/07/08/11 write do not change when the real source
 * arrives.
 */
export type Flags = Readonly<Record<string, boolean>>;

/**
 * The answer before anyone has touched a switch: each entry's own
 * `defaultVisible`. An id that is not registered is not visible, because an
 * unregistered surface cannot be turned off and so must not be turned on
 * (`specs/README.md`).
 */
export function defaultFlags(): Flags {
  const flags: Record<string, boolean> = {};
  for (const block of BLOCKS) flags[visibilityKey('block', block.id)] = block.defaultVisible;
  for (const page of PAGES) flags[visibilityKey('page', page.id)] = page.defaultVisible;
  return flags;
}

/**
 * Resolve the flags for one request. Spec 10 gives this the database; today
 * it answers from the registries alone, which is "everything visible" in the
 * sense that nothing is registered yet.
 */
export async function readFlags(): Promise<Flags> {
  return defaultFlags();
}

/**
 * Is this surface visible? The only question a page or a layout should ask.
 * Unknown key ⇒ `false`, so forgetting to register a block hides it rather
 * than shipping something the owner cannot switch off.
 */
export function isVisible(flags: Flags, kind: 'block' | 'page', id: string): boolean {
  return flags[visibilityKey(kind, id)] ?? false;
}
