/** Public types for @http-query/client */

export type HTTPMethod = "QUERY" | "POST" | "GET" | "HEAD" | "PUT" | "DELETE";

export type BodyLike = Record<string, unknown> | null | undefined;

export interface QueryOptions<TBody = unknown, TRes = unknown> {
  method?: HTTPMethod;
  body?: TBody;
  headers?: Record<string, string>;
  signal?: AbortSignal | null;
  timeout?: number; // ms
  retries?: number;
  fallback?: HTTPMethod | null;
  responseType?: "json" | "text" | "blob" | "arrayBuffer";
  cache?: boolean;
  cacheTTL?: number; // ms
}

export interface CreateClientOptions {
  baseUrl?: string;
  headers?: Record<string, string>;
  fallback?: HTTPMethod | null;
  timeout?: number;
  retries?: number;
  cache?: boolean;
  cacheTTL?: number;
}

export type BeforeRequestHook = (init: RequestInit & { url: string }) => Promise<RequestInit & { url: string }> | (RequestInit & { url: string });

export type AfterResponseHook = (res: Response) => Promise<Response> | Response;

export type OnErrorHook = (err: unknown) => Promise<void> | void;

export interface Hooks {
  beforeRequest?: BeforeRequestHook[];
  afterResponse?: AfterResponseHook[];
  onError?: OnErrorHook[];
}

