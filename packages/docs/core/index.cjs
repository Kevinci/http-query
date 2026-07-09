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
  HttpClient: () => HttpClient,
  HttpError: () => HttpError,
  HttpQueryClient: () => HttpQueryClient,
  MiddlewareStack: () => MiddlewareStack,
  NetworkError: () => NetworkError,
  ParseError: () => ParseError,
  SimpleMemoryCache: () => SimpleMemoryCache,
  TimeoutError: () => TimeoutError,
  appendQueryString: () => appendQueryString,
  collectPages: () => collectPages,
  createClient: () => createClient,
  defaultSelect: () => defaultSelect,
  delay: () => delay,
  isSafeMethod: () => isSafeMethod,
  paginate: () => paginate,
  query: () => query,
  queryPage: () => queryPage,
  resolveFallback: () => resolveFallback,
  serializeParams: () => serializeParams
});
module.exports = __toCommonJS(index_exports);

// src/errors.ts
var HttpError = class _HttpError extends Error {
  status;
  body;
  constructor(status, body, message) {
    super(message ?? `HTTP Error: ${status}`);
    this.name = "HttpError";
    this.status = status;
    this.body = body;
    Object.setPrototypeOf(this, _HttpError.prototype);
  }
};
var TimeoutError = class _TimeoutError extends Error {
  constructor(message = "Request timed out") {
    super(message);
    this.name = "TimeoutError";
    Object.setPrototypeOf(this, _TimeoutError.prototype);
  }
};
var NetworkError = class _NetworkError extends Error {
  constructor(message = "Network error") {
    super(message);
    this.name = "NetworkError";
    Object.setPrototypeOf(this, _NetworkError.prototype);
  }
};
var ParseError = class _ParseError extends Error {
  original;
  constructor(original, message = "Failed to parse response") {
    super(message);
    this.name = "ParseError";
    this.original = original;
    Object.setPrototypeOf(this, _ParseError.prototype);
  }
};

// src/serialize.ts
function isPlainObject(v) {
  return typeof v === "object" && v !== null && !Array.isArray(v) && !(v instanceof Date);
}
function isPrimitiveArray(arr) {
  return arr.every((v) => v === null || v === void 0 || typeof v !== "object" || v instanceof Date);
}
function encodeVal(v, encode) {
  const s = v instanceof Date ? v.toISOString() : String(v);
  return encode ? encodeURIComponent(s) : s;
}
function serializeParams(params, options = {}) {
  const { arrayFormat = "repeat", encodeValues = true, skipNulls = true } = options;
  if (!params || typeof params !== "object") return "";
  const parts = [];
  const enc = (s) => encodeValues ? encodeURIComponent(s) : s;
  const walk = (keyExpr, value) => {
    if (value === void 0) return;
    if (value === null) {
      if (skipNulls) return;
      parts.push(`${keyExpr}=`);
      return;
    }
    if (Array.isArray(value)) {
      if (value.length === 0) return;
      if (arrayFormat === "comma" && isPrimitiveArray(value)) {
        const joined = value.filter((v) => v !== null && v !== void 0).map((v) => encodeVal(v, encodeValues)).join(",");
        parts.push(`${keyExpr}=${joined}`);
        return;
      }
      const bracketed = arrayFormat === "bracket" || arrayFormat === "comma";
      value.forEach((v, i) => {
        const sub = arrayFormat === "index" ? `${keyExpr}[${i}]` : bracketed ? `${keyExpr}[]` : keyExpr;
        walk(sub, v);
      });
      return;
    }
    if (isPlainObject(value)) {
      for (const [k, v] of Object.entries(value)) {
        walk(`${keyExpr}[${enc(k)}]`, v);
      }
      return;
    }
    parts.push(`${keyExpr}=${encodeVal(value, encodeValues)}`);
  };
  for (const [k, v] of Object.entries(params)) {
    walk(enc(k), v);
  }
  return parts.join("&");
}
function appendQueryString(url, qs) {
  if (!qs) return url;
  return url + (url.includes("?") ? "&" : "?") + qs;
}

