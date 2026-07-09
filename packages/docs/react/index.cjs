"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  HttpQueryProvider: () => HttpQueryProvider,
  QueryCache: () => QueryCache,
  queryKey: () => queryKey,
  stableStringify: () => stableStringify,
  useHttpMutation: () => useHttpMutation,
  useHttpQuery: () => useHttpQuery,
  useHttpQueryClient: () => useHttpQueryClient,
  useHttpQueryContext: () => useHttpQueryContext,
  useInfiniteHttpQuery: () => useInfiniteHttpQuery,
  useQueryCache: () => useQueryCache
});
module.exports = __toCommonJS(index_exports);

// src/cache.ts
var IDLE = { data: void 0, error: void 0, updatedAt: void 0, fetching: false };
var QueryCache = class {
  entries = /* @__PURE__ */ new Map();
  ensure(key) {
    let e = this.entries.get(key);
    if (!e) {
      e = { snapshot: IDLE, listeners: /* @__PURE__ */ new Set() };
      this.entries.set(key, e);
    }
    return e;
  }
  update(key, patch) {
    const e = this.ensure(key);
    e.snapshot = { ...e.snapshot, ...patch };
    e.listeners.forEach((l) => l());
  }
  getSnapshot(key) {
    return this.ensure(key).snapshot;
  }
  subscribe(key, cb) {
    const e = this.ensure(key);
    e.listeners.add(cb);
    return () => {
      e.listeners.delete(cb);
    };
  }
  /** Manually seed data (e.g. from SSR hydration). */
  setData(key, data) {
    this.update(key, { data, error: void 0, updatedAt: Date.now(), fetching: false });
    this.ensure(key).promise = void 0;
  }
  /**
   * Fetch through the cache. Returns the in-flight promise if one exists;
   * returns cached data immediately when still fresh (within `staleTime`).
   */
  fetch(key, fn, opts = {}) {
    const e = this.ensure(key);
    const { staleTime = 0, force = false } = opts;
    const snap = e.snapshot;
    const isFresh = snap.updatedAt !== void 0 && snap.error === void 0 && Date.now() - snap.updatedAt < staleTime;
    if (!force && isFresh && snap.data !== void 0) return Promise.resolve(snap.data);
    if (e.promise) return e.promise;
    this.update(key, { fetching: true });
    const p = fn().then(
      (data) => {
        this.update(key, { data, error: void 0, updatedAt: Date.now(), fetching: false });
        e.promise = void 0;
        return data;
      },
      (err) => {
        this.update(key, { error: err, fetching: false });
        e.promise = void 0;
        throw err;
      }
    );
    e.promise = p;
    return p;
  }
  /** Mark matching entries stale (forces the next fetch to hit the network). */
  invalidate(predicate) {
    for (const [key, e] of this.entries) {
      if (!predicate || predicate(key)) {
        e.snapshot = { ...e.snapshot, updatedAt: void 0 };
        e.listeners.forEach((l) => l());
      }
    }
  }
  clear() {
    this.entries.clear();
  }
};

// src/keys.ts
function stableStringify(value) {
  if (value === null || value === void 0) return "null";
  if (typeof value !== "object") return JSON.stringify(value);
  if (value instanceof Date) return JSON.stringify(value.toISOString());
  if (Array.isArray(value)) return "[" + value.map(stableStringify).join(",") + "]";
  const obj = value;
  const keys = Object.keys(obj).sort();
  return "{" + keys.map((k) => JSON.stringify(k) + ":" + stableStringify(obj[k])).join(",") + "}";
}
function queryKey(path, params) {
  return params && Object.keys(params).length ? `${path}?${stableStringify(params)}` : path;
}

// src/context.tsx
var import_react = require("react");
var import_http_query_core = require("@kevincii/http-query-core");
var HttpQueryContext = (0, import_react.createContext)(null);
function HttpQueryProvider(props) {
  const { client, clientOptions, cache, children } = props;
  const clientRef = (0, import_react.useRef)();
  const resolvedClient = (0, import_react.useMemo)(() => {
    if (client) return client;
    if (!clientRef.current) clientRef.current = (0, import_http_query_core.createClient)(clientOptions);
    return clientRef.current;
  }, [client, clientOptions]);
  const cacheRef = (0, import_react.useRef)();
  const resolvedCache = (0, import_react.useMemo)(() => {
    if (cache) return cache;
    if (!cacheRef.current) cacheRef.current = new QueryCache();
    return cacheRef.current;
  }, [cache]);
  const value = (0, import_react.useMemo)(
    () => ({ client: resolvedClient, cache: resolvedCache }),
    [resolvedClient, resolvedCache]
  );
  return (0, import_react.createElement)(HttpQueryContext.Provider, { value }, children);
}
function useHttpQueryContext() {
  const ctx = (0, import_react.useContext)(HttpQueryContext);
  if (!ctx) throw new Error("useHttpQuery* must be used within an <HttpQueryProvider>");
  return ctx;
}
function useHttpQueryClient() {
  return useHttpQueryContext().client;
}
function useQueryCache() {
  return useHttpQueryContext().cache;
}

