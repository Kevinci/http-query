import { QueryParams, HttpQueryClient, CreateClientOptions, QueryOptions } from '@kevincii/http-query-core';
import * as react from 'react';
import { ReactNode } from 'react';

/** Snapshot of a cached query, exposed to hooks via `useSyncExternalStore`. */
interface QuerySnapshot<T = unknown> {
    data: T | undefined;
    error: unknown;
    updatedAt: number | undefined;
    fetching: boolean;
}
/**
 * A tiny observable query cache: dedupes in-flight requests by key, stores the
 * last result with a timestamp for staleness checks, and notifies subscribers
 * on every change. Shared across all hooks under one provider.
 */
declare class QueryCache {
    private entries;
    private ensure;
    private update;
    getSnapshot<T = unknown>(key: string): QuerySnapshot<T>;
    subscribe(key: string, cb: () => void): () => void;
    /** Manually seed data (e.g. from SSR hydration). */
    setData<T>(key: string, data: T): void;
    /**
     * Fetch through the cache. Returns the in-flight promise if one exists;
     * returns cached data immediately when still fresh (within `staleTime`).
     */
    fetch<T>(key: string, fn: () => Promise<T>, opts?: {
        staleTime?: number;
        force?: boolean;
    }): Promise<T>;
    /** Mark matching entries stale (forces the next fetch to hit the network). */
    invalidate(predicate?: (key: string) => boolean): void;
    clear(): void;
}

/** Deterministic JSON stringify (sorted keys) so equal params produce equal keys. */
declare function stableStringify(value: unknown): string;
/** Build a stable cache key from a path and its params. */
declare function queryKey(path: string, params?: QueryParams): string;

interface HttpQueryContextValue {
    client: HttpQueryClient;
    cache: QueryCache;
}
interface HttpQueryProviderProps {
    /** An existing client. If omitted, one is created from `clientOptions`. */
    client?: HttpQueryClient;
    /** Options used to create a client when `client` is not provided. */
    clientOptions?: CreateClientOptions;
    /** A shared cache. If omitted, one is created for this provider. */
    cache?: QueryCache;
    children: ReactNode;
}
/**
 * Provides the client and shared query cache to all `useHttpQuery*` hooks.
 *
 * @example
 * <HttpQueryProvider clientOptions={{ baseUrl: "/api" }}>
 *   <App />
 * </HttpQueryProvider>
 */
declare function HttpQueryProvider(props: HttpQueryProviderProps): react.FunctionComponentElement<react.ProviderProps<HttpQueryContextValue | null>>;
/** Access the full context (client + cache). Throws outside a provider. */
declare function useHttpQueryContext(): HttpQueryContextValue;
/** Access the underlying client. */
declare function useHttpQueryClient(): HttpQueryClient;
/** Access the shared query cache (for manual invalidation / seeding). */
declare function useQueryCache(): QueryCache;

interface UseHttpQueryOptions<T> {
    /** Override the auto-generated cache key. */
    key?: string;
    /** Skip fetching until `true`. Default `true`. */
    enabled?: boolean;
    /** Serve cached data without refetching for this many ms. Default `0`. */
    staleTime?: number;
    /** Options forwarded to `client.query()`. */
    request?: QueryOptions;
    /** Called after a successful fetch. */
    onSuccess?: (data: T) => void;
    /** Called after a failed fetch. */
    onError?: (error: unknown) => void;
}
interface UseHttpQueryResult<T> {
    data: T | undefined;
    error: unknown;
    /** No data yet and a request is in flight. */
    isLoading: boolean;
    /** A request is in flight (initial or background). */
    isFetching: boolean;
    isSuccess: boolean;
    isError: boolean;
    /** Force a refetch, bypassing `staleTime`. */
    refetch: () => Promise<T>;
}
/**
 * Fetch data with the QUERY method, cached and deduped across components.
 *
 * @example
 * const { data, isLoading, refetch } = useHttpQuery<User[]>("/users", {
 *   filter: { active: true },
 * });
 */
declare function useHttpQuery<T = unknown, P extends QueryParams = QueryParams>(path: string, params?: P, options?: UseHttpQueryOptions<T>): UseHttpQueryResult<T>;

interface UseInfiniteHttpQueryOptions<TRaw, TItem> {
    enabled?: boolean;
    /** Items per page. Default `20`. */
    pageSize?: number;
    /** Param name for the page number. Default `"page"`. */
    pageParam?: string;
    /** Param name for the page size. Default `"pageSize"`. */
    pageSizeParam?: string;
    /** First page number. Default `1`. */
    startPage?: number;
    /** Extract items from a raw page response. Default: array or `items`/`data`/`results`. */
    select?: (raw: TRaw) => TItem[];
    /** Options forwarded to `client.query()`. */
    request?: QueryOptions;
}
interface UseInfiniteHttpQueryResult<TItem> {
    /** Every item across all fetched pages, flattened. */
    items: TItem[];
    /** One array per fetched page. */
    pages: TItem[][];
    error: unknown;
    isLoading: boolean;
    isFetchingNextPage: boolean;
    hasNextPage: boolean;
    fetchNextPage: () => Promise<void>;
    /** Reset to the first page and refetch. */
    reset: () => void;
}
/**
 * Offset-based infinite pagination. Each `fetchNextPage()` requests the next
 * page and appends its items; `hasNextPage` is inferred from a full page.
 */
declare function useInfiniteHttpQuery<TItem = unknown, TRaw = unknown, P extends QueryParams = QueryParams>(path: string, params?: P, options?: UseInfiniteHttpQueryOptions<TRaw, TItem>): UseInfiniteHttpQueryResult<TItem>;

interface UseHttpMutationOptions<TData, TVars> {
    onSuccess?: (data: TData, vars: TVars) => void;
    onError?: (error: unknown, vars: TVars) => void;
    onSettled?: (data: TData | undefined, error: unknown, vars: TVars) => void;
}
interface UseHttpMutationResult<TData, TVars> {
    mutate: (vars: TVars) => void;
    mutateAsync: (vars: TVars) => Promise<TData>;
    data: TData | undefined;
    error: unknown;
    isLoading: boolean;
    isSuccess: boolean;
    isError: boolean;
    reset: () => void;
}
/**
 * Run a write (or any imperative request) and track its lifecycle. The mutation
 * function receives the client so it can call `client.request(...)` with any
 * method (POST/PUT/PATCH/DELETE).
 *
 * @example
 * const createUser = useHttpMutation((client, vars: NewUser) =>
 *   client.request("/users", { method: "POST", body: vars }),
 * { onSuccess: () => cache.invalidate(k => k.startsWith("/users")) });
 */
declare function useHttpMutation<TData = unknown, TVars = void>(fn: (client: HttpQueryClient, vars: TVars) => Promise<TData>, options?: UseHttpMutationOptions<TData, TVars>): UseHttpMutationResult<TData, TVars>;

export { type HttpQueryContextValue, HttpQueryProvider, type HttpQueryProviderProps, QueryCache, type QuerySnapshot, type UseHttpMutationOptions, type UseHttpMutationResult, type UseHttpQueryOptions, type UseHttpQueryResult, type UseInfiniteHttpQueryOptions, type UseInfiniteHttpQueryResult, queryKey, stableStringify, useHttpMutation, useHttpQuery, useHttpQueryClient, useHttpQueryContext, useInfiniteHttpQuery, useQueryCache };
