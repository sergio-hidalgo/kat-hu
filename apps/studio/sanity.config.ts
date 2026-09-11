import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { schemaTypes } from './schemaTypes';

function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing ${name}. Copy apps/studio/.env.example to apps/studio/.env ` +
        `and fill in the values from https://manage.sanity.io.`,
    );
  }
  return value;
}

const projectId = requireEnv(
  'SANITY_STUDIO_PROJECT_ID',
  process.env.SANITY_STUDIO_PROJECT_ID,
);
const dataset = process.env.SANITY_STUDIO_DATASET || 'production';

/**
 * Documents there is exactly one of. Pinned at the top of the structure with a
 * fixed id, left out of "new document", and stripped of duplicate and delete,
 * so the editor can never make a second (`content-sanity`).
 */
const SINGLETONS = new Set(['landing']);

export default defineConfig({
  name: 'default',
  title: 'kat-hu',
  projectId,
  dataset,
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Contenido')
          .items([
            S.listItem()
              .title('Portada')
              .id('landing')
              .child(S.document().schemaType('landing').documentId('landing')),
            S.divider(),
            ...S.documentTypeListItems().filter((item) => !SINGLETONS.has(item.getId() ?? '')),
          ]),
    }),
    visionTool(),
  ],
  schema: {
    types: schemaTypes,
    templates: (templates) => templates.filter(({ schemaType }) => !SINGLETONS.has(schemaType)),
  },
  document: {
    actions: (actions, { schemaType }) =>
      SINGLETONS.has(schemaType)
        ? actions.filter(({ action }) => action && ['publish', 'discardChanges', 'restore'].includes(action))
        : actions,
  },
});
