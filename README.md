# @kevincii/http-query

A type-safe, **QUERY-first** toolkit for complex API reads. Pass a typed object,
get a request — no hand-built query strings, no ad-hoc filter encoding. The
library decides whether to send an HTTP `QUERY` request with a JSON body or fall
back to query parameters.

```ts
// instead of: fetch(`/users?page=1&sort=name&active=true`)
client.query("/users", { page: 1, sort: "name", active: true });

// complex filters, no manual encoding:
client.query("/users", { filter: { age: { gte: 18 }, country: "DE" } });
```

## Packages

| Package | Description |
| --- | --- |
| [`@kevincii/http-query-core`](packages/core) | Framework-agnostic engine: query building, typed filters, serialization, transport, caching, pagination. Zero dependencies. |
| [`@kevincii/http-query-client`](packages/client) | Batteries-included client for browser + Node with a ready-to-use default. |
| [`@kevincii/http-query-react`](packages/react) | React hooks (`useHttpQuery`, `useInfiniteHttpQuery`, `useHttpMutation`) with a shared cache. |
| [`@kevincii/http-query-next`](packages/next) | Next.js server client, RSC data fetching, and App Router route-handler helpers. |

## Features

- **Type-safe queries** — typed params and responses, with autocomplete.
- **Automatic URL / body** — QUERY with a JSON body, or a serialized query string on fallback.
- **Complex filters** — nested objects and arrays (`filter[age][gte]=18`) with typed operators.
- **Unified browser + Node** — native QUERY in Node (≥20), automatic fallback in browsers.
- **Caching, pagination, retries, timeout, AbortController, middleware.**

## Development

This is an npm-workspaces monorepo.

```bash
npm install        # install & link all workspaces
npm run build      # build every package (core → client → react → next)
npm test           # run every package's test suite
npm run docs       # build packages/docs (documentation site) for GitHub Pages
```

## Documentation

The full documentation site (how to use each package and every option) is built
from [`packages/client/demo/index.html`](packages/client/demo/index.html) and
deployed to GitHub Pages via `.github/workflows/deploy-pages.yml`.

## Releasing

Versioning and publishing are managed with [Changesets](https://github.com/changesets/changesets).
Add a changeset with `npm run changeset`; the release workflow builds, tests, and
publishes all workspace packages.

## License

MIT
