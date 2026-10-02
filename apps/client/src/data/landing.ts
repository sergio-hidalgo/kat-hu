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
  /** The card's subtitle: one short line saying what the session is. */
  description?: string;
  /** As shown, euro sign after the number: `55 €`. */
  price?: string;
  /** What the session includes: up to three short lines, each with a check. */
  features: string[];
  /** The booking button's words; the block's own default when the owner left it empty. */
  buttonLabel?: string;
  /** The owner's pick: a badge over the card and the one filled button. */
  preferred: boolean;
  /** The picture at the top of the card; a placeholder block without it. */
  image?: SanityImage;
}

/** A card lists three things at most (guide §07). */
export const MAX_FEATURES = 3;

export interface StepItem {
  title: string;
  description?: string;
  /** The picture over the step; a violet placeholder block without it. */
  image?: SanityImage;
}

export interface LandingCopy {
  hero: { headline: string; lead: string };
  services: { headline: string; lead: string; items: ServiceItem[] };
  'how-it-works': { headline: string; lead: string; steps: StepItem[] };
  /**
   * The Studio's «Terapeuta» tab. `image` is the owner's photo of Laura (the
   * block shows the brand portrait without it); `linkHref` is always a path
   * on this site — `getLandingCopy` enforces it.
   */
  'about-teaser': {
    headline: string;
    paragraph: string;
    linkLabel: string;
    linkHref: string;
    image?: SanityImage;
  };
  testimonials: { headline: string; lead: string };
  'blog-teaser': { headline: string; lead: string };
  /** Spec 11 gives the shop teaser its words. */
  'shop-teaser': Record<string, never>;
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
        features: ['Sesión de 60 minutos', 'Online', 'Esencias a medida'],
        preferred: true,
        price: '55 €',
      },
      {
        id: 'familia',
        title: 'Sesión para la familia multiespecie',
        description: 'Para cuando en casa conviven varios gatos, personas u otros animales y la armonía se ha roto.',
        features: ['Sesión de 90 minutos', 'Online', 'Plan para toda la casa'],
        preferred: false,
        price: '75 €',
      },
      {
        id: 'seguimiento',
        title: 'Seguimiento',
        description: 'Revisamos cómo ha respondido tu gato y ajustamos las esencias para que el cambio se quede.',
        features: ['Sesión de 30 minutos', 'Online', 'Ajuste de las esencias'],
        preferred: false,
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
        description: 'Haces tu reserva y nos cuentas qué está pasando en casa, desde cuándo y quién vive con tu gato.',
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
    linkLabel: 'Conoce la historia de kathu',
    linkHref: '/sobre-kathu',
  },
  testimonials: {
    headline: 'Lo que cuentan las familias',
    lead: 'Familias multiespecie que ya han pasado por una sesión con kathu.',
  },
  'blog-teaser': {
    headline: 'Últimos drops',
    lead: 'Ideas prácticas para entender mejor a tu gato, sin esperar a la próxima sesión.',
  },
  'shop-teaser': {},
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

/**
 * The lines a card lists: the owner's `features`, trimmed, blanks dropped, at
 * most three. A session written before the list existed has none, and falls
 * back to the duration and modality it did have, so its card does not go bare.
 */
function featuresOf(row: Record<string, unknown>): string[] {
  const listed = (Array.isArray(row.features) ? row.features : []).map(written);
  const lines = listed.some(Boolean) ? listed : [written(row.duration), written(row.modality)];
  return lines.filter((line): line is string => Boolean(line)).slice(0, MAX_FEATURES);
}

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
        price: written(row.price),
        features: featuresOf(row),
        buttonLabel: written(row.buttonLabel),
        preferred: row.preferred === true,
        image: uploaded(row.image),
      },
    ];
  });
}

/** The CMS steps that can be shown: a title, after trimming. */
function toStepItems(value: unknown): StepItem[] {
  return rowsOf(value).flatMap((row) => {
    const title = written(row.title);
    return title ? [{ title, description: written(row.description), image: uploaded(row.image) }] : [];
  });
}

/**
 * A path on this site, or nothing: one leading slash (not two — `//host` is
 * another site) and only the characters a kathu route uses. An editor's link
 * becomes an `href`, so anything else — `https://…`, `javascript:…` — is
 * refused here and the default link is used instead. The Studio applies the
 * same rule (`apps/studio/schemaTypes/landing.ts`); this is the one that
 * holds even if a value gets past it.
 */
export function internalPath(value: string): string | undefined {
  const path = value.trim();
  return /^\/(?!\/)[a-z0-9\-/]*$/.test(path) ? path : undefined;
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
    "blog-teaser": blogTeaser
  },
  "services": *[_type == $serviceType && defined(title) && defined(slug.current)]
    | order(coalesce(order, 1000) asc, _createdAt asc) {
      "id": slug.current,
      title,
      description,
      features,
      buttonLabel,
      preferred,
      duration,
      modality,
      price,
      image
    },
  "steps": *[_type == $stepType && defined(title)]
    | order(coalesce(order, 1000) asc, _createdAt asc) {
      title,
      description,
      image
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
  const about = {
    ...copy['about-teaser'],
    linkHref: internalPath(copy['about-teaser'].linkHref) ?? LANDING_DEFAULTS['about-teaser'].linkHref,
  };

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
    'about-teaser': image ? { ...about, image } : about,
  };
}
