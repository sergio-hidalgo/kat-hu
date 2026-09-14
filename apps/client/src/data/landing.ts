import type { BlockId } from '@kat-hu/contracts';
import { sanityClient, type SanityImage } from '../lib/sanity';

/**
 * The words on the landing (spec 05), so the owner changes copy without a
 * deploy. Structure, order, links and button labels stay in code. Since spec
 * 05b there are two kinds of content, read in one round trip:
 *
 * - **What a block says once** — a heading, a lead, a paragraph — lives in the
 *   `landing` singleton and is laid over the Spanish defaults below **field by
 *   field**, only where the editor has written something.
 * - **What repeats** — the sessions and the steps — are documents of their own
 *   (`service`, `step`), as many as the owner wants. A list is taken **whole or
 *   not at all**: once the CMS has one usable item, only CMS items render; with
 *   none, the defaults do. Never a mix — a default card beside the owner's
 *   would offer a session that does not exist.
 *
 * An empty CMS, a half-filled one, or Sanity being unreachable all still render
 * a finished page — the landing is where bookings start, so it never waits on
 * the CMS.
 *
 * Field names are a contract with `apps/studio/schemaTypes/landing.ts`,
 * `service.ts` and `step.ts`. The same copy seeds the Studio from
 * `apps/studio/seed/landing.ts` (apps never import each other), so a change to
 * a default belongs in both.
 */
const DOC_TYPE = 'landing';

/** The singleton's fixed id, pinned by the Studio's structure. */
const DOC_ID = 'landing';

const SERVICE_TYPE = 'service';
const STEP_TYPE = 'step';

/** One session card. */
export interface ServiceItem {
  /** The document's slug — `/reservar?servicio=<id>`, which spec 06 reads. */
  id: string;
  title: string;
  description?: string;
  duration?: string;
  modality?: string;
  /** As shown, euro sign after the number: `55 €`. */
  price?: string;
  /** The owner's watercolour for the card's 160×160 slot. */
  image?: SanityImage;
}

export interface StepItem {
  title: string;
  description?: string;
}

export interface LandingCopy {
  hero: { headline: string; lead: string };
  services: { headline: string; lead: string; items: ServiceItem[] };
  'how-it-works': { headline: string; lead: string; steps: StepItem[] };
  /** `image` is the owner's second photo of Laura; the block works without it. */
  'about-teaser': { headline: string; paragraph: string; image?: SanityImage };
  testimonials: { headline: string };
  'blog-teaser': { headline: string; lead: string };
  /** Spec 11 gives the shop teaser its words. */
  'shop-teaser': Record<string, never>;
  cta: { headline: string };
}

/** Compile-time check that every registered block has an entry. */
type Exhaustive<T extends Record<BlockId, unknown>> = T;
export type LandingCopyByBlock = Exhaustive<LandingCopy>;

export const LANDING_DEFAULTS: LandingCopy = {
  hero: {
    headline: 'Acompañamiento floral para ti y para tus peludos',
    lead: 'Sesiones online pensadas para toda la familia multiespecie.',
  },
  services: {
    headline: 'Sesiones que se adaptan a tu casa',
    lead: 'Todas son online, así que tu gato se queda tranquilo en su territorio mientras buscamos lo que necesita.',
    items: [
      {
        id: 'individual',
        title: 'Sesión online individual',
        description:
          'Para ti y tu gato. Entendemos qué le está pasando y eliges con la florapeuta las esencias que le ayudan.',
        duration: '60 min',
        modality: 'Online',
        price: '55 €',
      },
      {
        id: 'familia',
        title: 'Sesión para la familia multiespecie',
        description:
          'Para cuando en casa conviven varios gatos, personas u otros animales y la armonía se ha roto.',
        duration: '90 min',
        modality: 'Online',
        price: '75 €',
      },
      {
        id: 'seguimiento',
        title: 'Seguimiento',
        description:
          'Revisamos cómo ha respondido tu gato y ajustamos las esencias para que el cambio se quede.',
        duration: '30 min',
        modality: 'Online',
        price: '30 €',
      },
    ],
  },
  'how-it-works': {
    headline: 'Cómo funciona una sesión',
    // No count in the lead: the owner decides how many steps there are.
    lead: 'Paso a paso, sin que tu gato tenga que salir de casa.',
    steps: [
      {
        title: 'Cuéntanos',
        description:
          'Haces tu reserva y nos cuentas qué está pasando en casa, desde cuándo y quién vive con tu gato.',
      },
      {
        title: 'Sesión',
        description:
          'Hablamos por videollamada, con calma: escuchamos, observamos y buscamos juntos el origen del malestar.',
      },
      {
        title: 'Esencias y seguimiento',
        description:
          'Recibes la fórmula de flores pensada para tu gato y te acompañamos después para ver cómo evoluciona.',
      },
    ],
  },
  'about-teaser': {
    headline: 'Una florapeuta que entiende a los gatos',
    paragraph:
      'Soy Laura. Acompaño a familias multiespecie con terapia floral para que la convivencia sea más tranquila y el vínculo con tu gato, más fuerte.',
  },
  testimonials: {
    headline: 'Lo que cuentan las familias',
  },
  'blog-teaser': {
    headline: 'Últimos drops',
    lead: 'Ideas prácticas para entender mejor a tu gato, sin esperar a la próxima sesión.',
  },
  'shop-teaser': {},
  cta: {
    headline: 'Empieza hoy a entender qué necesita tu gato.',
  },
};

