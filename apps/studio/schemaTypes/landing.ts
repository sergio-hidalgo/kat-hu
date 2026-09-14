import { defineField, defineType } from 'sanity';

/**
 * The words on the landing (spec 05) — one document, pinned in the structure
 * so there is never a second. Field *names* are a contract with
 * `apps/client/src/data/landing.ts`; renaming one silently returns the site
 * to its default text for that field.
 *
 * It holds only what each block says once: its heading, lead or closing
 * sentence (spec 05b). What repeats is its own document type — `service`,
 * `step`, `testimonial` — so the owner decides how many there are. One tab per
 * block, so the editor sees one block at a time.
 *
 * Every field is optional: the site ships Spanish defaults and uses a field
 * only once it has been written. Structure, order, links and button labels
 * are not here — they are code.
 */

const EMPTY = 'Si lo dejas vacío, la web usa su texto por defecto.';

const line = (name: string, title: string, description = EMPTY) =>
  defineField({ name, title, type: 'string', description });

const paragraph = (name: string, title: string, description = EMPTY) =>
  defineField({ name, title, type: 'text', rows: 3, description });

/** One block's words, in the tab of the same name. */
const block = (
  name: string,
  title: string,
  fields: ReturnType<typeof defineField>[],
  description?: string,
) => defineField({ name, title, type: 'object', group: name, description, fields });

export const landing = defineType({
  name: 'landing',
  title: 'Portada',
  type: 'document',
  groups: [
    { name: 'hero', title: 'Cabecera', default: true },
    { name: 'services', title: 'Sesiones' },
    { name: 'howItWorks', title: 'Cómo funciona' },
    { name: 'aboutTeaser', title: 'Presentación' },
    { name: 'testimonials', title: 'Testimonios' },
    { name: 'blogTeaser', title: 'Últimos drops' },
    { name: 'cta', title: 'Llamada final' },
  ],
  fields: [
    block('hero', 'Cabecera', [line('headline', 'Titular'), paragraph('lead', 'Frase de entrada')]),
    block(
      'services',
      'Sesiones',
      [line('headline', 'Titular'), paragraph('lead', 'Frase de entrada')],
      'Las sesiones se escriben aparte, en «Sesión».',
    ),
    block(
      'howItWorks',
      'Cómo funciona',
      [line('headline', 'Titular'), paragraph('lead', 'Frase de entrada')],
      'Los pasos se escriben aparte, en «Paso».',
    ),
    block('aboutTeaser', 'Presentación', [
      line('headline', 'Titular'),
      paragraph('paragraph', 'Texto'),
      defineField({
        name: 'image',
        title: 'Foto',
        type: 'image',
        description: 'Una foto vertical de la florapeuta. Sin foto, el bloque se muestra solo con texto.',
        options: { hotspot: true },
        fields: [
          defineField({
            name: 'alt',
            title: 'Descripción de la foto',
            type: 'string',
            description: 'Qué se ve, para quien no puede verla. Por ejemplo: «Laura con su gata en brazos».',
          }),
        ],
      }),
    ]),
    block('testimonials', 'Testimonios', [
      line('headline', 'Titular', 'Los testimonios se escriben aparte, en «Testimonio». ' + EMPTY),
    ]),
    block('blogTeaser', 'Últimos drops', [line('headline', 'Titular'), paragraph('lead', 'Frase de entrada')]),
    block('cta', 'Llamada final', [line('headline', 'Frase de cierre')]),
  ],
  preview: {
    prepare: () => ({ title: 'Portada', subtitle: 'Los textos de la página de inicio' }),
  },
});
