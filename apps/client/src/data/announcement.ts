/**
 * The advisory stripe's content and its switch.
 *
 * This module is a seam, and it is deliberately the only thing later specs
 * have to touch:
 *
 * - **Spec 10** replaces `enabled` with the visibility flag
 *   `block:announcement`, registered in `packages/contracts` and read from
 *   `locals.flags` like every other block. The registries do not exist until
 *   spec 04, which is why this ships a constant rather than a string hidden
 *   in the markup.
 * - **Spec 08** (or whichever spec adds a Sanity `siteSettings` singleton)
 *   moves `text`, `href` and `linkLabel` into the CMS. The shape stays; only
 *   the source changes.
 *
 * `enabled: false` emits no stripe at all and the layout drops its top
 * padding to the band alone. The decision is taken on the server at render
 * time, so there is no layout shift and no flash of a stripe that should not
 * be there.
 */
export type Announcement = {
  enabled: boolean;
  text: string;
  /** Optional — the sentence stands on its own without a link. */
  href?: string;
  linkLabel?: string;
};

export const announcement: Announcement = {
  enabled: true,
  text: 'Sesiones online para toda España.',
  href: '/reservar',
  linkLabel: 'Reserva tu primera consulta',
};
