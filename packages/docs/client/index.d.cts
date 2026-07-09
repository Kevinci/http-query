import { HttpQueryClient, CreateClientOptions } from '@kevincii/http-query-core';
export * from '@kevincii/http-query-core';

/**
 * @kevincii/http-query-client
 *
 * The batteries-included, browser + Node client for the HTTP QUERY method.
 * It re-exports the full {@link https://npmjs.com/package/@kevincii/http-query-core | core}
 * API and ships a preconfigured default client tuned for app code.
 */

/**
 * A ready-to-use client with browser-friendly defaults (QUERY with automatic
 * POST fallback). Import this when you don't need custom configuration.
 *
 * @example
 * import { client } from "@kevincii/http-query-client";
 * const users = await client.query("/users", { active: true });
 */
declare const client: HttpQueryClient;
/**
 * Create a client with browser-friendly defaults. Any option can be overridden.
 */
declare function createBrowserClient(opts?: CreateClientOptions): HttpQueryClient;

export { client, createBrowserClient };
