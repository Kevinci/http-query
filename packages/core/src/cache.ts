type CacheEntry = { value: unknown; expiresAt: number };

/** A tiny TTL-based in-memory cache used for safe (idempotent) requests. */
export class SimpleMemoryCache {
  private map = new Map<string, CacheEntry>();

  constructor(private defaultTTL = 5_000) {}

  get<T>(key: string): T | undefined {
    const e = this.map.get(key);
    if (!e) return undefined;
    if (e.expiresAt < Date.now()) {
      this.map.delete(key);
      return undefined;
    }
    return e.value as T;
  }

  set(key: string, value: unknown, ttl?: number): void {
    const expiresAt = Date.now() + (ttl ?? this.defaultTTL);
    this.map.set(key, { value, expiresAt });
  }

  delete(key: string): void {
    this.map.delete(key);
  }

  clear(): void {
    this.map.clear();
  }
}
