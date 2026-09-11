import { sanityClient } from '../lib/sanity';

/**
 * Testimonials for the landing (spec 05, guide §7.8). The document type is a
 * contract with `apps/studio/schemaTypes/testimonial.ts`.
 *
 * At most three, lowest `order` first. A testimonial without a quote or a
 * name is not shown, and Sanity being unreachable shows none — the block
 * then hides itself rather than holding up the page.
 */
const DOC_TYPE = 'testimonial';

export interface TestimonialItem {
  id: string;
  quote: string;
  name: string;
  /** The cat's name, shown after the person's. */
  cat?: string;
}

const QUERY = /* groq */ `
  *[_type == $type && defined(quote) && defined(name)]
    | order(coalesce(order, 1000) asc, _createdAt desc) [0...3] {
      "id": _id,
      quote,
      name,
      cat
    }
`;

export async function getTestimonials(): Promise<TestimonialItem[]> {
  try {
    const rows = await sanityClient.fetch<Array<Partial<TestimonialItem>>>(QUERY, { type: DOC_TYPE });

    return (rows ?? [])
      .filter((row) => row.id && row.quote?.trim() && row.name?.trim())
      .map((row) => ({
        id: row.id!,
        quote: row.quote!.trim(),
        name: row.name!.trim(),
        cat: row.cat?.trim() || undefined,
      }));
  } catch (error) {
    console.warn('[testimonials] could not read them, showing none:', error);
    return [];
  }
}
