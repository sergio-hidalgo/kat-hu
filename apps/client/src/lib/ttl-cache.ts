/**
 * A small in-memory cache for things read on every request: fresh for a short
 * while, then served *stale* while one refresh runs in the background, and never
 * stale beyond a ceiling.
 *
 * - **Fresh** (`ttlMs`): returned as is, no work.
 * - **Stale** (up to `maxStaleMs` old): returned at once, and a single refresh
 *   starts — the next request gets the new value. A visitor never waits on the
 *   content API once the page has been read recently.
 * - **Too old, or never read:** the caller waits for the load.
 * - **A failed load** is never kept. If an older value exists it is served (the
 *   site stays up through a content-API blip); if not, the error goes to the
 *   caller, whose own fallback — the defaults, an empty list — applies.
 * - **One load at a time per key**: a burst of requests shares one call.
 *
 * It lives in one Node process, so it is per-instance, not shared — enough to
 * stop every request paying the API's round trip, and nothing that needs
 * invalidating: the ceiling is what bounds how old content can be.
 */
export interface TtlCacheOptions {
  ttlMs: number;
  maxStaleMs: number;
  /** For tests. */
  now?: () => number;
}

interface Entry<T> {
  value: T;
  at: number;
}

export function createTtlCache({ ttlMs, maxStaleMs, now = Date.now }: TtlCacheOptions) {
  const entries = new Map<string, Entry<unknown>>();
  const loading = new Map<string, Promise<unknown>>();

  function load<T>(key: string, loader: () => Promise<T>): Promise<T> {
    const running = loading.get(key) as Promise<T> | undefined;
    if (running) return running;

    const started = loader()
      .then((value) => {
        entries.set(key, { value, at: now() });
        return value;
      })
      .finally(() => loading.delete(key));
    loading.set(key, started);
    return started;
  }

  return {
    async get<T>(key: string, loader: () => Promise<T>): Promise<T> {
      const entry = entries.get(key) as Entry<T> | undefined;
      const age = entry ? now() - entry.at : Infinity;

      if (entry && age < ttlMs) return entry.value;

      if (entry && age < maxStaleMs) {
        // Serve what we have; refresh once, quietly. A failure keeps the old value.
        load(key, loader).catch(() => {});
        return entry.value;
      }

      try {
        return await load(key, loader);
      } catch (error) {
        if (entry) return entry.value;
        throw error;
      }
    },
    clear(): void {
      entries.clear();
      loading.clear();
    },
  };
}
