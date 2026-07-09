---
"@kevincii/http-query-core": minor
"@kevincii/http-query-client": minor
"@kevincii/http-query-react": minor
"@kevincii/http-query-next": minor
---

Introduce the **@kevincii/http-query ecosystem** — a type-safe, QUERY-first toolkit for complex API reads.

- **@kevincii/http-query-core** — framework-agnostic engine: type-safe `query()`, nested filter serialization (`filter[age][gte]=18`), typed filter operators, QUERY → POST → GET fallback, retries, timeout, AbortController, in-memory caching, middleware, and pagination helpers (`paginate`, `collectPages`, `queryPage`). Zero dependencies.
- **@kevincii/http-query-client** — batteries-included browser + Node client that re-exports core and ships a preconfigured default client (`client`, `createBrowserClient`).
- **@kevincii/http-query-react** — `HttpQueryProvider` with a shared, deduped cache plus `useHttpQuery`, `useInfiniteHttpQuery`, and `useHttpMutation`.
- **@kevincii/http-query-next** — Node server client, `queryOnServer` for RSC, `createQueryRouteHandler` for App Router route handlers, and re-exported React hooks for Client Components.
