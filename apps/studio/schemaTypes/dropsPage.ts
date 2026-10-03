import { defineField, defineType } from 'sanity';

/**
 * The words on the `/drops` page itself — its banner and the two headings above
 * the cards. One document, pinned in the structure so there is never a second.
 * The drops are written apart, in «Entradas». Field *names* are a contract with
 * `apps/client/src/data/drops-page.ts`; renaming one silently returns the page
 * to its default text for that field.
 *
 * Every field is optional: the site ships Spanish defaults and uses a field
 * only once it has been written.
 */
const EMPTY = 'Si lo dejas vacío, la web usa su texto por defecto.';

export const dropsPage = defineType({
  name: 'dropsPage',
  title: 'Drops',
  type: 'document',
  fields: [
    defineField({
      name: 'banner',
      title: 'Banner',
      type: 'object',
      description: 'Los textos sobre la imagen de cabecera.',
      fields: [
        defineField({ name: 'title', title: 'Título', type: 'string', description: EMPTY }),
        defineField({ name: 'subtitle', title: 'Subtítulo', type: 'string', description: EMPTY }),
      ],
    }),
    defineField({
      name: 'featured',
      title: 'Drops destacados',
      type: 'object',
      description: 'Los más votados con «me gusta» salen aquí solos.',
      fields: [defineField({ name: 'title', title: 'Título', type: 'string', description: EMPTY })],
    }),
    defineField({
      name: 'recent',
      title: 'Resto de drops',
      type: 'object',
      description: 'El resto, por fecha, con el filtro por tipo encima.',
      fields: [defineField({ name: 'title', title: 'Título', type: 'string', description: EMPTY })],
    }),
  ],
  preview: { prepare: () => ({ title: 'Drops' }) },
});
