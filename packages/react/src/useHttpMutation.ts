import { useCallback, useState } from "react";
import type { HttpQueryClient } from "@kevincii/http-query-core";
import { useHttpQueryContext } from "./context";

export interface UseHttpMutationOptions<TData, TVars> {
  onSuccess?: (data: TData, vars: TVars) => void;
  onError?: (error: unknown, vars: TVars) => void;
  onSettled?: (data: TData | undefined, error: unknown, vars: TVars) => void;
}

export interface UseHttpMutationResult<TData, TVars> {
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
export function useHttpMutation<TData = unknown, TVars = void>(
  fn: (client: HttpQueryClient, vars: TVars) => Promise<TData>,
  options: UseHttpMutationOptions<TData, TVars> = {},
): UseHttpMutationResult<TData, TVars> {
  const { client } = useHttpQueryContext();
  const [data, setData] = useState<TData | undefined>(undefined);
  const [error, setError] = useState<unknown>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  const mutateAsync = useCallback(
    async (vars: TVars): Promise<TData> => {
      setIsLoading(true);
      setError(undefined);
      try {
        const result = await fn(client, vars);
        setData(result);
        options.onSuccess?.(result, vars);
        options.onSettled?.(result, undefined, vars);
        return result;
      } catch (err) {
        setError(err);
        options.onError?.(err, vars);
        options.onSettled?.(undefined, err, vars);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [client, fn],
  );

  const mutate = useCallback(
    (vars: TVars) => {
      void mutateAsync(vars).catch(() => {});
    },
    [mutateAsync],
  );

  const reset = useCallback(() => {
    setData(undefined);
    setError(undefined);
    setIsLoading(false);
  }, []);

  return {
    mutate,
    mutateAsync,
    data,
    error,
    isLoading,
    isSuccess: data !== undefined && error === undefined,
    isError: error !== undefined && error !== null,
    reset,
  };
}
