/** Public types for @kevincii/http-query-core */
/**
 * HTTP methods understood by the engine. `QUERY` is the safe, body-bearing read
 * method this ecosystem is built around.
 */
type HTTPMethod = "QUERY" | "POST" | "GET" | "HEAD" | "PUT" | "PATCH" | "DELETE";
/** Primitive leaf values that can be serialized into a query string. */
type Primitive = string | number | boolean | bigint | Date | null | undefined;
/** A recursively-serializable value (primitive, array, or nested object). */
type QueryValue = Primitive | QueryValue[] | {
    [key: string]: QueryValue;
};
/** A bag of query parameters — the input to `client.query()`. */
type QueryParams = Record<string, QueryValue>;
/** How arrays are rendered into a query string when falling back to GET. */
type ArrayFormat = "repeat" | "bracket" | "comma" | "index";
/**
 * Controls how `client.query()` puts params on the wire.
 * - `auto`   — send a QUERY request with a JSON body; fall back automatically.
 * - `query`  — always attempt the QUERY method first (same as auto today).
 * - `params` — always send a plain GET with a serialized query string.
 */
type QueryMode = "auto" | "query" | "params";
/** How the response body should be parsed. */
type ResponseType = "json" | "text" | "blob" | "arrayBuffer";
/** Options for turning a params object into a query string. */
interface SerializeOptions {
    /** How arrays are encoded. Default `"repeat"` (`tag=a&tag=b`). */
    arrayFormat?: ArrayFormat;
    /** Whether to `encodeURIComponent` keys and values. Default `true`. */
    encodeValues?: boolean;
    /** Skip `null` and `undefined` values entirely. Default `true`. */
    skipNulls?: boolean;
}
/** Per-request options. */
interface QueryOptions<TBody = unknown, _TRes = unknown> {
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
interface CreateClientOptions {
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
interface QueryCapableClient {
    query<T = unknown, P extends QueryParams = QueryParams>(path: string, params?: P, opts?: QueryOptions): Promise<T>;
}
type BeforeRequestHook = (init: RequestInit & {
    url: string;
}) => Promise<RequestInit & {
    url: string;
}> | (RequestInit & {
    url: string;
});
type AfterResponseHook = (res: Response) => Promise<Response> | Response;
type OnErrorHook = (err: unknown) => Promise<void> | void;
interface Hooks {
    beforeRequest?: BeforeRequestHook[];
    afterResponse?: AfterResponseHook[];
    onError?: OnErrorHook[];
}

/** Thrown for non-2xx HTTP responses. Carries the status and parsed body. */
declare class HttpError extends Error {
    readonly status: number;
    readonly body: unknown;
    constructor(status: number, body: unknown, message?: string);
}
/** Thrown when a request exceeds its timeout and is aborted. */
declare class TimeoutError extends Error {
    constructor(message?: string);
}
/** Thrown for transport-level failures (DNS, connection reset, offline). */
declare class NetworkError extends Error {
    constructor(message?: string);
}
/** Thrown when the response body cannot be parsed as the requested type. */
declare class ParseError extends Error {
    readonly original: unknown;
    constructor(original: unknown, message?: string);
}

/**
 * Typed filter operators. These are plain, serializable objects — dropping one
 * under a `filter` key produces bracket-notation query params
 * (`filter[age][gte]=18`) or a nested JSON body for a QUERY request, with no
 * manual string building.
 *
 * @example
 * const params = {
 *   filter: {
 *     age: { gte: 18, lt: 65 },
 *     country: { in: ["DE", "AT"] },
 *     name: { contains: "an" },
 *   },
 * } satisfies { filter: Filter };
 */
interface FilterOperators<T = unknown> {
    /** Equal to. */
    eq?: T;
    /** Not equal to. */
    ne?: T;
    /** Greater than. */
    gt?: T;
    /** Greater than or equal. */
    gte?: T;
    /** Less than. */
    lt?: T;
    /** Less than or equal. */
    lte?: T;
    /** Value is one of. */
    in?: T[];
    /** Value is none of. */
    nin?: T[];
    /** Substring match. */
    contains?: string;
    /** Prefix match. */
    startsWith?: string;
    /** Suffix match. */
    endsWith?: string;
    /** SQL-style LIKE pattern. */
    like?: string;
    /** Inclusive range `[min, max]`. */
    between?: [T, T];
}
/** A field filter is either a bare value (shorthand for `eq`) or an operator map. */
type FilterValue<T = unknown> = T | FilterOperators<T>;
/**
 * A filter object keyed by the fields of `TShape`. Every field is optional and
 * accepts either a value or a {@link FilterOperators} map.
 */
type Filter<TShape extends Record<string, unknown> = Record<string, unknown>> = {
    [K in keyof TShape]?: FilterValue<TShape[K]>;
};

/**
 * Serialize a (possibly deeply nested) params object into a query string.
 *
 * Nested objects use bracket notation (`filter[age][gte]=18`), so complex
 * filters map straight to the wire without any hand-built strings. Arrays are
 * rendered according to {@link SerializeOptions.arrayFormat}.
 *
 * @example
 * serializeParams({ page: 1, filter: { age: { gte: 18 }, country: "DE" } })
 * // => "page=1&filter[age][gte]=18&filter[country]=DE"
 */
declare function serializeParams(params: QueryParams | null | undefined, options?: SerializeOptions): string;
/** Append a query string to a URL, choosing `?` or `&` correctly. */
declare function appendQueryString(url: string, qs: string): string;

/** Standard offset-based page inputs. */
interface PageParams {
    page?: number;
    pageSize?: number;
    cursor?: string;
}
/** A single normalized page of results. */
interface PaginatedResult<T> {
    items: T[];
    page: number;
    pageSize: number;
    total?: number;
    hasNext: boolean;
    /** Params to pass to fetch the next page, or `undefined` if there is none. */
    nextParams?: QueryParams;
}
/** Options controlling how pages are requested and interpreted. */
interface PaginateOptions<TRaw = unknown, TItem = unknown> {
    /** Items per page. Default `20`. */
    pageSize?: number;
    /** Param name for the page number. Default `"page"`. */
    pageParam?: string;
    /** Param name for the page size. Default `"pageSize"`. */
    pageSizeParam?: string;
    /** First page number. Default `1`. */
    startPage?: number;
    /** Extract the item array from a raw response. Default: array or `items`/`data`/`results`/`records`. */
    select?: (raw: TRaw) => TItem[];
    /** Extract the total item count from a raw response, if the API provides one. */
    getTotal?: (raw: TRaw) => number | undefined;
    /** Extra request options forwarded to `client.query()`. */
    requestOptions?: QueryOptions;
}
/** Best-effort extraction of an item array from a variety of response shapes. */
declare function defaultSelect<TItem = unknown>(raw: unknown): TItem[];
/**
 * Fetch a single normalized page. Combines the base params with page controls,
 * calls `client.query`, and reports whether a further page exists.
 */
declare function queryPage<TItem = unknown, TRaw = unknown>(client: QueryCapableClient, path: string, baseParams?: QueryParams, page?: number, options?: PaginateOptions<TRaw, TItem>): Promise<PaginatedResult<TItem>>;
/**
 * Lazily iterate every page. Yields one item array per page and stops when the
 * API reports no further pages.
 *
 * @example
 * for await (const batch of paginate(client, "/users", { active: true })) {
 *   render(batch);
 * }
 */
declare function paginate<TItem = unknown, TRaw = unknown>(client: QueryCapableClient, path: string, baseParams?: QueryParams, options?: PaginateOptions<TRaw, TItem>): AsyncGenerator<TItem[], void, unknown>;
/** Eagerly collect every page into a single flat array. */
declare function collectPages<TItem = unknown, TRaw = unknown>(client: QueryCapableClient, path: string, baseParams?: QueryParams, options?: PaginateOptions<TRaw, TItem>): Promise<TItem[]>;

/** A tiny TTL-based in-memory cache used for safe (idempotent) requests. */
declare class SimpleMemoryCache {
    private defaultTTL;
    private map;
    constructor(defaultTTL?: number);
    get<T>(key: string): T | undefined;
    set(key: string, value: unknown, ttl?: number): void;
    delete(key: string): void;
    clear(): void;
}

/** Ordered pipeline of request/response/error hooks. */
declare class MiddlewareStack {
    private before;
    private after;
    private onError;
    useBefore(fn: BeforeRequestHook): void;
    useAfter(fn: AfterResponseHook): void;
    useOnError(fn: OnErrorHook): void;
    runBefore(init: RequestInit & {
        url: string;
    }): Promise<RequestInit & {
        url: string;
    }>;
    runAfter(res: Response): Promise<Response>;
    runOnError(err: unknown): Promise<void>;
}

/**
 * The framework-agnostic HTTP QUERY engine. Works in browsers and Node (>=20)
 * using the global `fetch`, or any injected `fetch` implementation.
 */
declare class HttpQueryClient implements QueryCapableClient {
    readonly baseUrl?: string;
    readonly headers: Record<string, string>;
    readonly fallback: HTTPMethod | null;
    readonly timeout?: number;
    readonly retries: number;
    readonly cacheEnabled: boolean;
    readonly cacheTTL: number;
    readonly mode: QueryMode;
    readonly serializeOptions: SerializeOptions;
    readonly cache: SimpleMemoryCache;
    readonly middleware: MiddlewareStack;
    private readonly fetchImpl?;
    constructor(opts?: CreateClientOptions);
    /** Register a plugin that mutates the client (e.g. adds middleware). */
    use(fn: (client: HttpQueryClient) => void): this;
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
    query<T = unknown, P extends QueryParams = QueryParams>(path: string, params?: P, opts?: QueryOptions): Promise<T>;
    /** Low-level request with the full QUERY → fallback → GET chain. */
    request<T = unknown, B = unknown>(path: string, opts?: QueryOptions<B, T>): Promise<T>;
    private performWithRetries;
    private perform;
}
/** Backwards-compatible alias for {@link HttpQueryClient}. */
declare const HttpClient: typeof HttpQueryClient;
/** Create a configured {@link HttpQueryClient}. */
declare function createClient(opts?: CreateClientOptions): HttpQueryClient;

/**
 * Build the ordered list of methods to try. QUERY is attempted first; on a
 * 405/501 the client walks to the configured fallback and finally to GET.
 */
declare function resolveFallback(primary: HTTPMethod, fallback?: HTTPMethod | null): HTTPMethod[];

/** Safe (idempotent, cacheable) methods that may be retried and cached. */
declare const isSafeMethod: (m: HTTPMethod) => boolean;
/** Promise-based delay used for retry backoff. */
declare function delay(ms: number): Promise<void>;

/**
 * Top-level shortcut backed by a shared default client.
 *
 * @example
 * const users = await query<User[]>("/users", { active: true, sort: "name" });
 */
declare function query<T = unknown, P extends QueryParams = QueryParams>(path: string, params?: P, opts?: QueryOptions): Promise<T>;

export { type AfterResponseHook, type ArrayFormat, type BeforeRequestHook, type CreateClientOptions, type Filter, type FilterOperators, type FilterValue, type HTTPMethod, type Hooks, HttpClient, HttpError, HttpQueryClient, MiddlewareStack, NetworkError, type OnErrorHook, type PageParams, type PaginateOptions, type PaginatedResult, ParseError, type Primitive, type QueryCapableClient, type QueryMode, type QueryOptions, type QueryParams, type QueryValue, type ResponseType, type SerializeOptions, SimpleMemoryCache, TimeoutError, appendQueryString, collectPages, createClient, defaultSelect, delay, isSafeMethod, paginate, query, queryPage, resolveFallback, serializeParams };
