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
 * only once it has been written. Structure, order and button labels are not
 * here — they are code. The one link here is the Terapeuta block's link to the
 * story, which the owner asked to edit (2026-09-28), limited to a path on
 * this site.
 */

const EMPTY = 'Si lo dejas vacío, la web usa su texto por defecto.';

/**
 * A path on this site: one leading slash (not two — `//host` is another
 * site), then only the characters a kathu route uses. The site applies the
 * same rule before it renders the link, so a value that slips past the
 * Studio still never becomes a link off the site.
 */
const isInternalPath = (value: string) => /^\/(?!\/)[a-z0-9\-/]*$/.test(value.trim());

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
    { name: 'aboutTeaser', title: 'Terapeuta' },
    { name: 'testimonials', title: 'Testimonios' },
    { name: 'blogTeaser', title: 'Últimos drops' },
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
    // Named «Terapeuta» for the owner (2026-09-28); the field names stay
    // `aboutTeaser.*`, the contract the site reads.
    block('aboutTeaser', 'Terapeuta', [
      line('headline', 'Título'),
      paragraph('paragraph', 'Texto'),
      line(
        'linkLabel',
        'Texto del enlace',
        'Lo que se lee en el enlace a la historia, por ejemplo «Conoce la historia de kathu». ' + EMPTY,
      ),
      defineField({
        name: 'linkHref',
        title: 'Destino del enlace',
        type: 'string',
        description:
          'Una página de esta web, empezando por «/». Por ejemplo: /sobre-kathu. ' + EMPTY,
        validation: (rule) =>
          rule.custom((value) =>
            value === undefined || value === '' || isInternalPath(value)
              ? true
              : 'Escribe una dirección de esta web que empiece por «/», como /sobre-kathu.',
          ),
      }),
      defineField({
        name: 'image',
        title: 'Foto',
        type: 'image',
        description:
          'Una foto vertical de la florapeuta. Si la dejas vacía, la web muestra el retrato de Laura que trae de serie.',
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
      paragraph('lead', 'Frase de entrada'),
    ]),
    block('blogTeaser', 'Últimos drops', [line('headline', 'Titular'), paragraph('lead', 'Frase de entrada')]),
  ],
  preview: {
    prepare: () => ({ title: 'Portada', subtitle: 'Los textos de la página de inicio' }),
  },
});
