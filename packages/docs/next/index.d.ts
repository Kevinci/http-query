import { CreateClientOptions, HttpQueryClient, QueryParams, QueryOptions } from '@kevincii/http-query-core';
export * from '@kevincii/http-query-react';

/**
 * Create a client tuned for the Node server (Server Components, Route Handlers,
 * server actions). Node (>=20) can send the `QUERY` method natively, so no
 * fallback is configured by default.
 */
declare function createServerClient(opts?: CreateClientOptions): HttpQueryClient;
/** Lazily-created shared server client used by {@link queryOnServer}. */
declare function getServerClient(): HttpQueryClient;
/** Override the shared server client (e.g. to set a baseUrl once at startup). */
declare function configureServerClient(opts: CreateClientOptions): HttpQueryClient;
/**
 * Fetch data from a Server Component using the shared server client.
 *
 * @example
 * // app/users/page.tsx
 * export default async function Page() {
 *   const users = await queryOnServer<User[]>("/users", { active: true });
 *   return <UserList users={users} />;
 * }
 */
declare function queryOnServer<T = unknown, P extends QueryParams = QueryParams>(path: string, params?: P, opts?: QueryOptions): Promise<T>;

interface QueryRouteContext {
    request: Request;
    method: string;
}
/** A resolver turns the incoming params into the data to return. */
type QueryResolver<T = unknown> = (params: QueryParams, ctx: QueryRouteContext) => T | Promise<T>;
interface QueryRouteOptions {
    /** Produce a custom error response. Defaults to a 500 with the message. */
    onError?: (error: unknown, ctx: QueryRouteContext) => Response | Promise<Response>;
    /** Extra response headers (e.g. cache-control). */
    headers?: Record<string, string>;
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
declare function createQueryRouteHandler<T = unknown>(resolver: QueryResolver<T>, options?: QueryRouteOptions): {
    handler: (request: Request) => Promise<Response>;
    QUERY: (request: Request) => Promise<Response>;
    POST: (request: Request) => Promise<Response>;
    GET: (request: Request) => Promise<Response>;
};

/**
 * Parse a query string (or `URLSearchParams`) back into a nested params object —
 * the inverse of core's `serializeParams`. Values remain strings.
 *
 * @example
 * parseQuery("filter[age][gte]=18&tag=a&tag=b")
 * // => { filter: { age: { gte: "18" } }, tag: ["a", "b"] }
 */
declare function parseQuery(search: string | URLSearchParams): QueryParams;

export { type QueryResolver, type QueryRouteContext, type QueryRouteOptions, configureServerClient, createQueryRouteHandler, createServerClient, getServerClient, parseQuery, queryOnServer };