// src/pagination.ts
var TOTAL_KEYS = ["total", "totalCount", "count"];
var ITEM_KEYS = ["items", "data", "results", "records"];
function defaultSelect(raw) {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") {
    const obj = raw;
    for (const k of ITEM_KEYS) {
      if (Array.isArray(obj[k])) return obj[k];
    }
  }
  return [];
}
function defaultTotal(raw) {
  if (raw && typeof raw === "object") {
    const obj = raw;
    for (const k of TOTAL_KEYS) {
      if (typeof obj[k] === "number") return obj[k];
    }
  }
  return void 0;
}
async function queryPage(client, path, baseParams = {}, page = 1, options = {}) {
  const {
    pageSize = 20,
    pageParam = "page",
    pageSizeParam = "pageSize",
    select = defaultSelect,
    getTotal = defaultTotal,
    requestOptions
  } = options;
  const params = { ...baseParams, [pageParam]: page, [pageSizeParam]: pageSize };
  const raw = await client.query(path, params, requestOptions);
  const items = select(raw);
  const total = getTotal(raw);
  const seen = (page - 1) * pageSize + items.length;
  const hasNext = total !== void 0 ? seen < total : items.length === pageSize;
  return {
    items,
    page,
    pageSize,
    total,
    hasNext,
    nextParams: hasNext ? { ...baseParams, [pageParam]: page + 1, [pageSizeParam]: pageSize } : void 0
  };
}
async function* paginate(client, path, baseParams = {}, options = {}) {
  const startPage = options.startPage ?? 1;
  let page = startPage;
  for (; ; ) {
    const result = await queryPage(client, path, baseParams, page, options);
    yield result.items;
    if (!result.hasNext || result.items.length === 0) return;
    page += 1;
  }
}
async function collectPages(client, path, baseParams = {}, options = {}) {
  const all = [];
  for await (const batch of paginate(client, path, baseParams, options)) {
    all.push(...batch);
  }
  return all;
}

// src/cache.ts
var SimpleMemoryCache = class {
  constructor(defaultTTL = 5e3) {
    this.defaultTTL = defaultTTL;
  }
  defaultTTL;
  map = /* @__PURE__ */ new Map();
  get(key) {
    const e = this.map.get(key);
    if (!e) return void 0;
    if (e.expiresAt < Date.now()) {
      this.map.delete(key);
      return void 0;
    }
    return e.value;
  }
  set(key, value, ttl) {
    const expiresAt = Date.now() + (ttl ?? this.defaultTTL);
    this.map.set(key, { value, expiresAt });
  }
  delete(key) {
    this.map.delete(key);
  }
  clear() {
    this.map.clear();
  }
};

// src/utils.ts
var isSafeMethod = (m) => m === "GET" || m === "HEAD" || m === "QUERY";
function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// src/fallback.ts
function resolveFallback(primary, fallback) {
  const order = [];
  if (primary) order.push(primary);
  if (fallback && fallback !== primary) order.push(fallback);
  if (!order.includes("GET")) order.push("GET");
  return order;
}

// src/middleware.ts
var MiddlewareStack = class {
  before = [];
  after = [];
  onError = [];
  useBefore(fn) {
    this.before.push(fn);
  }
  useAfter(fn) {
    this.after.push(fn);
  }
  useOnError(fn) {
    this.onError.push(fn);
  }
  async runBefore(init) {
    let current = init;
    for (const fn of this.before) {
      current = await fn(current);
    }
    return current;
  }
  async runAfter(res) {
    let current = res;
    for (const fn of this.after) {
      current = await fn(current);
    }
    return current;
  }
  async runOnError(err) {
    for (const fn of this.onError) {
      await fn(err);
    }
  }
};

