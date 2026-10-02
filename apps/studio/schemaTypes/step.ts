import { defineField, defineType } from 'sanity';

/**
 * A step of «Cómo funciona» (spec 05b), in `block:how-it-works`. Field
 * *names* are a contract with `apps/client/src/data/landing.ts`. The site
 * numbers the steps by position, lowest `order` first; with none published,
 * it shows its own three defaults.
 */
export const step = defineType({
  name: 'step',
  title: 'Paso',
  type: 'document',
  description: 'Un paso de «Cómo funciona» en la portada. Se leen mejor dos, tres o cuatro pasos.',
  fields: [
    defineField({
      name: 'title',
      title: 'Nombre del paso',
      type: 'string',
      validation: (rule) => rule.required().error('Escribe el nombre del paso.'),
    }),
    defineField({
      name: 'description',
      title: 'Explicación',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'image',
      title: 'Imagen',
      type: 'image',
      description:
        'La imagen de la parte de arriba del paso. Se recorta en un rectángulo apaisado (7:3), así que deja lo importante en el centro. Sin imagen, la web muestra un bloque violeta.',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          title: 'Descripción de la imagen',
          type: 'string',
          description: 'Solo si la imagen cuenta algo a quien no puede verla. Si es decorativa, déjalo vacío.',
        }),
      ],
    }),
    defineField({
      name: 'order',
      title: 'Orden',
      type: 'number',
      description: 'Los números más bajos salen primero, de diez en diez (10, 20, 30). La web los numera sola.',
    }),
  ],
  orderings: [{ title: 'Orden', name: 'orderAsc', by: [{ field: 'order', direction: 'asc' }] }],
  preview: {
    select: { title: 'title', subtitle: 'description', media: 'image' },
  },
});
