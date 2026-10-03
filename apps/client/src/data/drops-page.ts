import { sanityClient } from '../lib/sanity';
import { mergeCopy } from './landing';

/**
 * The words on `/drops` itself (spec 05d): the banner and the two headings.
 * Field names are a contract with `apps/studio/schemaTypes/dropsPage.ts`. The
 * Spanish defaults ship in code and a written CMS string wins, exactly like the
 * landing's copy (`mergeCopy`: blank means not written, unknown fields never
 * reach the page). Sanity being unreachable returns the defaults.
 */
const DOC_TYPE = 'dropsPage';
const DOC_ID = 'dropsPage';

export interface DropsPageCopy {
  banner: { title: string; subtitle: string };
  featured: { title: string };
  recent: { title: string };
}

export const DROPS_PAGE_DEFAULTS: DropsPageCopy = {
  banner: {
    title: 'Mis drops',
    subtitle: 'Artículos, trucos, recomendaciones, y más...',
  },
  featured: { title: 'Los drops que más gustan' },
  recent: { title: 'También puedes leer...' },
};

const QUERY = /* groq */ `*[_type == $type && _id == $id][0] { banner, featured, recent }`;

export async function getDropsPageCopy(): Promise<DropsPageCopy> {
  let raw: unknown = null;

  try {
    raw = await sanityClient.fetch(QUERY, { type: DOC_TYPE, id: DOC_ID });
  } catch (error) {
    console.warn('[drops] could not read the page copy, using the defaults:', error);
  }

  return mergeCopy(DROPS_PAGE_DEFAULTS, raw);
}
