# @kevincii/http-query-core

Framework-agnostic engine for the HTTP `QUERY` method. Zero dependencies, works
in browsers and Node (>=20).

This is the foundation of the `@kevincii/http-query` ecosystem. Most apps install
[`@kevincii/http-query-client`](https://github.com/Kevinci/http-query/tree/main/packages/client),
[`@kevincii/http-query-react`](https://github.com/Kevinci/http-query/tree/main/packages/react),
or [`@kevincii/http-query-next`](https://github.com/Kevinci/http-query/tree/main/packages/next)
— all of which are built on this package.

## What it provides

- **Type-safe query building** — pass an object, get a request. No hand-built strings.
- **Nested filter serialization** — `{ filter: { age: { gte: 18 } } }` → `filter[age][gte]=18`.
- **QUERY-first with automatic fallback** — QUERY → POST → GET (GET is serialized to a query string).
- **Retries** with exponential backoff for safe methods.
- **Timeout + AbortController** composition.
- **In-memory caching** with TTL for safe requests.
- **Middleware** hooks (`beforeRequest`, `afterResponse`, `onError`).
- **Pagination** helpers (`paginate`, `collectPages`, `queryPage`).

## Quick start

```ts
import { createClient } from "@kevincii/http-query-core";

const client = createClient({ baseUrl: "https://api.example.com" });

const users = await client.query<User[]>("/users", {
  page: 1,
  sort: "name",
  filter: { age: { gte: 18 }, country: { in: ["DE", "AT"] } },
});
```

See the [documentation site](https://kevinci.github.io/http-query/) for the full
API and options.
