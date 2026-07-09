import { createClient } from "./client";
import type { QueryOptions, QueryParams } from "./types";

const defaultClient = createClient();

/**
 * Top-level shortcut backed by a shared default client.
 *
 * @example
 * const users = await query<User[]>("/users", { active: true, sort: "name" });
 */
export async function query<T = unknown, P extends QueryParams = QueryParams>(
  path: string,
  params?: P,
  opts?: QueryOptions,
): Promise<T> {
  if (!path) throw new TypeError("path is required");
  return defaultClient.query<T, P>(path, params, opts);
}

export default query;
