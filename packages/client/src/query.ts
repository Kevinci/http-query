import { createClient } from "./client";
import type { QueryOptions } from "./types";

const defaultClient = createClient();

/**
 * Top-level helper for simple use-cases.
 * @example
 * const users = await query<User[]>("/users", { body: { name: 'John' } })
 */
export async function query<T = unknown, B = unknown>(path?: string, opts?: QueryOptions<B, T>) {
  if (!path) throw new TypeError("path is required");
  return defaultClient.request<T, B>(path, opts);
}

export default query;

