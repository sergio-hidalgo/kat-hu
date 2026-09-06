import { createClient, type SanityClient } from '@sanity/client';
import { createImageUrlBuilder } from '@sanity/image-url';
import { toHTML } from '@portabletext/to-html';

/**
 * A Portable Text node. Kept local rather than imported from
 * `@portabletext/types`, which is only a transitive dependency here.
 */
export interface PortableTextNode {
  _type: string;
  _key?: string;
  [key: string]: unknown;
}

/** A Sanity image field, as returned raw from GROQ. */
export interface SanityImage {
  _type: 'image';
  asset: { _ref: string; _type: 'reference' };
  alt?: string;
  hotspot?: { x: number; y: number };
  crop?: { top: number; bottom: number; left: number; right: number };
}

/**
 * Read a build-time env var. Access must be a static `import.meta.env.X`
 * expression for Vite to replace it, so the value is passed in, not the key.
 */
function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing ${name}. Copy apps/client/.env.example to apps/client/.env ` +
        `and fill in the values from https://manage.sanity.io. ` +
        `See the "Content (Sanity CMS)" section of README.md.`,
    );
  }
  return value;
}

export const projectId = requireEnv(
  'PUBLIC_SANITY_PROJECT_ID',
  import.meta.env.PUBLIC_SANITY_PROJECT_ID,
);
export const dataset = requireEnv(
  'PUBLIC_SANITY_DATASET',
  import.meta.env.PUBLIC_SANITY_DATASET,
);
const apiVersion = import.meta.env.PUBLIC_SANITY_API_VERSION || '2026-01-01';

export const sanityClient: SanityClient = createClient({
  projectId,
  dataset,
  apiVersion,
  // Content is fetched at build time from the public, cached API.
  useCdn: true,
  // Never serve unpublished drafts to the site.
  perspective: 'published',
});

const builder = createImageUrlBuilder({ projectId, dataset });

/** Build a CDN URL for a Sanity image: `imageUrl(img).width(1200).url()`. */
export function imageUrl(source: SanityImage) {
  return builder.image(source).auto('format').fit('max');
}

/** Render a Portable Text body to an HTML string for `set:html`. */
export function portableTextToHtml(blocks: PortableTextNode[] = []): string {
  return toHTML(blocks, {
    components: {
      types: {
        image: ({ value }: { value: SanityImage }) => {
          if (!value?.asset?._ref) return '';
          const src = imageUrl(value).width(1600).url();
          const alt = value.alt ?? '';
          return `<img src="${src}" alt="${alt}" loading="lazy" decoding="async" />`;
        },
      },
      marks: {
        link: ({ value, children }) => {
          const href = String(value?.href ?? '');
          const external = /^https?:\/\//.test(href) && !href.includes(projectId);
          const rel = external ? ' rel="noopener noreferrer" target="_blank"' : '';
          return `<a href="${href}"${rel}>${children}</a>`;
        },
      },
    },
  });
}
