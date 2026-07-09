# @kevincii/http-query-client

Batteries-included TypeScript client for the HTTP `QUERY` method — the
DX-focused entry point of the [`@kevincii/http-query`](https://github.com/Kevinci/http-query)
ecosystem. Re-exports the full [`@kevincii/http-query-core`](https://github.com/Kevinci/http-query/tree/main/packages/core)
API and ships a preconfigured default client.

> **Browser support:** As of 2026 browsers cannot send the `QUERY` method via
> `fetch`, so the client automatically falls back to `POST` (or `GET`, which is
> serialized to a query string). In Node.js (≥20) `QUERY` is sent natively.

## Install

```bash
npm install @kevincii/http-query-client
```

## Quick start

```ts
import { client, createBrowserClient, query } from "@kevincii/http-query-client";

// 1) shared default client — zero config
const users = await client.query<User[]>("/users", { active: true });

// 2) a configured client
const api = createBrowserClient({ baseUrl: "https://api.example.com" });
const page = await api.query<User[]>("/users", {
  page: 1,
  sort: "name",
  filter: { age: { gte: 18 }, country: { in: ["DE", "AT"] } },
});

// 3) top-level shortcut
const data = await query("/users", { sort: "name" });
```

## Features

- **Type-safe `query()`** — pass a params object, get a typed response.
- **Nested filters** — `{ filter: { age: { gte: 18 } } }` → `filter[age][gte]=18`.
- **QUERY-first** with automatic `POST` / `GET` fallback.
- **Retries** (exponential backoff), **timeout**, **AbortController**.
- **In-memory caching** with TTL, **middleware** hooks.
- **Pagination** helpers (`paginate`, `collectPages`, `queryPage`).

Everything from the core API is re-exported here. See the
[documentation site](https://kevinci.github.io/http-query/) for the full
reference and options.

## Local development

From the repository root:

```bash
npm install
npm run build            # build all packages
npm test                 # test all packages
```

A CORS-enabled mock server (supports the real `QUERY` method) is available for
manual testing: `npm run mock-server` inside `packages/client`.
