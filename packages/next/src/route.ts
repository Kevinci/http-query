import type { QueryParams } from "@kevincii/http-query-core";
import { parseQuery } from "./parse";

export interface QueryRouteContext {
  request: Request;
  method: string;
}

/** A resolver turns the incoming params into the data to return. */
export type QueryResolver<T = unknown> = (params: QueryParams, ctx: QueryRouteContext) => T | Promise<T>;

export interface QueryRouteOptions {
  /** Produce a custom error response. Defaults to a 500 with the message. */
  onError?: (error: unknown, ctx: QueryRouteContext) => Response | Promise<Response>;
  /** Extra response headers (e.g. cache-control). */
  headers?: Record<string, string>;
}

function jsonResponse(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

/** Read params from the request body (QUERY/POST) or the query string (GET/HEAD). */
async function extractParams(request: Request): Promise<QueryParams> {
  const method = request.method.toUpperCase();
  if (method === "GET" || method === "HEAD") {
    return parseQuery(new URL(request.url).searchParams);
  }
  const text = await request.text();
  if (!text) return parseQuery(new URL(request.url).searchParams);
  try {
    return JSON.parse(text) as QueryParams;
  } catch {
    return parseQuery(text);
  }
}

/**
 * Build an App Router route handler that accepts QUERY (and the POST/GET
 * fallbacks the client uses), normalizes the params from either the JSON body
 * or the query string, and returns the resolver's result as JSON.
 *
 * @example
 * // app/api/users/route.ts
 * import { createQueryRouteHandler } from "@kevincii/http-query-next";
 * import { db } from "@/lib/db";
 *
 * const route = createQueryRouteHandler(async (params) => db.users.search(params));
 * export const { QUERY, POST, GET } = route;
 */
export function createQueryRouteHandler<T = unknown>(
  resolver: QueryResolver<T>,
  options: QueryRouteOptions = {},
) {
  const handler = async (request: Request): Promise<Response> => {
    const ctx: QueryRouteContext = { request, method: request.method };
    try {
      const params = await extractParams(request);
      const result = await resolver(params, ctx);
      return jsonResponse(result, 200, options.headers);
    } catch (err) {
      if (options.onError) return options.onError(err, ctx);
      return jsonResponse({ error: (err as Error)?.message ?? "Internal Server Error" }, 500);
    }
  };

  // Export under every method name Next may route to us.
  return { handler, QUERY: handler, POST: handler, GET: handler };
}
