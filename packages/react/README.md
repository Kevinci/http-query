# @kevincii/http-query-react

React hooks for the HTTP `QUERY` method, built on
[`@kevincii/http-query-core`](https://github.com/Kevinci/http-query/tree/main/packages/core).
Think React Query, focused on the QUERY-first approach: type-safe params, nested
filters, a shared cache, and pagination.

## Install

```bash
npm install @kevincii/http-query-react @kevincii/http-query-core react
```

## Usage

```tsx
import { HttpQueryProvider, useHttpQuery } from "@kevincii/http-query-react";

function App() {
  return (
    <HttpQueryProvider clientOptions={{ baseUrl: "/api" }}>
      <Users />
    </HttpQueryProvider>
  );
}

function Users() {
  const { data, isLoading, error, refetch } = useHttpQuery<User[]>("/users", {
    filter: { active: true, age: { gte: 18 } },
    sort: "name",
  });

  if (isLoading) return <p>Loading…</p>;
  if (error) return <p>Failed.</p>;
  return <ul>{data?.map((u) => <li key={u.id}>{u.name}</li>)}</ul>;
}
```

## Hooks

- `useHttpQuery(path, params?, options?)` — cached, deduped reads.
- `useInfiniteHttpQuery(path, params?, options?)` — offset pagination with `fetchNextPage`.
- `useHttpMutation(fn, options?)` — writes with lifecycle state.
- `useHttpQueryClient()` / `useQueryCache()` — escape hatches.

See the [documentation site](https://kevinci.github.io/http-query/) for full options.
