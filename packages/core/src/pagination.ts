import type { QueryCapableClient, QueryOptions, QueryParams } from "./types";

/** Standard offset-based page inputs. */
export interface PageParams {
  page?: number;
  pageSize?: number;
  cursor?: string;
}

/** A single normalized page of results. */
export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total?: number;
  hasNext: boolean;
  /** Params to pass to fetch the next page, or `undefined` if there is none. */
  nextParams?: QueryParams;
}

/** Options controlling how pages are requested and interpreted. */
export interface PaginateOptions<TRaw = unknown, TItem = unknown> {
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

const TOTAL_KEYS = ["total", "totalCount", "count"] as const;
const ITEM_KEYS = ["items", "data", "results", "records"] as const;

/** Best-effort extraction of an item array from a variety of response shapes. */
export function defaultSelect<TItem = unknown>(raw: unknown): TItem[] {
  if (Array.isArray(raw)) return raw as TItem[];
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    for (const k of ITEM_KEYS) {
      if (Array.isArray(obj[k])) return obj[k] as TItem[];
    }
  }
  return [];
}

function defaultTotal(raw: unknown): number | undefined {
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    for (const k of TOTAL_KEYS) {
      if (typeof obj[k] === "number") return obj[k] as number;
    }
  }
  return undefined;
}

/**
 * Fetch a single normalized page. Combines the base params with page controls,
 * calls `client.query`, and reports whether a further page exists.
 */
export async function queryPage<TItem = unknown, TRaw = unknown>(
  client: QueryCapableClient,
  path: string,
  baseParams: QueryParams = {},
  page = 1,
  options: PaginateOptions<TRaw, TItem> = {},
): Promise<PaginatedResult<TItem>> {
  const {
    pageSize = 20,
    pageParam = "page",
    pageSizeParam = "pageSize",
    select = defaultSelect as (raw: TRaw) => TItem[],
    getTotal = defaultTotal,
    requestOptions,
  } = options;

  const params: QueryParams = { ...baseParams, [pageParam]: page, [pageSizeParam]: pageSize };
  const raw = await client.query<TRaw>(path, params, requestOptions);
  const items = select(raw);
  const total = getTotal(raw);
  const seen = (page - 1) * pageSize + items.length;
  const hasNext = total !== undefined ? seen < total : items.length === pageSize;

  return {
    items,
    page,
    pageSize,
    total,
    hasNext,
    nextParams: hasNext ? { ...baseParams, [pageParam]: page + 1, [pageSizeParam]: pageSize } : undefined,
  };
}

/**
 * Lazily iterate every page. Yields one item array per page and stops when the
 * API reports no further pages.
 *
 * @example
 * for await (const batch of paginate(client, "/users", { active: true })) {
 *   render(batch);
 * }
 */
export async function* paginate<TItem = unknown, TRaw = unknown>(
  client: QueryCapableClient,
  path: string,
  baseParams: QueryParams = {},
  options: PaginateOptions<TRaw, TItem> = {},
): AsyncGenerator<TItem[], void, unknown> {
  const startPage = options.startPage ?? 1;
  let page = startPage;
  for (;;) {
    const result = await queryPage<TItem, TRaw>(client, path, baseParams, page, options);
    yield result.items;
    if (!result.hasNext || result.items.length === 0) return;
    page += 1;
  }
}

/** Eagerly collect every page into a single flat array. */
export async function collectPages<TItem = unknown, TRaw = unknown>(
  client: QueryCapableClient,
  path: string,
  baseParams: QueryParams = {},
  options: PaginateOptions<TRaw, TItem> = {},
): Promise<TItem[]> {
  const all: TItem[] = [];
  for await (const batch of paginate<TItem, TRaw>(client, path, baseParams, options)) {
    all.push(...batch);
  }
  return all;
}
