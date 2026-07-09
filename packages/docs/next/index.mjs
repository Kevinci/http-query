// src/server.ts
import {
  createClient
} from "@kevincii/http-query-core";
function createServerClient(opts = {}) {
  return createClient({ fallback: null, mode: "query", ...opts });
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
export * from "@kevincii/http-query-react";
export {
  configureServerClient,
  createQueryRouteHandler,
  createServerClient,
  getServerClient,
  parseQuery,
  queryOnServer
};
//# sourceMappingURL=index.mjs.map