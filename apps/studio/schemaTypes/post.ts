import { DROP_TYPES, DROP_TYPE_LABELS } from '@kat-hu/contracts';
import { defineArrayMember, defineField, defineType } from 'sanity';

/**
 * Read by the Astro client at /drops. The field *names* are a contract with
 * `apps/client/src/data/posts.ts` — renaming one here empties that section.
 * The titles are what the editor sees, so they are in Spanish.
 */
export const post = defineType({
  name: 'post',
  title: 'Entrada',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Título',
      type: 'string',
      validation: (rule) => rule.required().error('El título es obligatorio.'),
    }),
    defineField({
      name: 'dropType',
      title: 'Tipo de drop',
      type: 'string',
      description: 'Aparece como etiqueta en el listado y en la entrada, y permite filtrar.',
      options: {
        list: DROP_TYPES.map((value) => ({ value, title: DROP_TYPE_LABELS[value] })),
        layout: 'radio',
      },
      initialValue: 'post',
      validation: (rule) => rule.required().error('Elige el tipo de drop.'),
    }),
    defineField({
      name: 'slug',
      title: 'Dirección web',
      type: 'slug',
      description:
        'Se genera desde el título. Aparece en la URL: /drops/mi-entrada/',
      options: { source: 'title', maxLength: 96 },
      validation: (rule) =>
        rule.required().error('Pulsa «Generate» para crear la dirección web.'),
    }),
    defineField({
      name: 'excerpt',
      title: 'Resumen',
      type: 'text',
      rows: 3,
      description:
        'Una o dos frases que aparecen en el listado. Si lo dejas vacío, se usa el principio del contenido.',
    }),
    defineField({
      name: 'publishedAt',
      title: 'Fecha de publicación',
      type: 'datetime',
      description: 'Ordena las entradas: la más reciente aparece primero.',
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: 'mainImage',
      title: 'Imagen principal',
      type: 'image',
      description: 'Se muestra en el listado y en la cabecera de la entrada.',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          title: 'Texto alternativo',
          type: 'string',
          description: 'Describe la imagen para quien no puede verla.',
        }),
      ],
    }),
    defineField({
      name: 'body',
      title: 'Contenido',
      type: 'array',
      of: [
        defineArrayMember({ type: 'block' }),
        defineArrayMember({
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({
              name: 'alt',
              title: 'Texto alternativo',
              type: 'string',
            }),
          ],
        }),
      ],
      validation: (rule) => rule.required().error('El contenido es obligatorio.'),
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'publishedAt', media: 'mainImage', dropType: 'dropType' },
    prepare({ title, subtitle, media, dropType }) {
      const date = subtitle
        ? new Date(subtitle).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })
        : 'Sin fecha';
      const label = DROP_TYPES.find((type) => type === dropType);
      return {
        title,
        media,
        subtitle: label ? `${DROP_TYPE_LABELS[label]} · ${date}` : date,
      };
    },
  },
});
