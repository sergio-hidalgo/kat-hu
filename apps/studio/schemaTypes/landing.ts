import { defineField, defineType } from 'sanity';

/**
 * The words on the landing (spec 05) — one document, pinned in the structure
 * so there is never a second. Field *names* are a contract with
 * `apps/client/src/data/landing.ts`; renaming one silently returns the site
 * to its default text for that field.
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

const service = (name: string, title: string) =>
  defineField({
    name,
    title,
    type: 'object',
    options: { collapsible: true, collapsed: true },
    fields: [
      line('title', 'Nombre de la sesión'),
      paragraph('description', 'Descripción', 'Dos líneas como mucho. ' + EMPTY),
      line('duration', 'Duración', 'Por ejemplo: 60 min. ' + EMPTY),
      line('modality', 'Modalidad', 'Por ejemplo: Online. ' + EMPTY),
      line('price', 'Precio', 'Con el símbolo detrás, como en «55 €». ' + EMPTY),
    ],
  });

const step = (name: string, title: string) =>
  defineField({
    name,
    title,
    type: 'object',
    options: { collapsible: true, collapsed: true },
    fields: [line('title', 'Título del paso'), paragraph('description', 'Explicación')],
  });

const block = (name: string, title: string, fields: ReturnType<typeof defineField>[]) =>
  defineField({ name, title, type: 'object', options: { collapsible: true }, fields });

export const landing = defineType({
  name: 'landing',
  title: 'Portada',
  type: 'document',
  fields: [
    block('hero', 'Cabecera', [line('headline', 'Titular'), paragraph('lead', 'Frase de entrada')]),
    block('services', 'Sesiones', [
      line('headline', 'Titular'),
      paragraph('lead', 'Frase de entrada'),
      service('individual', 'Sesión online individual'),
      service('familia', 'Sesión para la familia multiespecie'),
      service('seguimiento', 'Seguimiento'),
    ]),
    block('howItWorks', 'Cómo funciona', [
      line('headline', 'Titular'),
      paragraph('lead', 'Frase de entrada'),
      step('step1', 'Paso 1'),
      step('step2', 'Paso 2'),
      step('step3', 'Paso 3'),
    ]),
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
