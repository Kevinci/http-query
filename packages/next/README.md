# @kevincii/http-query-next

Next.js integration for the HTTP `QUERY` method. Server-side data fetching in
Server Components, App Router route-handler helpers, and the React hooks
re-exported for Client Components.

## Install

```bash
npm install @kevincii/http-query-next @kevincii/http-query-core @kevincii/http-query-react
```

## Server Components (RSC)

```tsx
// app/users/page.tsx
import { queryOnServer, configureServerClient } from "@kevincii/http-query-next";

configureServerClient({ baseUrl: process.env.API_URL });

export default async function Page() {
  const users = await queryOnServer<User[]>("/users", { active: true });
  return <UserList users={users} />;
}
```

Node (>=20) sends the `QUERY` method natively, so the server client uses no
fallback by default.

## Route Handlers

```ts
// app/api/users/route.ts
import { createQueryRouteHandler } from "@kevincii/http-query-next";
import { db } from "@/lib/db";

const route = createQueryRouteHandler(async (params) => db.users.search(params));
export const { QUERY, POST, GET } = route;
```

Params are read from the JSON body (QUERY/POST) or the query string (GET) — the
same request the client produces, whichever method the platform routes.

## Client Components

```tsx
"use client";
import { HttpQueryProvider, useHttpQuery } from "@kevincii/http-query-next";
```

All hooks from [`@kevincii/http-query-react`](https://github.com/Kevinci/http-query/tree/main/packages/react)
are re-exported here.

See the [documentation site](https://kevinci.github.io/http-query/) for full options.
