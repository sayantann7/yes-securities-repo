// Generic in-memory cache with TTL and prefix invalidation
// This lives only for the process lifetime (clears on app reload).

interface CacheEntry<T=any> {
  value: T;
  expiresAt: number; // epoch ms
}

const store: Record<string, CacheEntry> = {};

export function setCache<T>(key: string, value: T, ttlMs: number): void {
  store[key] = { value, expiresAt: Date.now() + ttlMs };
}

export function getCache<T>(key: string): T | undefined {
  const entry = store[key];
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    delete store[key];
    return undefined;
  }
  return entry.value as T;
}

export function invalidateCache(key: string): void {
  delete store[key];
}

export function invalidateByPrefix(prefix: string): void {
  Object.keys(store).forEach(k => {
    if (k.startsWith(prefix)) delete store[k];
  });
}

export function clearAllCache(): void {
  Object.keys(store).forEach(k => delete store[k]);
}

// Simple helper to implement stale-while-revalidate pattern
export async function swr<T>(key: string, ttlMs: number, fetcher: () => Promise<T>, onBackgroundUpdate?: (data: T)=>void): Promise<T> {
  const existing = getCache<T>(key);
  if (existing) {
    // Kick off background refresh if > 50% TTL consumed
    const entry = (store as any)[key] as CacheEntry;
    if (Date.now() > entry.expiresAt - ttlMs / 2) {
      fetcher().then(data => {
        setCache(key, data, ttlMs);
        onBackgroundUpdate && onBackgroundUpdate(data);
      }).catch(()=>{});
    }
    return existing;
  }
  const fresh = await fetcher();
  setCache(key, fresh, ttlMs);
  return fresh;
}
