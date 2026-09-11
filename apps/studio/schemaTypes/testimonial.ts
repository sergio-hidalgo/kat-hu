import { defineField, defineType } from 'sanity';

/**
 * A testimonial for the landing (spec 05, guide §7.8). Field *names* are a
 * contract with `apps/client/src/data/testimonials.ts`. The site shows at
 * most three, lowest `order` first; with none, the block hides itself.
 */
export const testimonial = defineType({
  name: 'testimonial',
  title: 'Testimonio',
  type: 'document',
  fields: [
    defineField({
      name: 'quote',
      title: 'Lo que cuenta',
      type: 'text',
      rows: 4,
      validation: (rule) => rule.required().error('Escribe el testimonio.'),
    }),
    defineField({
      name: 'name',
      title: 'Nombre de la persona',
      type: 'string',
      validation: (rule) => rule.required().error('Escribe el nombre de la persona.'),
    }),
    defineField({
      name: 'cat',
      title: 'Nombre del gato',
      type: 'string',
      description: 'Aparece junto al nombre de la persona. Opcional.',
    }),
    defineField({
      name: 'order',
      title: 'Orden',
      type: 'number',
      description: 'Los números más bajos salen primero. En la portada se ven tres como mucho.',
    }),
  ],
  preview: {
    select: { name: 'name', cat: 'cat', quote: 'quote' },
    prepare: ({ name, cat, quote }) => ({
      title: cat ? `${name} • ${cat}` : name,
      subtitle: quote,
    }),
  },
});
