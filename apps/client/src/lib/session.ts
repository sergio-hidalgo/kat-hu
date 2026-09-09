/**
 * The signed-in visitor for this request, read from `Astro.locals.session`.
 *
 * **Stub.** Spec 09 fills this in with `@supabase/ssr`: cookie sessions read
 * in the middleware, the role from `public.profiles`, and the access token
 * the Astro server forwards to Nest as `Authorization: Bearer …`. Until then
 * `readSession` always answers `null` — nobody can be signed in yet — and the
 * shape is here so pages can already ask the question.
 */
export interface Session {
  user: { id: string; email: string | null };
  role: 'user' | 'admin';
  /** Forwarded to the API; never rendered into the page. */
  accessToken: string;
}

export async function readSession(): Promise<Session | null> {
  return null;
}
