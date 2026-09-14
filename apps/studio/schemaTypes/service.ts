import { defineField, defineType } from 'sanity';

/**
 * A session the landing offers (spec 05b): one card in `block:services`. Field
 * *names* are a contract with `apps/client/src/data/landing.ts`. The owner
 * writes as many as they want; the site shows them all, lowest `order` first.
 * With none published, it shows its own three defaults.
 */
export const service = defineType({
  name: 'service',
  title: 'Sesión',
  type: 'document',
  description: 'Una tarjeta de sesión en la portada. En la portada se ven en filas de tres.',
  fields: [
    defineField({
      name: 'title',
      title: 'Nombre de la sesión',
      type: 'string',
      validation: (rule) => rule.required().error('Escribe el nombre de la sesión.'),
    }),
    defineField({
      name: 'slug',
      title: 'Identificador para reservar',
      type: 'slug',
      description:
        'Aparece en el enlace para reservar: /reservar?servicio=… Pulsa «Generate» para crearlo desde el nombre y no lo cambies una vez publicada la sesión.',
      options: { source: 'title', maxLength: 96 },
      validation: (rule) => rule.required().error('Pulsa «Generate» para crear el identificador.'),
    }),
    defineField({
      name: 'description',
      title: 'Descripción',
      type: 'text',
      rows: 3,
      description: 'Dos líneas como mucho.',
    }),
    defineField({
      name: 'duration',
      title: 'Duración',
      type: 'string',
      description: 'Por ejemplo: 60 min.',
    }),
    defineField({
      name: 'modality',
      title: 'Modalidad',
      type: 'string',
      description: 'Por ejemplo: Online. Si lo dejas vacío, no se muestra.',
    }),
    defineField({
      name: 'price',
      title: 'Precio',
      type: 'string',
      description: 'Con el símbolo detrás, como en «55 €». Si lo dejas vacío, la tarjeta no muestra precio.',
      validation: (rule) =>
        rule
          .custom((value) =>
            !value || value.trim().endsWith('€') ? true : 'Pon el símbolo € detrás del número, como en «55 €».',
          )
          .warning(),
    }),
    defineField({
      name: 'image',
      title: 'Imagen',
      type: 'image',
      description:
        'La acuarela de la sesión. Se muestra pequeña (160×160) y entera, sin recortar. Sin imagen, la web pone un dibujo sencillo.',
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
      description:
        'Los números más bajos salen primero. Van de diez en diez (10, 20, 30) para poder meter una sesión entre dos.',
    }),
  ],
  orderings: [{ title: 'Orden', name: 'orderAsc', by: [{ field: 'order', direction: 'asc' }] }],
  preview: {
    select: { title: 'title', duration: 'duration', price: 'price', media: 'image' },
    prepare: ({ title, duration, price, media }) => ({
      title,
      subtitle: [duration, price].filter(Boolean).join(' • '),
      media,
    }),
  },
});
