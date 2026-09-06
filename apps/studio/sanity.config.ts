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

export default defineConfig({
  name: 'default',
  title: 'kat-hu',
  projectId,
  dataset,
  plugins: [structureTool(), visionTool()],
  schema: { types: schemaTypes },
});
