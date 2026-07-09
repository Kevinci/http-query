/**
 * @kevincii/http-query-client
 *
 * The batteries-included, browser + Node client for the HTTP QUERY method.
 * It re-exports the full {@link https://npmjs.com/package/@kevincii/http-query-core | core}
 * API and ships a preconfigured default client tuned for app code.
 */
export * from "@kevincii/http-query-core";

import { createClient, type CreateClientOptions, type HttpQueryClient } from "@kevincii/http-query-core";

/**
 * A ready-to-use client with browser-friendly defaults (QUERY with automatic
 * POST fallback). Import this when you don't need custom configuration.
 *
 * @example
 * import { client } from "@kevincii/http-query-client";
 * const users = await client.query("/users", { active: true });
 */
export const client: HttpQueryClient = createClient({ fallback: "POST" });

/**
 * Create a client with browser-friendly defaults. Any option can be overridden.
 */
export function createBrowserClient(opts: CreateClientOptions = {}): HttpQueryClient {
  return createClient({ fallback: "POST", ...opts });
}
