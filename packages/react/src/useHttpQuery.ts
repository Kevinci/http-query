import { useCallback, useEffect, useSyncExternalStore } from "react";
import type { QueryOptions, QueryParams } from "@kevincii/http-query-core";
import { useHttpQueryContext } from "./context";
import { queryKey } from "./keys";

export interface UseHttpQueryOptions<T> {
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

export interface UseHttpQueryResult<T> {
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
export function useHttpQuery<T = unknown, P extends QueryParams = QueryParams>(
  path: string,
  params?: P,
  options: UseHttpQueryOptions<T> = {},
): UseHttpQueryResult<T> {
  const { client, cache } = useHttpQueryContext();
  const { enabled = true, staleTime = 0, request, onSuccess, onError } = options;
  const key = options.key ?? queryKey(path, params);

  const snapshot = useSyncExternalStore(
    (cb) => cache.subscribe(key, cb),
    () => cache.getSnapshot<T>(key),
    () => cache.getSnapshot<T>(key),
  );

  const run = useCallback(
    (force: boolean) =>
      cache.fetch<T>(key, () => client.query<T>(path, params, request), { staleTime, force }).then(
        (data) => {
          onSuccess?.(data);
          return data;
        },
        (err) => {
          onError?.(err);
          throw err;
        },
      ),
    // params/request are captured via the key; changing them changes `key`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cache, client, key, path, staleTime],
  );

  useEffect(() => {
    if (enabled) run(false).catch(() => {});
  }, [enabled, run]);

  return {
    data: snapshot.data,
    error: snapshot.error,
    isLoading: snapshot.fetching && snapshot.data === undefined,
    isFetching: snapshot.fetching,
    isSuccess: snapshot.updatedAt !== undefined && snapshot.error === undefined,
    isError: snapshot.error !== undefined && snapshot.error !== null,
    refetch: () => run(true),
  };
}
