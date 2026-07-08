import { HttpError, NetworkError, ParseError, TimeoutError } from "./errors";
import { SimpleMemoryCache } from "./cache";
import { isSafeMethod, serializeQueryParams, delay } from "./utils";
import { resolveFallback } from "./fallback";
import { MiddlewareStack } from "./middleware";
import type { CreateClientOptions, QueryOptions, HTTPMethod } from "./types";

const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

function buildUrl(base?: string, path?: string) {
  if (!path) return base ?? "";
  if (!base) return path;
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

export class HttpClient {
  public readonly baseUrl?: string;
  public readonly headers: Record<string, string>;
  public readonly fallback?: HTTPMethod | null;
  public readonly timeout?: number;
  public readonly retries: number;
  public readonly cacheEnabled: boolean;
  public readonly cacheTTL: number;
  public readonly cache = new SimpleMemoryCache(5_000);
  public readonly middleware = new MiddlewareStack();

  constructor(opts: CreateClientOptions = {}) {
    this.baseUrl = opts.baseUrl;
    this.headers = { ...(opts.headers ?? {}), ...DEFAULT_HEADERS };
    this.fallback = opts.fallback ?? opts.fallback ?? "POST";
    this.timeout = opts.timeout;
    this.retries = opts.retries ?? 0;
    this.cacheEnabled = opts.cache ?? false;
    this.cacheTTL = opts.cacheTTL ?? 5_000;
  }

  use(fn: (client: HttpClient) => void) {
    fn(this);
    return this;
  }

  async request<T = unknown, B = unknown>(path: string, opts: QueryOptions<B, T> = {}): Promise<T> {
    const method = (opts.method ?? "QUERY") as HTTPMethod;
    const fallbackOrder = resolveFallback(method, opts.fallback ?? this.fallback ?? null);

    let lastErr: unknown;
    for (const m of fallbackOrder) {
      try {
        const result = await this.performWithRetries<T, B>(path, { ...opts, method: m });
        return result;
      } catch (err) {
        lastErr = err;
        // if 405 Method Not Allowed -> try fallback
        if (err instanceof HttpError && (err.status === 405 || err.status === 501)) {
          // continue to next fallback
          // eslint-disable-next-line no-continue
          continue;
        }
        // non-recoverable -> rethrow
        throw err;
      }
    }
    throw lastErr;
  }

  private async performWithRetries<T, B>(path: string, opts: QueryOptions<B, T>): Promise<T> {
    const attempts = Math.max(1, opts.retries ?? this.retries ?? 0) + 1;
    let lastErr: unknown;
    for (let i = 0; i < attempts; i++) {
      try {
        return await this.perform<T, B>(path, opts);
      } catch (err) {
        lastErr = err;
        const transient = err instanceof NetworkError || err instanceof TimeoutError;
        // only retry safe requests
        if (!transient || !isSafeMethod(opts.method ?? "QUERY")) throw err;
        if (i < attempts - 1) {
          const backoff = 2 ** i * 100;
          // eslint-disable-next-line no-await-in-loop
          await delay(backoff);
          continue;
        }
        throw err;
      }
    }
    throw lastErr;
  }

  private async perform<T, B>(path: string, opts: QueryOptions<B, T>): Promise<T> {
    const method = (opts.method ?? "QUERY") as HTTPMethod;
    let url = buildUrl(this.baseUrl, path);
    const headers = { ...(this.headers ?? {}), ...(opts.headers ?? {}) } as Record<string, string>;

    let bodyInit: BodyInit | undefined;
    if (method === "GET" && opts.body) {
      const qs = serializeQueryParams(opts.body as unknown as Record<string, unknown>);
      url += (url.includes("?") ? "&" : "?") + qs;
    } else if (opts.body !== undefined) {
      bodyInit = JSON.stringify(opts.body);
    }

    const keyForCache = `${method}:${url}:${bodyInit ?? ""}`;
    if ((opts.cache ?? this.cacheEnabled) && isSafeMethod(method)) {
      const cached = this.cache.get<T>(keyForCache);
      if (cached !== undefined) return cached;
    }

    const controller = new AbortController();
    const signal = opts.signal ?? controller.signal;
    let timeoutId: NodeJS.Timeout | undefined;
    if (opts.timeout ?? this.timeout) {
      const t = opts.timeout ?? this.timeout!;
      timeoutId = setTimeout(() => controller.abort(), t);
    }

    const init: RequestInit & { url: string } = {
      url,
      method,
      headers,
      body: bodyInit,
      signal,
    } as any;

    // middleware before
    const applied = await this.middleware.runBefore(init);

    let res: Response;
    try {
      // use global fetch
      res = await fetch(applied.url, applied);
    } catch (err: unknown) {
      if (timeoutId) clearTimeout(timeoutId);
      if ((err as Error)?.name === "AbortError") throw new TimeoutError();
      throw new NetworkError((err as Error)?.message ?? String(err));
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }

    // middleware after
    res = await this.middleware.runAfter(res);

    if (!res.ok) {
      let parsed: unknown = null;
      try {
        parsed = await res.json().catch(() => null);
      } catch {
        parsed = null;
      }
      throw new HttpError(res.status, parsed);
    }

    try {
      const type = opts.responseType ?? "json";
      let parsed: unknown;
      if (type === "json") parsed = await res.json();
      else if (type === "text") parsed = await res.text();
      else if (type === "blob") parsed = await res.blob();
      else parsed = await res.arrayBuffer();

      if ((opts.cache ?? this.cacheEnabled) && isSafeMethod(method)) {
        this.cache.set(keyForCache, parsed, opts.cacheTTL ?? this.cacheTTL);
      }

      return parsed as T;
    } catch (err) {
      throw new ParseError(err);
    }
  }
}

export function createClient(opts: CreateClientOptions = {}) {
  return new HttpClient(opts);
}

