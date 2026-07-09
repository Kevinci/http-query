import { useCallback, useEffect, useRef, useState } from "react";
import type { QueryOptions, QueryParams } from "@kevincii/http-query-core";
import { useHttpQueryContext } from "./context";

export interface UseInfiniteHttpQueryOptions<TRaw, TItem> {
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

export interface UseInfiniteHttpQueryResult<TItem> {
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

function defaultSelect<TItem>(raw: unknown): TItem[] {
  if (Array.isArray(raw)) return raw as TItem[];
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    for (const k of ["items", "data", "results", "records"]) {
      if (Array.isArray(obj[k])) return obj[k] as TItem[];
    }
  }
  return [];
}

/**
 * Offset-based infinite pagination. Each `fetchNextPage()` requests the next
 * page and appends its items; `hasNextPage` is inferred from a full page.
 */
export function useInfiniteHttpQuery<TItem = unknown, TRaw = unknown, P extends QueryParams = QueryParams>(
  path: string,
  params?: P,
  options: UseInfiniteHttpQueryOptions<TRaw, TItem> = {},
): UseInfiniteHttpQueryResult<TItem> {
  const { client } = useHttpQueryContext();
  const {
    enabled = true,
    pageSize = 20,
    pageParam = "page",
    pageSizeParam = "pageSize",
    startPage = 1,
    select = defaultSelect as (raw: TRaw) => TItem[],
    request,
  } = options;

  const [pages, setPages] = useState<TItem[][]>([]);
  const [error, setError] = useState<unknown>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const nextPageRef = useRef(startPage);

  // A monotonically-increasing token guards against races when reset() runs.
  const runToken = useRef(0);

  const fetchPage = useCallback(
    async (page: number, isFirst: boolean) => {
      const token = runToken.current;
      if (isFirst) setIsLoading(true);
      else setIsFetchingNextPage(true);
      try {
        const raw = await client.query<TRaw>(
          path,
          { ...(params as QueryParams), [pageParam]: page, [pageSizeParam]: pageSize },
          request,
        );
        if (token !== runToken.current) return;
        const items = select(raw);
        setPages((prev) => (isFirst ? [items] : [...prev, items]));
        setHasNextPage(items.length === pageSize);
        setError(undefined);
        nextPageRef.current = page + 1;
      } catch (err) {
        if (token !== runToken.current) return;
        setError(err);
      } finally {
        if (token === runToken.current) {
          setIsLoading(false);
          setIsFetchingNextPage(false);
        }
      }
    },
    // params captured through key-relevant values below
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [client, path, pageParam, pageSizeParam, pageSize],
  );

  const paramsKey = JSON.stringify(params ?? {});

  const reset = useCallback(() => {
    runToken.current += 1;
    nextPageRef.current = startPage;
    setPages([]);
    setHasNextPage(true);
    setError(undefined);
    if (enabled) void fetchPage(startPage, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, startPage, fetchPage, paramsKey]);

  useEffect(() => {
    reset();
  }, [reset]);

  const fetchNextPage = useCallback(async () => {
    if (!hasNextPage || isFetchingNextPage || isLoading) return;
    await fetchPage(nextPageRef.current, false);
  }, [hasNextPage, isFetchingNextPage, isLoading, fetchPage]);

  return {
    items: pages.flat(),
    pages,
    error,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    reset,
  };
}
