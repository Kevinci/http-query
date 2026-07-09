/** Snapshot of a cached query, exposed to hooks via `useSyncExternalStore`. */
export interface QuerySnapshot<T = unknown> {
  data: T | undefined;
  error: unknown;
  updatedAt: number | undefined;
  fetching: boolean;
}

interface InternalEntry {
  snapshot: QuerySnapshot;
  promise?: Promise<unknown>;
  listeners: Set<() => void>;
}

const IDLE: QuerySnapshot = { data: undefined, error: undefined, updatedAt: undefined, fetching: false };

/**
 * A tiny observable query cache: dedupes in-flight requests by key, stores the
 * last result with a timestamp for staleness checks, and notifies subscribers
 * on every change. Shared across all hooks under one provider.
 */
export class QueryCache {
  private entries = new Map<string, InternalEntry>();

  private ensure(key: string): InternalEntry {
    let e = this.entries.get(key);
    if (!e) {
      e = { snapshot: IDLE, listeners: new Set() };
      this.entries.set(key, e);
    }
    return e;
  }

  private update(key: string, patch: Partial<QuerySnapshot>): void {
    const e = this.ensure(key);
    e.snapshot = { ...e.snapshot, ...patch };
    e.listeners.forEach((l) => l());
  }

  getSnapshot<T = unknown>(key: string): QuerySnapshot<T> {
    return this.ensure(key).snapshot as QuerySnapshot<T>;
  }

  subscribe(key: string, cb: () => void): () => void {
    const e = this.ensure(key);
    e.listeners.add(cb);
    return () => {
      e.listeners.delete(cb);
    };
  }

  /** Manually seed data (e.g. from SSR hydration). */
  setData<T>(key: string, data: T): void {
    this.update(key, { data, error: undefined, updatedAt: Date.now(), fetching: false });
    this.ensure(key).promise = undefined;
  }

  /**
   * Fetch through the cache. Returns the in-flight promise if one exists;
   * returns cached data immediately when still fresh (within `staleTime`).
   */
  fetch<T>(key: string, fn: () => Promise<T>, opts: { staleTime?: number; force?: boolean } = {}): Promise<T> {
    const e = this.ensure(key);
    const { staleTime = 0, force = false } = opts;
    const snap = e.snapshot;
    const isFresh =
      snap.updatedAt !== undefined && snap.error === undefined && Date.now() - snap.updatedAt < staleTime;

    if (!force && isFresh && snap.data !== undefined) return Promise.resolve(snap.data as T);
    if (e.promise) return e.promise as Promise<T>;

    this.update(key, { fetching: true });
    const p = fn().then(
      (data) => {
        this.update(key, { data, error: undefined, updatedAt: Date.now(), fetching: false });
        e.promise = undefined;
        return data;
      },
      (err) => {
        this.update(key, { error: err, fetching: false });
        e.promise = undefined;
        throw err;
      },
    );
    e.promise = p;
    return p;
  }

  /** Mark matching entries stale (forces the next fetch to hit the network). */
  invalidate(predicate?: (key: string) => boolean): void {
    for (const [key, e] of this.entries) {
      if (!predicate || predicate(key)) {
        e.snapshot = { ...e.snapshot, updatedAt: undefined };
        e.listeners.forEach((l) => l());
      }
    }
  }

  clear(): void {
    this.entries.clear();
  }
}
