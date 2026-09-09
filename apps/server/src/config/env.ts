import { z } from 'zod';

/**
 * The environment `apps/server` refuses to start without. Validated once at
 * boot so a missing variable is a startup error naming the variable, not a
 * `undefined is not a function` on the first request that needs it.
 *
 * Keep in sync with `apps/server/.env.example` and the table in
 * `skills/server-core`.
 */
export const envSchema = z.object({
  /** Port to listen on. The only variable with a default. */
  PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
  /**
   * Comma-separated origins allowed to call this API — the Astro client, and
   * nothing else. There is no wildcard: an empty value is a configuration
   * error, not "allow everything".
   */
  CLIENT_ORIGIN: z.string().min(1),
  SUPABASE_URL: z.url(),
  /**
   * The service-role key. Never `PUBLIC_`-prefixed, never sent to the client,
   * never logged (`skills/security-check` §6).
   */
  SUPABASE_SECRET_KEY: z.string().min(1),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Split `CLIENT_ORIGIN` into the list `enableCors` wants. Blank entries are
 * dropped so a trailing comma is not read as an empty origin.
 */
export function clientOrigins(env: Env): string[] {
  return env.CLIENT_ORIGIN.split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

/**
 * `ConfigModule`'s `validate` hook. Throwing here aborts the bootstrap, which
 * is the point: the process must not come up half-configured holding a
 * service-role key.
 */
export function validateEnv(raw: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(raw);

  if (!parsed.success) {
    const problems = parsed.error.issues
      .map((issue) => `  ${issue.path.join('.') || '(root)'} — ${issue.message}`)
      .join('\n');

    throw new Error(
      `apps/server cannot start: the environment is incomplete.\n${problems}\n\n` +
        `Copy apps/server/.env.example to apps/server/.env and fill it in. ` +
        `See the "Server" section of README.md.`,
    );
  }

  const env = parsed.data;

  if (clientOrigins(env).length === 0) {
    throw new Error(
      `apps/server cannot start: the environment is incomplete.\n` +
        `  CLIENT_ORIGIN — must list at least one origin\n`,
    );
  }

  return env;
}