// src/client.ts
var DEFAULT_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json"
};
function buildUrl(base, path) {
  if (!path) return base ?? "";
  if (!base) return path;
  if (/^https?:\/\//i.test(path)) return path;
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}
var HttpQueryClient = class {
  baseUrl;
  headers;
  fallback;
  timeout;
  retries;
  cacheEnabled;
  cacheTTL;
  mode;
  serializeOptions;
  cache = new SimpleMemoryCache(5e3);
  middleware = new MiddlewareStack();
  fetchImpl;
  constructor(opts = {}) {
    this.baseUrl = opts.baseUrl;
    this.headers = { ...opts.headers ?? {}, ...DEFAULT_HEADERS };
    this.fallback = opts.fallback === void 0 ? "POST" : opts.fallback;
    this.timeout = opts.timeout;
    this.retries = opts.retries ?? 0;
    this.cacheEnabled = opts.cache ?? false;
    this.cacheTTL = opts.cacheTTL ?? 5e3;
    this.mode = opts.mode ?? "auto";
    this.serializeOptions = opts.serialize ?? {};
    this.fetchImpl = opts.fetch;
  }
  /** Register a plugin that mutates the client (e.g. adds middleware). */
  use(fn) {
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
  async query(path, params, opts = {}) {
    const mode = opts.mode ?? this.mode;
    if (mode === "params") {
      return this.request(path, { ...opts, method: "GET", body: params });
    }
    return this.request(path, { ...opts, method: opts.method ?? "QUERY", body: params });
  }
  /** Low-level request with the full QUERY → fallback → GET chain. */
  async request(path, opts = {}) {
    const method = opts.method ?? "QUERY";
    const fallbackOrder = resolveFallback(method, opts.fallback === void 0 ? this.fallback : opts.fallback);
    let lastErr;
    for (const m of fallbackOrder) {
      try {
        return await this.performWithRetries(path, { ...opts, method: m });
      } catch (err) {
        lastErr = err;
        if (err instanceof HttpError && (err.status === 405 || err.status === 501)) {
          continue;
        }
        throw err;
      }
    }
    throw lastErr;
  }
  async performWithRetries(path, opts) {
    const attempts = Math.max(1, opts.retries ?? this.retries ?? 0) + 1;
    let lastErr;
    for (let i = 0; i < attempts; i++) {
      try {
        return await this.perform(path, opts);
      } catch (err) {
        lastErr = err;
        const transient = err instanceof NetworkError || err instanceof TimeoutError;
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
  async perform(path, opts) {
    const method = opts.method ?? "QUERY";
    let url = buildUrl(this.baseUrl, path);
    const headers = { ...this.headers, ...opts.headers ?? {} };
    let bodyInit;
    if ((method === "GET" || method === "HEAD") && opts.body !== void 0 && opts.body !== null) {
      const qs = serializeParams(opts.body, { ...this.serializeOptions, ...opts.serialize });
      url = appendQueryString(url, qs);
      delete headers["Content-Type"];
    } else if (opts.body !== void 0) {
      bodyInit = JSON.stringify(opts.body);
    }
    const keyForCache = `${method}:${url}:${bodyInit ?? ""}`;
    const cacheOn = (opts.cache ?? this.cacheEnabled) && isSafeMethod(method);
    if (cacheOn) {
      const cached = this.cache.get(keyForCache);
      if (cached !== void 0) return cached;
    }
    const controller = new AbortController();
    const external = opts.signal;
    if (external) {
      if (external.aborted) controller.abort();
      else external.addEventListener("abort", () => controller.abort(), { once: true });
    }
    const timeoutMs = opts.timeout ?? this.timeout;
    let timeoutId;
    let timedOut = false;
    if (timeoutMs) {
      timeoutId = setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, timeoutMs);
    }
    const init = {
      url,
      method,
      headers,
      body: bodyInit,
      signal: controller.signal
    };
    const applied = await this.middleware.runBefore(init);
    const doFetch = this.fetchImpl ?? globalThis.fetch;
    let res;
    try {
      const { url: finalUrl, ...requestInit } = applied;
      res = await doFetch(finalUrl, requestInit);
    } catch (err) {
      if (err?.name === "AbortError") {
        throw timedOut ? new TimeoutError() : err;
      }
      const netErr = new NetworkError(err?.message ?? String(err));
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
      let parsed;
      if (type === "json") parsed = res.status === 204 ? null : await res.json();
      else if (type === "text") parsed = await res.text();
      else if (type === "blob") parsed = await res.blob();
      else parsed = await res.arrayBuffer();
      if (cacheOn) {
        this.cache.set(keyForCache, parsed, opts.cacheTTL ?? this.cacheTTL);
      }
      return parsed;
    } catch (err) {
      throw new ParseError(err);
    }
  }
};
var HttpClient = HttpQueryClient;
function createClient(opts = {}) {
  return new HttpQueryClient(opts);
}

// src/query.ts
var defaultClient = createClient();
async function query(path, params, opts) {
  if (!path) throw new TypeError("path is required");
  return defaultClient.query(path, params, opts);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  HttpClient,
  HttpError,
  HttpQueryClient,
  MiddlewareStack,
  NetworkError,
  ParseError,
  SimpleMemoryCache,
  TimeoutError,
  appendQueryString,
  collectPages,
  createClient,
  defaultSelect,
  delay,
  isSafeMethod,
  paginate,
  query,
  queryPage,
  resolveFallback,
  serializeParams
});
//# sourceMappingURL=index.cjs.map