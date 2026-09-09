import { defineMiddleware } from 'astro:middleware';
import { readFlags } from './lib/flags';
import { readSession } from './lib/session';

/**
 * Runs before every on-demand page and puts two things on `Astro.locals`:
 *
 * - `flags` — which blocks and pages this visitor may see (spec 10 fills it)
 * - `session` — who they are, or null (spec 09 fills it)
 *
 * Resolved once per request so a page that reads them several times asks the
 * database once. The middleware only *gates the UI*: it never stands in for
 * an authorization check, which lives in Nest's guards (`skills/server-core`).
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const [flags, session] = await Promise.all([readFlags(), readSession()]);

  context.locals.flags = flags;
  context.locals.session = session;

  return next();
});
