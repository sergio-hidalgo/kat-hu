import { z } from 'zod';

/**
 * The one error shape the API ever returns (`skills/server-core`). Defined
 * here rather than in the server so that `apps/client/src/lib/api.ts` parses
 * exactly what Nest's `ExceptionFilter` produces, and neither side can drift.
 *
 * ```json
 * { "code": "booking.rate_limited",
 *   "message": "Espera un momento antes de volver a enviar.",
 *   "details": { "email": "Escribe un email válido" } }
 * ```
 */

/** `domain.reason` — stable, English, safe to branch on in the client. */
export const apiErrorCodeSchema = z
  .string()
  .regex(/^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/, 'code must look like domain.reason');

export const apiErrorSchema = z.object({
  code: apiErrorCodeSchema,
  /** Spanish, and safe to show to a visitor as-is. Never a stack or a query. */
  message: z.string().min(1),
  /**
   * Field-level messages for a form: `{ email: "Escribe un email válido" }`.
   * Never the submitted payload, never anything from Postgres.
   */
  details: z.record(z.string(), z.string()).default({}),
});

export type ApiError = z.infer<typeof apiErrorSchema>;

/** Codes both sides need by name. Feature specs add their own alongside. */
export const API_ERROR_CODES = {
  /** No or bad credentials. The client turns this into a redirect to /entrar. */
  unauthorized: 'auth.unauthorized',
  /** Signed in, but not allowed. */
  forbidden: 'auth.forbidden',
  /** The request body failed its schema; `details` says which fields. */
  validationFailed: 'request.validation_failed',
  /** Anything we did not anticipate. The real cause is logged, never returned. */
  internal: 'server.internal_error',
  /** The API could not be reached at all — produced by the client, not the API. */
  unreachable: 'network.unreachable',
} as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];

/**
 * Build an error body. Used by the Nest filter, and by the client when the
 * API cannot be reached at all and there is no body to parse.
 */
export function apiError(
  code: string,
  message: string,
  details: Record<string, string> = {},
): ApiError {
  return { code, message, details };
}

/**
 * Narrow an unknown response body to `ApiError`. Returns `null` rather than
 * throwing, so a caller handling a failed request never fails twice.
 */
export function parseApiError(body: unknown): ApiError | null {
  const parsed = apiErrorSchema.safeParse(body);
  return parsed.success ? parsed.data : null;
}
