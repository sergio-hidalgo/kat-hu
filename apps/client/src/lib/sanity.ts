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
  /*
   * The public, cached API. Since spec 04 this is read while rendering each
   * request rather than at build time, so the CDN's short cache is what stands
   * between publishing a post and seeing it — under a minute, and no rebuild.
   */
  useCdn: true,
  // Never serve unpublished drafts to the site.
  perspective: 'published',
});

const builder = createImageUrlBuilder({ projectId, dataset });

/** Build a CDN URL for a Sanity image: `imageUrl(img).width(1200).url()`. */
export function imageUrl(source: SanityImage) {
  return builder.image(source).auto('format').fit('max');
}

/**
 * A responsive set of one cropped Sanity image: the same crop (`width` over
 * `height`, honouring the owner's hotspot) at several widths, as the `src` /
 * `srcset` pair an `<img>` takes. The CDN resizes per request, so offering more
 * widths costs nothing at rest; what it saves is the phone that was handed an
 * 800px file for a 360px slot. `src` is the largest, for a browser that reads
 * no `srcset`; `width` and `height` are its intrinsic size, which reserve the
 * space (no layout shift). With no `ratio` the picture keeps its own shape (no
 * crop, no `height`), as on a drop's page.
 */
export function imageSet(
  source: SanityImage,
  { widths, ratio }: { widths: readonly number[]; ratio?: number },
) {
  const sorted = [...widths].sort((a, b) => a - b);
  const url = (width: number) => {
    const sized = imageUrl(source).width(width);
    return (ratio ? sized.height(Math.round(width / ratio)).fit('crop') : sized).url();
  };
  const largest = sorted[sorted.length - 1];
  return {
    src: url(largest),
    srcset: sorted.map((width) => `${url(width)} ${width}w`).join(', '),
    width: largest,
    height: ratio ? Math.round(largest / ratio) : undefined,
  };
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
