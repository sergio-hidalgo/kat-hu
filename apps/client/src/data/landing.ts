import type { BlockId } from '@kat-hu/contracts';
import { sanityClient, type SanityImage } from '../lib/sanity';

/**
 * The words on the landing (spec 05): one Sanity `landing` singleton with an
 * object per block, so the owner changes copy without a deploy. Structure,
 * order, links and button labels stay in code; only the words live there.
 *
 * Every string has a Spanish default below, and the CMS wins **field by
 * field**, only where the editor has written something. An empty document, a
 * half-filled one, or Sanity being unreachable all still render a finished
 * page — the landing is where bookings start, so it never waits on the CMS.
 *
 * Field names are a contract with `apps/studio/schemaTypes/landing.ts`.
 */
const DOC_TYPE = 'landing';

/** The singleton's fixed id, pinned by the Studio's structure. */
const DOC_ID = 'landing';

/** The services the cards offer, in order. `?servicio=<id>` for spec 06. */
export const SERVICE_IDS = ['individual', 'familia', 'seguimiento'] as const;
export type ServiceId = (typeof SERVICE_IDS)[number];

export interface ServiceCopy {
  title: string;
  description: string;
  duration: string;
  modality: string;
  /** As shown, euro sign after the number: `55 €`. */
  price: string;
}

export interface StepCopy {
  title: string;
  description: string;
}

export interface LandingCopy {
  hero: { headline: string; lead: string };
  services: { headline: string; lead: string } & Record<ServiceId, ServiceCopy>;
  'how-it-works': { headline: string; lead: string; steps: [StepCopy, StepCopy, StepCopy] };
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
    individual: {
      title: 'Sesión online individual',
      description:
        'Para ti y tu gato. Entendemos qué le está pasando y eliges con la florapeuta las esencias que le ayudan.',
      duration: '60 min',
      modality: 'Online',
      price: '55 €',
    },
    familia: {
      title: 'Sesión para la familia multiespecie',
      description:
        'Para cuando en casa conviven varios gatos, personas u otros animales y la armonía se ha roto.',
      duration: '90 min',
      modality: 'Online',
      price: '75 €',
    },
    seguimiento: {
      title: 'Seguimiento',
      description:
        'Revisamos cómo ha respondido tu gato y ajustamos las esencias para que el cambio se quede.',
      duration: '30 min',
      modality: 'Online',
      price: '30 €',
    },
  },
  'how-it-works': {
    headline: 'Cómo funciona una sesión',
    lead: 'Tres pasos, sin que tu gato tenga que salir de casa.',
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
 * written. Exported so the rule is tested directly.
 */
export function mergeCopy<T>(fallback: T, cms: unknown): T {
  if (typeof fallback === 'string') {
    return (typeof cms === 'string' && cms.trim() ? cms.trim() : fallback) as T;
  }
  if (Array.isArray(fallback)) {
    const list = Array.isArray(cms) ? cms : [];
    return fallback.map((item, index) => mergeCopy(item, list[index])) as T;
  }
  if (fallback && typeof fallback === 'object') {
    const source = cms && typeof cms === 'object' ? (cms as Record<string, unknown>) : {};
    return Object.fromEntries(
      Object.entries(fallback).map(([key, value]) => [key, mergeCopy(value, source[key])]),
    ) as T;
  }
  return fallback;
}

/** Studio names are camelCase; the page keys copy by block id. */
const LANDING_QUERY = /* groq */ `
  *[_type == $type && _id == $id][0] {
    hero,
    services,
    "how-it-works": {
      "headline": howItWorks.headline,
      "lead": howItWorks.lead,
      "steps": [howItWorks.step1, howItWorks.step2, howItWorks.step3]
    },
    "about-teaser": aboutTeaser,
    testimonials,
    "blog-teaser": blogTeaser,
    cta
  }
`;

/** The landing's copy for this request: CMS where written, defaults elsewhere. */
export async function getLandingCopy(): Promise<LandingCopy> {
  let raw: Record<string, unknown> | null = null;

  try {
    raw = await sanityClient.fetch<Record<string, unknown> | null>(LANDING_QUERY, {
      type: DOC_TYPE,
      id: DOC_ID,
    });
  } catch (error) {
    console.warn('[landing] could not read the copy, using the defaults:', error);
  }

  const copy = mergeCopy(LANDING_DEFAULTS, raw);
  const image = (raw?.['about-teaser'] as { image?: SanityImage } | undefined)?.image;

  if (image?.asset?._ref) copy['about-teaser'] = { ...copy['about-teaser'], image };

  return copy;
}
