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
var __reExport = (target, mod, secondTarget) => (__copyProps(target, mod, "default"), secondTarget && __copyProps(secondTarget, mod, "default"));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  configureServerClient: () => configureServerClient,
  createQueryRouteHandler: () => createQueryRouteHandler,
  createServerClient: () => createServerClient,
  getServerClient: () => getServerClient,
  parseQuery: () => parseQuery,
  queryOnServer: () => queryOnServer
});
module.exports = __toCommonJS(index_exports);

// src/server.ts
var import_http_query_core = require("@kevincii/http-query-core");
function createServerClient(opts = {}) {
  return (0, import_http_query_core.createClient)({ fallback: null, mode: "query", ...opts });
}
var defaultServerClient;
function getServerClient() {
  if (!defaultServerClient) defaultServerClient = createServerClient();
  return defaultServerClient;
}
function configureServerClient(opts) {
  defaultServerClient = createServerClient(opts);
  return defaultServerClient;
}
function queryOnServer(path, params, opts) {
  return getServerClient().query(path, params, opts);
}

// src/parse.ts
function parsePath(key) {
  const first = key.indexOf("[");
  if (first === -1) return [key];
  const segments = [key.slice(0, first)];
  const re = /\[([^\]]*)\]/g;
  let m;
  while ((m = re.exec(key)) !== null) segments.push(m[1] ?? "");
  return segments;
}
function assign(root, segments, value) {
  let node = root;
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const last = i === segments.length - 1;
    const nextSeg = segments[i + 1];
    const wantArray = nextSeg === "";
    if (last) {
      if (seg === "") {
        if (Array.isArray(node)) node.push(value);
      } else if (Array.isArray(node)) {
        node[Number(seg)] = value;
      } else {
        const existing = node[seg];
        if (existing === void 0) node[seg] = value;
        else if (Array.isArray(existing)) existing.push(value);
        else node[seg] = [existing, value];
      }
      return;
    }
    const container = wantArray ? [] : {};
    if (Array.isArray(node)) {
      const idx = seg === "" ? node.length : Number(seg);
      if (node[idx] === void 0) node[idx] = container;
      node = node[idx];
    } else {
      if (node[seg] === void 0) node[seg] = container;
      node = node[seg];
    }
  }
}
function parseQuery(search) {
  const sp = typeof search === "string" ? new URLSearchParams(search.startsWith("?") ? search.slice(1) : search) : search;
  const result = {};
  for (const [rawKey, value] of sp.entries()) {
    assign(result, parsePath(rawKey), value);
  }
  return result;
}

// src/route.ts
function jsonResponse(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...headers }
  });
}
async function extractParams(request) {
  const method = request.method.toUpperCase();
  if (method === "GET" || method === "HEAD") {
    return parseQuery(new URL(request.url).searchParams);
  }
  const text = await request.text();
  if (!text) return parseQuery(new URL(request.url).searchParams);
  try {
    return JSON.parse(text);
  } catch {
    return parseQuery(text);
  }
}
function createQueryRouteHandler(resolver, options = {}) {
  const handler = async (request) => {
    const ctx = { request, method: request.method };
    try {
      const params = await extractParams(request);
      const result = await resolver(params, ctx);
      return jsonResponse(result, 200, options.headers);
    } catch (err) {
      if (options.onError) return options.onError(err, ctx);
      return jsonResponse({ error: err?.message ?? "Internal Server Error" }, 500);
    }
  };
  return { handler, QUERY: handler, POST: handler, GET: handler };
}

// src/index.ts
__reExport(index_exports, require("@kevincii/http-query-react"), module.exports);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  configureServerClient,
  createQueryRouteHandler,
  createServerClient,
  getServerClient,
  parseQuery,
  queryOnServer,
  ...require("@kevincii/http-query-react")
});
//# sourceMappingURL=index.cjs.map