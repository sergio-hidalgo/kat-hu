import { API_ERROR_CODES, apiError, parseApiError, type ApiError } from '@kat-hu/contracts';

/**
 * The one way this site talks to the Nest API.
 *
 * Everything the browser cannot be trusted with goes through here: booking
 * requests, admin writes, anything needing a role. Public reads (Sanity, like
 * counts, visibility flags) do not — they go straight from the Astro server
 * with the publishable key (`skills/db-schema`).
 *
 * It never throws on a failed request. An API error, a 502 from a proxy and a
 * dead connection all come back as the same `{ ok: false, error }`, because a
 * form that has to `try/catch` to show a message ends up showing none.
 */

const BASE_URL = (import.meta.env.PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/+$/, '');

export type ApiResult<T> = { ok: true; data: T } | { ok: false; status: number; error: ApiError };

export interface ApiOptions extends Omit<RequestInit, 'body'> {
  /** Serialised as JSON. Use `init.body` directly for anything else. */
  json?: unknown;
  /**
   * The visitor's Supabase access token. The Astro server forwards it as a
   * bearer header; the browser never calls the API with a cookie
   * (`skills/server-core`).
   */
  accessToken?: string;
}

/** The URL a path resolves to. Exported so tests can assert it without fetching. */
export function apiUrl(path: string): string {
  return `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export async function api<T>(path: string, options: ApiOptions = {}): Promise<ApiResult<T>> {
  const { json, accessToken, headers, ...init } = options;

  const requestHeaders = new Headers(headers);
  requestHeaders.set('Accept', 'application/json');
  if (json !== undefined) requestHeaders.set('Content-Type', 'application/json');
  if (accessToken) requestHeaders.set('Authorization', `Bearer ${accessToken}`);

  let response: Response;
  try {
    response = await fetch(apiUrl(path), {
      ...init,
      method: init.method ?? (json !== undefined ? 'POST' : 'GET'),
      headers: requestHeaders,
      ...(json !== undefined ? { body: JSON.stringify(json) } : {}),
    });
  } catch {
    /** No response at all: the API is down, or the network is. */
    return {
      ok: false,
      status: 0,
      error: apiError(
        API_ERROR_CODES.unreachable,
        'No hemos podido conectar. Comprueba tu conexión e inténtalo de nuevo.',
      ),
    };
  }

  const body = await readJson(response);

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      /**
       * A proxy or a crash can answer with HTML, so a body that is not our
       * shape becomes the generic error rather than being rendered raw.
       */
      error:
        parseApiError(body) ??
        apiError(
          API_ERROR_CODES.internal,
          'Algo no ha ido bien por nuestra parte. Inténtalo en un momento.',
        ),
    };
  }

  return { ok: true, data: body as T };
}

/** `null` rather than a throw when the body is empty (204) or not JSON. */
async function readJson(response: Response): Promise<unknown> {
  try {
    const text = await response.text();
    return text.length > 0 ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}
