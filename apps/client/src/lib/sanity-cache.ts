import { sanityClient } from './sanity';
import { createTtlCache } from './ttl-cache';

/**
 * Sanity reads for the pages, cached (spec 05e, performance): the landing, the
 * drops and a drop's page each ask the content API on every request, and on
 * `/drops` that round trip is most of the server's time (200–830 ms measured).
 *
 * **How old content can get** — the promise in the README, *Content appears on
 * publish*, stays "under a minute and no rebuild": a value is fresh for 30 s,
 * then served once while it refreshes, and anything older than 2 min is waited
 * for. Together with the CDN's own short cache that keeps a published change
 * within about a minute of normal traffic.
 *
 * Off in development (`astro dev`) and in tests, where an edit or a mocked
 * client must show at once.
 */
const enabled = !import.meta.env.DEV;

export const sanityCache = createTtlCache({ ttlMs: 30_000, maxStaleMs: 120_000 });

export function cachedFetch<T>(query: string, params: Record<string, unknown>): Promise<T> {
  const load = () => sanityClient.fetch<T>(query, params);
  if (!enabled) return load();
  return sanityCache.get(`${query}\u0000${JSON.stringify(params)}`, load);
}