/**
 * The fallback, with every string the CMS has actually filled laid over it.
 * Only keys the fallback has are read — an unexpected field in the document
 * never reaches a page — and a blank or whitespace-only string counts as not
 * written. A list is returned as the fallback has it: lists are never merged
 * item by item, they follow the whole-or-nothing rule in `getLandingCopy`.
 * Exported so the rule is tested directly.
 */
export function mergeCopy<T>(fallback: T, cms: unknown): T {
  if (typeof fallback === 'string') {
    return (typeof cms === 'string' && cms.trim() ? cms.trim() : fallback) as T;
  }
  if (Array.isArray(fallback)) return fallback;
  if (fallback && typeof fallback === 'object') {
    const source = cms && typeof cms === 'object' ? (cms as Record<string, unknown>) : {};
    return Object.fromEntries(
      Object.entries(fallback).map(([key, value]) => [key, mergeCopy(value, source[key])]),
    ) as T;
  }
  return fallback;
}

/** A written string, trimmed; anything else — blank included — is not written. */
const written = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value.trim() : undefined;

/** An image only once it points at an uploaded asset. */
const uploaded = (value: unknown): SanityImage | undefined =>
  (value as Partial<SanityImage> | null | undefined)?.asset?._ref ? (value as SanityImage) : undefined;

const rowsOf = (value: unknown): Record<string, unknown>[] =>
  Array.isArray(value) ? value.filter((row): row is Record<string, unknown> => !!row && typeof row === 'object') : [];

/** The CMS sessions that can be shown: a title and a slug, after trimming. */
function toServiceItems(value: unknown): ServiceItem[] {
  return rowsOf(value).flatMap((row) => {
    const id = written(row.id);
    const title = written(row.title);
    if (!id || !title) return [];
    return [
      {
        id,
        title,
        description: written(row.description),
        duration: written(row.duration),
        modality: written(row.modality),
        price: written(row.price),
        image: uploaded(row.image),
      },
    ];
  });
}

/** The CMS steps that can be shown: a title, after trimming. */
function toStepItems(value: unknown): StepItem[] {
  return rowsOf(value).flatMap((row) => {
    const title = written(row.title);
    return title ? [{ title, description: written(row.description) }] : [];
  });
}

/** Whole from the CMS, or whole from the defaults — never a mix. */
const wholeOrDefault = <T>(cms: T[], fallback: T[]): T[] => (cms.length > 0 ? cms : fallback);

/**
 * Studio names are camelCase; the page keys copy by block id. Lists sort by
 * `order`, then oldest first: a sequence reads in the order it was written.
 */
const LANDING_QUERY = /* groq */ `{
  "landing": *[_type == $landingType && _id == $landingId][0] {
    hero,
    "services": services { headline, lead },
    "how-it-works": howItWorks { headline, lead },
    "about-teaser": aboutTeaser,
    testimonials,
    "blog-teaser": blogTeaser,
    cta
  },
  "services": *[_type == $serviceType && defined(title) && defined(slug.current)]
    | order(coalesce(order, 1000) asc, _createdAt asc) {
      "id": slug.current,
      title,
      description,
      duration,
      modality,
      price,
      image
    },
  "steps": *[_type == $stepType && defined(title)]
    | order(coalesce(order, 1000) asc, _createdAt asc) {
      title,
      description
    }
}`;

interface LandingQueryResult {
  landing?: Record<string, unknown> | null;
  services?: unknown;
  steps?: unknown;
}

/** The landing's copy for this request: CMS where written, defaults elsewhere. */
export async function getLandingCopy(): Promise<LandingCopy> {
  let raw: LandingQueryResult | null = null;

  try {
    raw = await sanityClient.fetch<LandingQueryResult | null>(LANDING_QUERY, {
      landingType: DOC_TYPE,
      landingId: DOC_ID,
      serviceType: SERVICE_TYPE,
      stepType: STEP_TYPE,
    });
  } catch (error) {
    console.warn('[landing] could not read the copy, using the defaults:', error);
  }

  const copy = mergeCopy(LANDING_DEFAULTS, raw?.landing);
  const image = uploaded((raw?.landing?.['about-teaser'] as { image?: unknown } | null | undefined)?.image);

  return {
    ...copy,
    services: {
      ...copy.services,
      items: wholeOrDefault(toServiceItems(raw?.services), LANDING_DEFAULTS.services.items),
    },
    'how-it-works': {
      ...copy['how-it-works'],
      steps: wholeOrDefault(toStepItems(raw?.steps), LANDING_DEFAULTS['how-it-works'].steps),
    },
    'about-teaser': image ? { ...copy['about-teaser'], image } : copy['about-teaser'],
  };
}
