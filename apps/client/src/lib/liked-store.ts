/**
 * Remembers which posts this browser has already liked, so a reload does not
 * hand out a second like. This is a courtesy guard, not enforcement: it is
 * per-browser and clearable. Real protection needs auth or rate limiting.
 */
const STORAGE_KEY = 'kat-hu:liked-posts';

/** Cap on remembered ids, so the entry cannot grow without bound. */
const MAX_ENTRIES = 500;

/** Fallback when localStorage throws (private mode, blocked site data). */
const memory = new Set<string>();
let storageAvailable: boolean | null = null;

function storage(): Storage | null {
  if (storageAvailable === false) return null;

  try {
    const probe = '__kat_hu_probe__';
    window.localStorage.setItem(probe, probe);
    window.localStorage.removeItem(probe);
    storageAvailable = true;
    return window.localStorage;
  } catch {
    // Safari private mode and "block site data" both throw on write.
    storageAvailable = false;
    return null;
  }
}

/** Always returns a fresh copy, so callers can mutate it safely. */
function read(): Set<string> {
  const store = storage();
  if (!store) return new Set(memory);

  try {
    const raw = store.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === 'string'));
  } catch {
    // Corrupt or unreadable entry: start clean rather than break the button.
    return new Set();
  }
}

export function hasLiked(postId: string): boolean {
  return read().has(postId);
}

export function setLiked(postId: string, liked: boolean): void {
  const ids = read();

  if (liked) {
    ids.add(postId);
  } else {
    ids.delete(postId);
  }

  // Oldest entries fall off the front once the cap is passed.
  const trimmed = [...ids].slice(-MAX_ENTRIES);

  memory.clear();
  for (const id of trimmed) memory.add(id);

  const store = storage();
  if (!store) return;

  try {
    store.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // Quota exceeded: the in-memory copy still covers this page view.
  }
}
