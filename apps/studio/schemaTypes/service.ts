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
      title: 'Subtítulo',
      type: 'string',
      description: 'Una línea corta que cuenta qué es la sesión, por ejemplo «Para toda la familia».',
    }),
    defineField({
      name: 'features',
      title: 'Qué incluye',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Hasta tres líneas cortas, cada una con su marca. Por ejemplo: «Análisis y primer diagnóstico».',
      validation: (rule) => rule.max(3).error('Tres líneas como mucho.'),
    }),
    defineField({
      name: 'buttonLabel',
      title: 'Texto del botón',
      type: 'string',
      description:
        'Lo que se lee en el botón de reservar de esta sesión, por ejemplo «Reserva tu sesión inicial». Si lo dejas vacío, dice «Reservar esta sesión».',
      validation: (rule) => rule.max(40).warning('Un texto corto cabe mejor en el botón.'),
    }),
    defineField({
      name: 'preferred',
      title: 'Sesión preferida',
      type: 'boolean',
      description:
        'Se muestra con la etiqueta «Preferido» y su botón en violeta. Marca solo una: si hay varias, todas se destacan.',
      initialValue: false,
      validation: (rule) =>
        rule
          .custom(async (value, context) => {
            if (value !== true) return true;
            const others = await context
              .getClient({ apiVersion: '2025-01-01' })
              .fetch<number>('count(*[_type == "service" && preferred == true && !(_id in [$id, "drafts." + $id])])', {
                id: (context.document?._id ?? '').replace(/^drafts\./, ''),
              });
            return others > 0 ? 'Ya hay otra sesión preferida. Quita la marca de la otra primero.' : true;
          })
          .warning(),
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
    // Written before «Qué incluye» existed. Hidden, not removed: a session that
    // has them keeps its values, and the site falls back to them until the list
    // is filled.
    defineField({
      name: 'duration',
      title: 'Duración (antiguo)',
      type: 'string',
      hidden: true,
    }),
    defineField({
      name: 'modality',
      title: 'Modalidad (antiguo)',
      type: 'string',
      hidden: true,
    }),
    defineField({
      name: 'image',
      title: 'Imagen',
      type: 'image',
      description:
        'La imagen de la parte de arriba de la tarjeta. Se recorta en un rectángulo apaisado (13:6), así que deja lo importante en el centro. Sin imagen, la web muestra un bloque gris.',
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
  orderings: [
    {
      title: 'Orden',
      name: 'orderAsc',
      by: [{ field: 'order', direction: 'asc' }],
    },
  ],
  preview: {
    select: {
      title: 'title',
      price: 'price',
      preferred: 'preferred',
      media: 'image',
    },
    prepare: ({ title, price, preferred, media }) => ({
      title,
      subtitle: [preferred && 'Preferida', price].filter(Boolean).join(' • '),
      media,
    }),
  },
});
