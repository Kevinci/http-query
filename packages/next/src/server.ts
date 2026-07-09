import {
  createClient,
  type CreateClientOptions,
  type HttpQueryClient,
  type QueryOptions,
  type QueryParams,
} from "@kevincii/http-query-core";

/**
 * Create a client tuned for the Node server (Server Components, Route Handlers,
 * server actions). Node (>=20) can send the `QUERY` method natively, so no
 * fallback is configured by default.
 */
export function createServerClient(opts: CreateClientOptions = {}): HttpQueryClient {
  return createClient({ fallback: null, mode: "query", ...opts });
}

let defaultServerClient: HttpQueryClient | undefined;

/** Lazily-created shared server client used by {@link queryOnServer}. */
export function getServerClient(): HttpQueryClient {
  if (!defaultServerClient) defaultServerClient = createServerClient();
  return defaultServerClient;
}

/** Override the shared server client (e.g. to set a baseUrl once at startup). */
export function configureServerClient(opts: CreateClientOptions): HttpQueryClient {
  defaultServerClient = createServerClient(opts);
  return defaultServerClient;
}

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
export function queryOnServer<T = unknown, P extends QueryParams = QueryParams>(
  path: string,
  params?: P,
  opts?: QueryOptions,
): Promise<T> {
  return getServerClient().query<T, P>(path, params, opts);
}
