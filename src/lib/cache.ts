type CacheEntry<T> = { value: T; expiresAt: number };

const store = new Map<string, CacheEntry<unknown>>();

export async function getCached<T>(
  key: string,
  ttlMs: number,
  provider: () => Promise<T>
): Promise<T> {
  const now = Date.now();
  const cur = store.get(key) as CacheEntry<T> | undefined;
  if (cur && cur.expiresAt > now) return cur.value;
  const val = await provider();
  store.set(key, { value: val, expiresAt: now + ttlMs });
  setTimeout(() => {
    const e = store.get(key);
    if (e && e.expiresAt <= Date.now()) store.delete(key);
  }, ttlMs + 1000).unref?.();
  return val;
}

export function clearCache(prefix?: string) {
  if (!prefix) return store.clear();
  for (const k of Array.from(store.keys()))
    if (k.startsWith(prefix)) store.delete(k);
}
