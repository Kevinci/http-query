import { HttpError, NetworkError, ParseError, TimeoutError } from "./errors";
import { SimpleMemoryCache } from "./cache";
import { isSafeMethod, delay } from "./utils";
import { serializeParams, appendQueryString } from "./serialize";
import { resolveFallback } from "./fallback";
import { MiddlewareStack } from "./middleware";
import type {
  CreateClientOptions,
  QueryOptions,
  QueryParams,
  HTTPMethod,
  QueryMode,
  SerializeOptions,
  QueryCapableClient,
} from "./types";

const DEFAULT_HEADERS: Record<string, string> = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

function buildUrl(base: string | undefined, path: string): string {
  if (!path) return base ?? "";
  if (!base) return path;
  if (/^https?:\/\//i.test(path)) return path;
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

/**
 * The framework-agnostic HTTP QUERY engine. Works in browsers and Node (>=20)
 * using the global `fetch`, or any injected `fetch` implementation.
 */
export class HttpQueryClient implements QueryCapableClient {
  public readonly baseUrl?: string;
  public readonly headers: Record<string, string>;
  public readonly fallback: HTTPMethod | null;
  public readonly timeout?: number;
  public readonly retries: number;
  public readonly cacheEnabled: boolean;
  public readonly cacheTTL: number;
  public readonly mode: QueryMode;
  public readonly serializeOptions: SerializeOptions;
  public readonly cache = new SimpleMemoryCache(5_000);
  public readonly middleware = new MiddlewareStack();
  private readonly fetchImpl?: typeof fetch;

  constructor(opts: CreateClientOptions = {}) {
    this.baseUrl = opts.baseUrl;
    this.headers = { ...(opts.headers ?? {}), ...DEFAULT_HEADERS };
    this.fallback = opts.fallback === undefined ? "POST" : opts.fallback;
    this.timeout = opts.timeout;
    this.retries = opts.retries ?? 0;
    this.cacheEnabled = opts.cache ?? false;
    this.cacheTTL = opts.cacheTTL ?? 5_000;
    this.mode = opts.mode ?? "auto";
    this.serializeOptions = opts.serialize ?? {};
    this.fetchImpl = opts.fetch;
  }

  /** Register a plugin that mutates the client (e.g. adds middleware). */
  use(fn: (client: HttpQueryClient) => void): this {
    fn(this);
    return this;
  }

  /**
   * Ergonomic, type-safe entry point for complex reads.
   *
   * @example
   * const users = await client.query<User[]>("/users", {
   *   page: 1,
   *   sort: "name",
   *   filter: { age: { gte: 18 }, country: "DE" },
   * });
   */
  async query<T = unknown, P extends QueryParams = QueryParams>(
    path: string,
    params?: P,
    opts: QueryOptions = {},
  ): Promise<T> {
    const mode = opts.mode ?? this.mode;
    if (mode === "params") {
      // Force a plain GET with a serialized query string.
      return this.request<T, P>(path, { ...opts, method: "GET", body: params });
    }
    // auto / query: attempt QUERY first, let the fallback chain serialize for GET.
    return this.request<T, P>(path, { ...opts, method: opts.method ?? "QUERY", body: params });
  }

  /** Low-level request with the full QUERY → fallback → GET chain. */
  async request<T = unknown, B = unknown>(path: string, opts: QueryOptions<B, T> = {}): Promise<T> {
    const method = (opts.method ?? "QUERY") as HTTPMethod;
    const fallbackOrder = resolveFallback(method, opts.fallback === undefined ? this.fallback : opts.fallback);

    let lastErr: unknown;
    for (const m of fallbackOrder) {
      try {
        return await this.performWithRetries<T, B>(path, { ...opts, method: m });
      } catch (err) {
        lastErr = err;
        // Method not supported by the server → walk to the next fallback.
        if (err instanceof HttpError && (err.status === 405 || err.status === 501)) {
          continue;
        }
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
        // Only retry safe methods on transient failures.
        if (!transient || !isSafeMethod(opts.method ?? "QUERY")) throw err;
        if (i < attempts - 1) {
          await delay(2 ** i * 100);
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
    const headers = { ...this.headers, ...(opts.headers ?? {}) };

    let bodyInit: BodyInit | undefined;
    if ((method === "GET" || method === "HEAD") && opts.body !== undefined && opts.body !== null) {
      const qs = serializeParams(opts.body as unknown as QueryParams, { ...this.serializeOptions, ...opts.serialize });
      url = appendQueryString(url, qs);
      // A GET body carries no payload; drop the JSON content-type.
      delete headers["Content-Type"];
    } else if (opts.body !== undefined) {
      bodyInit = JSON.stringify(opts.body);
    }

    const keyForCache = `${method}:${url}:${bodyInit ?? ""}`;
    const cacheOn = (opts.cache ?? this.cacheEnabled) && isSafeMethod(method);
    if (cacheOn) {
      const cached = this.cache.get<T>(keyForCache);
      if (cached !== undefined) return cached;
    }

    const controller = new AbortController();
    const external = opts.signal;
    if (external) {
      if (external.aborted) controller.abort();
      else external.addEventListener("abort", () => controller.abort(), { once: true });
    }
    const timeoutMs = opts.timeout ?? this.timeout;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let timedOut = false;
    if (timeoutMs) {
      timeoutId = setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, timeoutMs);
    }

    const init: RequestInit & { url: string } = {
      url,
      method,
      headers,
      body: bodyInit,
      signal: controller.signal,
    };

    const applied = await this.middleware.runBefore(init);
    const doFetch = this.fetchImpl ?? globalThis.fetch;

    let res: Response;
    try {
      const { url: finalUrl, ...requestInit } = applied;
      res = await doFetch(finalUrl, requestInit);
    } catch (err: unknown) {
      if ((err as Error)?.name === "AbortError") {
        throw timedOut ? new TimeoutError() : (err as Error);
      }
      const netErr = new NetworkError((err as Error)?.message ?? String(err));
      await this.middleware.runOnError(netErr);
      throw netErr;
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }

    res = await this.middleware.runAfter(res);

    if (!res.ok) {
      const parsed = await res.json().catch(() => null);
      const httpErr = new HttpError(res.status, parsed);
      await this.middleware.runOnError(httpErr);
      throw httpErr;
    }

    try {
      const type = opts.responseType ?? "json";
      let parsed: unknown;
      if (type === "json") parsed = res.status === 204 ? null : await res.json();
      else if (type === "text") parsed = await res.text();
      else if (type === "blob") parsed = await res.blob();
      else parsed = await res.arrayBuffer();

      if (cacheOn) {
        this.cache.set(keyForCache, parsed, opts.cacheTTL ?? this.cacheTTL);
      }
      return parsed as T;
    } catch (err) {
      throw new ParseError(err);
    }
  }
}

/** Backwards-compatible alias for {@link HttpQueryClient}. */
export const HttpClient = HttpQueryClient;

/** Create a configured {@link HttpQueryClient}. */
export function createClient(opts: CreateClientOptions = {}): HttpQueryClient {
  return new HttpQueryClient(opts);
}