// src/useHttpQuery.ts
var import_react2 = require("react");
function useHttpQuery(path, params, options = {}) {
  const { client, cache } = useHttpQueryContext();
  const { enabled = true, staleTime = 0, request, onSuccess, onError } = options;
  const key = options.key ?? queryKey(path, params);
  const snapshot = (0, import_react2.useSyncExternalStore)(
    (cb) => cache.subscribe(key, cb),
    () => cache.getSnapshot(key),
    () => cache.getSnapshot(key)
  );
  const run = (0, import_react2.useCallback)(
    (force) => cache.fetch(key, () => client.query(path, params, request), { staleTime, force }).then(
      (data) => {
        onSuccess?.(data);
        return data;
      },
      (err) => {
        onError?.(err);
        throw err;
      }
    ),
    // params/request are captured via the key; changing them changes `key`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cache, client, key, path, staleTime]
  );
  (0, import_react2.useEffect)(() => {
    if (enabled) run(false).catch(() => {
    });
  }, [enabled, run]);
  return {
    data: snapshot.data,
    error: snapshot.error,
    isLoading: snapshot.fetching && snapshot.data === void 0,
    isFetching: snapshot.fetching,
    isSuccess: snapshot.updatedAt !== void 0 && snapshot.error === void 0,
    isError: snapshot.error !== void 0 && snapshot.error !== null,
    refetch: () => run(true)
  };
}

// src/useInfiniteHttpQuery.ts
var import_react3 = require("react");
function defaultSelect(raw) {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") {
    const obj = raw;
    for (const k of ["items", "data", "results", "records"]) {
      if (Array.isArray(obj[k])) return obj[k];
    }
  }
  return [];
}
function useInfiniteHttpQuery(path, params, options = {}) {
  const { client } = useHttpQueryContext();
  const {
    enabled = true,
    pageSize = 20,
    pageParam = "page",
    pageSizeParam = "pageSize",
    startPage = 1,
    select = defaultSelect,
    request
  } = options;
  const [pages, setPages] = (0, import_react3.useState)([]);
  const [error, setError] = (0, import_react3.useState)(void 0);
  const [isLoading, setIsLoading] = (0, import_react3.useState)(false);
  const [isFetchingNextPage, setIsFetchingNextPage] = (0, import_react3.useState)(false);
  const [hasNextPage, setHasNextPage] = (0, import_react3.useState)(true);
  const nextPageRef = (0, import_react3.useRef)(startPage);
  const runToken = (0, import_react3.useRef)(0);
  const fetchPage = (0, import_react3.useCallback)(
    async (page, isFirst) => {
      const token = runToken.current;
      if (isFirst) setIsLoading(true);
      else setIsFetchingNextPage(true);
      try {
        const raw = await client.query(
          path,
          { ...params, [pageParam]: page, [pageSizeParam]: pageSize },
          request
        );
        if (token !== runToken.current) return;
        const items = select(raw);
        setPages((prev) => isFirst ? [items] : [...prev, items]);
        setHasNextPage(items.length === pageSize);
        setError(void 0);
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
    [client, path, pageParam, pageSizeParam, pageSize]
  );
  const paramsKey = JSON.stringify(params ?? {});
  const reset = (0, import_react3.useCallback)(() => {
    runToken.current += 1;
    nextPageRef.current = startPage;
    setPages([]);
    setHasNextPage(true);
    setError(void 0);
    if (enabled) void fetchPage(startPage, true);
  }, [enabled, startPage, fetchPage, paramsKey]);
  (0, import_react3.useEffect)(() => {
    reset();
  }, [reset]);
  const fetchNextPage = (0, import_react3.useCallback)(async () => {
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
    reset
  };
}

// src/useHttpMutation.ts
var import_react4 = require("react");
function useHttpMutation(fn, options = {}) {
  const { client } = useHttpQueryContext();
  const [data, setData] = (0, import_react4.useState)(void 0);
  const [error, setError] = (0, import_react4.useState)(void 0);
  const [isLoading, setIsLoading] = (0, import_react4.useState)(false);
  const mutateAsync = (0, import_react4.useCallback)(
    async (vars) => {
      setIsLoading(true);
      setError(void 0);
      try {
        const result = await fn(client, vars);
        setData(result);
        options.onSuccess?.(result, vars);
        options.onSettled?.(result, void 0, vars);
        return result;
      } catch (err) {
        setError(err);
        options.onError?.(err, vars);
        options.onSettled?.(void 0, err, vars);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [client, fn]
  );
  const mutate = (0, import_react4.useCallback)(
    (vars) => {
      void mutateAsync(vars).catch(() => {
      });
    },
    [mutateAsync]
  );
  const reset = (0, import_react4.useCallback)(() => {
    setData(void 0);
    setError(void 0);
    setIsLoading(false);
  }, []);
  return {
    mutate,
    mutateAsync,
    data,
    error,
    isLoading,
    isSuccess: data !== void 0 && error === void 0,
    isError: error !== void 0 && error !== null,
    reset
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  HttpQueryProvider,
  QueryCache,
  queryKey,
  stableStringify,
  useHttpMutation,
  useHttpQuery,
  useHttpQueryClient,
  useHttpQueryContext,
  useInfiniteHttpQuery,
  useQueryCache
});
//# sourceMappingURL=index.cjs.map