import { defineArrayMember, defineField, defineType } from 'sanity';

/**
 * Read by the Astro client at /claves. The field *names* are a contract with
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
      name: 'slug',
      title: 'Dirección web',
      type: 'slug',
      description:
        'Se genera desde el título. Aparece en la URL: /claves/mi-entrada/',
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
    select: { title: 'title', subtitle: 'publishedAt', media: 'mainImage' },
    prepare({ title, subtitle, media }) {
      return {
        title,
        media,
        subtitle: subtitle
          ? new Date(subtitle).toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })
          : 'Sin fecha',
      };
    },
  },
});
