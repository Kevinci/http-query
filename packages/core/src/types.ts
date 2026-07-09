/** Public types for @kevincii/http-query-core */

/**
 * HTTP methods understood by the engine. `QUERY` is the safe, body-bearing read
 * method this ecosystem is built around.
 */
export type HTTPMethod = "QUERY" | "POST" | "GET" | "HEAD" | "PUT" | "PATCH" | "DELETE";

/** Primitive leaf values that can be serialized into a query string. */
export type Primitive = string | number | boolean | bigint | Date | null | undefined;

/** A recursively-serializable value (primitive, array, or nested object). */
export type QueryValue = Primitive | QueryValue[] | { [key: string]: QueryValue };

/** A bag of query parameters — the input to `client.query()`. */
export type QueryParams = Record<string, QueryValue>;

/** How arrays are rendered into a query string when falling back to GET. */
export type ArrayFormat = "repeat" | "bracket" | "comma" | "index";

/**
 * Controls how `client.query()` puts params on the wire.
 * - `auto`   — send a QUERY request with a JSON body; fall back automatically.
 * - `query`  — always attempt the QUERY method first (same as auto today).
 * - `params` — always send a plain GET with a serialized query string.
 */
export type QueryMode = "auto" | "query" | "params";

/** How the response body should be parsed. */
export type ResponseType = "json" | "text" | "blob" | "arrayBuffer";

/** Options for turning a params object into a query string. */
export interface SerializeOptions {
  /** How arrays are encoded. Default `"repeat"` (`tag=a&tag=b`). */
  arrayFormat?: ArrayFormat;
  /** Whether to `encodeURIComponent` keys and values. Default `true`. */
  encodeValues?: boolean;
  /** Skip `null` and `undefined` values entirely. Default `true`. */
  skipNulls?: boolean;
}

/** Per-request options. */
export interface QueryOptions<TBody = unknown, _TRes = unknown> {
  /** HTTP method. Defaults to `"QUERY"`. */
  method?: HTTPMethod;
  /** Request body / params. Serialized to a query string for GET requests. */
  body?: TBody;
  /** Extra headers merged over the client defaults. */
  headers?: Record<string, string>;
  /** External abort signal. Composed with the timeout signal. */
  signal?: AbortSignal | null;
  /** Abort the request after this many milliseconds. */
  timeout?: number;
  /** Retry count for transient failures on safe methods. */
  retries?: number;
  /** Method to fall back to when the server rejects the primary method. */
  fallback?: HTTPMethod | null;
  /** Response parsing mode. Default `"json"`. */
  responseType?: ResponseType;
  /** Enable the in-memory response cache for this request (safe methods only). */
  cache?: boolean;
  /** Cache TTL in milliseconds. */
  cacheTTL?: number;
  /** Wire strategy for `client.query()`. */
  mode?: QueryMode;
  /** Serialization options for the query-string fallback. */
  serialize?: SerializeOptions;
}

/** Options for `createClient()`. */
export interface CreateClientOptions {
  /** Base URL prepended to every request path. */
  baseUrl?: string;
  /** Default headers applied to every request. */
  headers?: Record<string, string>;
  /** Default fallback method (default `"POST"`). Set `null` to disable. */
  fallback?: HTTPMethod | null;
  /** Default timeout in milliseconds. */
  timeout?: number;
  /** Default retry count. */
  retries?: number;
  /** Enable caching by default. */
  cache?: boolean;
  /** Default cache TTL in milliseconds. */
  cacheTTL?: number;
  /** Default wire strategy for `query()`. Default `"auto"`. */
  mode?: QueryMode;
  /** Default serialization options. */
  serialize?: SerializeOptions;
  /** Inject a custom `fetch` implementation (e.g. for Node polyfills or tests). */
  fetch?: typeof fetch;
}

/** Minimal shape needed by pagination and framework helpers. */
export interface QueryCapableClient {
  query<T = unknown, P extends QueryParams = QueryParams>(path: string, params?: P, opts?: QueryOptions): Promise<T>;
}

export type BeforeRequestHook = (
  init: RequestInit & { url: string },
) => Promise<RequestInit & { url: string }> | (RequestInit & { url: string });

export type AfterResponseHook = (res: Response) => Promise<Response> | Response;

export type OnErrorHook = (err: unknown) => Promise<void> | void;

export interface Hooks {
  beforeRequest?: BeforeRequestHook[];
  afterResponse?: AfterResponseHook[];
  onError?: OnErrorHook[];
}
