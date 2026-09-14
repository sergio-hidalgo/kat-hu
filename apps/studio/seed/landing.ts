import { getCliClient } from 'sanity/cli';

/**
 * Starts the landing's content from what the site shows today (spec 05b), so
 * the owner edits the copy rather than retyping it. Run once, from the repo
 * root, logged in with `sanity login`:
 *
 *   pnpm --filter studio seed
 *
 * It writes seven **published** documents with fixed ids to the project and
 * dataset `sanity.cli.ts` resolves, and it is safe to run again: each one is
 * `createIfNotExists`, so a document the owner has edited is never touched.
 * No testimonials — invented ones published as real would be fabricated
 * reviews — no images and no posts.
 *
 * The copy is the same as `LANDING_DEFAULTS` in
 * `apps/client/src/data/landing.ts`, deliberately written twice: apps never
 * import each other. After the seed the Studio is the truth, and those
 * defaults are only the site's fallback when Sanity cannot be reached.
 */

const client = getCliClient({ apiVersion: '2026-01-01' });

type SeedDocument = { _id: string; _type: string } & Record<string, unknown>;

const DOCUMENTS: SeedDocument[] = [
  {
    _id: 'landing',
    _type: 'landing',
    hero: {
      headline: 'Acompañamiento floral para ti y para tus peludos',
      lead: 'Sesiones online pensadas para toda la familia multiespecie.',
    },
    services: {
      headline: 'Sesiones que se adaptan a tu casa',
      lead: 'Todas son online, así que tu gato se queda tranquilo en su territorio mientras buscamos lo que necesita.',
    },
    howItWorks: {
      headline: 'Cómo funciona una sesión',
      lead: 'Paso a paso, sin que tu gato tenga que salir de casa.',
    },
    aboutTeaser: {
      headline: 'Una florapeuta que entiende a los gatos',
      paragraph:
        'Soy Laura. Acompaño a familias multiespecie con terapia floral para que la convivencia sea más tranquila y el vínculo con tu gato, más fuerte.',
    },
    testimonials: { headline: 'Lo que cuentan las familias' },
    blogTeaser: {
      headline: 'Últimos drops',
      lead: 'Ideas prácticas para entender mejor a tu gato, sin esperar a la próxima sesión.',
    },
    cta: { headline: 'Empieza hoy a entender qué necesita tu gato.' },
  },
  {
    _id: 'service-individual',
    _type: 'service',
    title: 'Sesión online individual',
    slug: { _type: 'slug', current: 'individual' },
    description:
      'Para ti y tu gato. Entendemos qué le está pasando y eliges con la florapeuta las esencias que le ayudan.',
    duration: '60 min',
    modality: 'Online',
    price: '55 €',
    order: 10,
  },
  {
    _id: 'service-familia',
    _type: 'service',
    title: 'Sesión para la familia multiespecie',
    slug: { _type: 'slug', current: 'familia' },
    description: 'Para cuando en casa conviven varios gatos, personas u otros animales y la armonía se ha roto.',
    duration: '90 min',
    modality: 'Online',
    price: '75 €',
    order: 20,
  },
  {
    _id: 'service-seguimiento',
    _type: 'service',
    title: 'Seguimiento',
    slug: { _type: 'slug', current: 'seguimiento' },
    description: 'Revisamos cómo ha respondido tu gato y ajustamos las esencias para que el cambio se quede.',
    duration: '30 min',
    modality: 'Online',
    price: '30 €',
    order: 30,
  },
  {
    _id: 'step-cuentanos',
    _type: 'step',
    title: 'Cuéntanos',
    description:
      'Haces tu reserva y nos cuentas qué está pasando en casa, desde cuándo y quién vive con tu gato.',
    order: 10,
  },
  {
    _id: 'step-sesion',
    _type: 'step',
    title: 'Sesión',
    description:
      'Hablamos por videollamada, con calma: escuchamos, observamos y buscamos juntos el origen del malestar.',
    order: 20,
  },
  {
    _id: 'step-esencias',
    _type: 'step',
    title: 'Esencias y seguimiento',
    description:
      'Recibes la fórmula de flores pensada para tu gato y te acompañamos después para ver cómo evoluciona.',
    order: 30,
  },
];

async function seed() {
  const ids = DOCUMENTS.map(({ _id }) => _id);
  const existing = new Set(
    await client.fetch<string[]>('*[_id in $ids]._id', { ids }, { perspective: 'raw' }),
  );

  const transaction = DOCUMENTS.reduce((tx, doc) => tx.createIfNotExists(doc), client.transaction());
  await transaction.commit();

  for (const id of ids) console.log(`${existing.has(id) ? 'already there' : 'created'}  ${id}`);
}

seed().catch((error) => {
  console.error('Seed failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
