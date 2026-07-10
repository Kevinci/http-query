# @kevincii/http-query-client

Batteries-included TypeScript client for the HTTP `QUERY` method — the
DX-focused entry point of the [`@kevincii/http-query`](https://github.com/Kevinci/http-query)
ecosystem. Re-exports the full [`@kevincii/http-query-core`](https://github.com/Kevinci/http-query/tree/main/packages/core)
API and ships a preconfigured default client.

> **Browser & QUERY support:** `QUERY` is a valid `fetch` method —
> `fetch(url, { method: "QUERY", body })` works in current browsers (it is neither a
> forbidden nor a normalized method) and in Node.js (≥20). The practical caveats:
> cross-origin QUERY always triggers a CORS preflight (it is not safelisted), browsers
> don't cache QUERY responses yet, HTML `<form>`s fall back to GET, and many
> servers/proxies/CDNs don't handle QUERY yet. That's why the client keeps an automatic
> `POST` (or `GET`, serialized to a query string) fallback — send QUERY where it's
> supported, degrade gracefully everywhere else.

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

## Query modes — `auto` vs `params`

The `mode` option controls how `query()` puts parameters on the wire. Set it once on the client or override per request.

### `"auto"` (default) — QUERY-first with automatic fallback

Sends an HTTP `QUERY` request with a JSON body. If the server responds with `405` or `501`, the client automatically retries with the fallback method (`"POST"` by default, then `"GET"` with a serialized query string).

```ts
const client = createBrowserClient({ baseUrl: "https://api.example.com" });
// mode: "auto", fallback: "POST" are the defaults

// 1st try → QUERY /users  body: { "filter": { "age": { "gte": 18 } }, "sort": "name" }
// Server returns 405 → retry automatically
// 2nd try → POST  /users  body: { "filter": { "age": { "gte": 18 } }, "sort": "name" }
const users = await client.query<User[]>("/users", {
  filter: { age: { gte: 18 } },
  sort: "name",
});
```

Use `"auto"` for most apps — it sends the richest possible request and degrades gracefully.

### `"params"` — always GET with a query string

Every call becomes a plain `GET`. Parameters are serialized into the URL using bracket notation. No body is sent. Use this for servers that only handle GET, CDN-cacheable reads, or shallow params.

```ts
const client = createBrowserClient({ baseUrl: "https://api.example.com", mode: "params" });

// GET /users?page=1&sort=name&filter[age][gte]=18&filter[country][in]=DE&filter[country][in]=AT
await client.query<User[]>("/users", {
  page: 1,
  sort: "name",
  filter: {
    age: { gte: 18 },
    country: { in: ["DE", "AT"] },
  },
});
```

### Per-request override

Pass `mode` as part of the third argument to override the client default for a single call:

```ts
// Client defaults to "params", but this one call uses QUERY/POST
await client.query("/search", { q: "Ada" }, { mode: "auto" });

// Client defaults to "auto", but this call forces a plain GET
await client.query("/config", { locale: "de" }, { mode: "params" });
```

### When to use which

| Situation | Mode |
|---|---|
| General-purpose app, server may not support QUERY | `"auto"` |
| Server only accepts GET, or you need CDN caching | `"params"` |
| Deeply nested filters (bracket notation gets long) | `"auto"` (JSON body stays clean) |
| Shallow params, bookmarkable URLs | `"params"` |

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
