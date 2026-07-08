# @http-query/client — Quick Guide (For Beginners)

This is a simple explanation of what this package does and how to use it. No prior knowledge required.

## What is This?

`@http-query/client` is a small TypeScript library that supports the new HTTP method `QUERY` (RFC 10008). It lets you send HTTP requests with a JSON body — similar to `POST`, but with its own dedicated method.

The goal of this library is to give developers a clean, type-safe, and extensible API for `QUERY` requests, including:

- **Fallbacks** (e.g., to `POST` or `GET` if `QUERY` isn't supported)
- **Timeout & Abort** (automatic request cancellation)
- **Automatic JSON handling** (parsing / serializing)
- **Retry logic** with exponential backoff for safe requests
- **Optional in-memory cache** (with TTL)
- **Middleware & hooks** (for logging, auth, custom behavior)

## Why a Mock Server? (CORS)

Browsers don't allow all HTTP methods from other domains by default. Many public demo APIs (e.g., httpbin.org) don't allow the `QUERY` method in their CORS headers. So we provide a small local mock server that supports `QUERY` and sets the correct CORS headers. This makes the demo work in the browser.

## Quick Start — 3 Steps

1. **Install the package:**

```bash
cd packages/client
npm install
```

2. **Start dev-server and mock-server (two terminals):**

Terminal A — Dev-server (serves demo, auto-rebuild):

```bash
npm run dev
# Then open http://localhost:5173
```

Terminal B — Mock API (CORS-enabled, supports QUERY):

```bash
npm run mock-server
# Mock API runs on http://localhost:3000
```

3. **Try the demo:**
   - Open http://localhost:5173 in your browser
   - Edit the URL, body, fallback method, timeout as needed
   - Click "Send QUERY"
   - See the response from the mock server

## Example: Using the Library in Code (TypeScript)

### Simple: Top-level helper

```ts
import { query } from "@http-query/client";

// Types are optional
const users = await query<{ id: number; name: string }[]>("/users", {
  body: { active: true },
});

console.log(users);
```

### Advanced: Configured client

```ts
import { createClient } from "@http-query/client";

const client = createClient({ 
  baseUrl: "https://api.example.com", 
  fallback: "POST" 
});

const res = await client.request("/users", { body: { name: "John" } });
```

### Common Options

- `method`: default is `QUERY` — can be overridden
- `fallback`: e.g., `"POST"` or `"GET"` (GET serializes body to query params)
- `timeout`: milliseconds; auto-abort after this time
- `retries`: number of automatic retries (exponential backoff)
- `cache`: `true` for simple in-memory cache (safe requests only)
- `signal`: AbortSignal for manual cancellation

## Middleware, Hooks & Error Handling

### Middleware

```ts
// Run before every request
client.middleware.useBefore(async (init) => {
  console.log('Request:', init.method, init.url);
  return init;
});

// Run after every response
client.middleware.useAfter(async (res) => {
  console.log('Response:', res.status);
  return res;
});

// Run on error
client.middleware.useOnError(async (err) => {
  console.error('Error:', err);
});
```

### Error Classes

The library throws specific error types:

- `HttpError` — non-ok HTTP status (e.g., 404, 500)
- `TimeoutError` — request exceeded timeout
- `NetworkError` — connection failed (DNS, network down)
- `ParseError` — response parsing failed (JSON parse error)

```ts
import { HttpError, TimeoutError } from "@http-query/client";

try {
  await client.request("/users");
} catch (err) {
  if (err instanceof TimeoutError) console.log('Request timed out');
  if (err instanceof HttpError) console.log('Server returned:', err.status);
}
```

## Demo Files (Where Things Live)

- `packages/client/demo/index.html` — the demo page
- `packages/client/demo/main.mjs` — demo logic (JavaScript)
- `packages/client/scripts/mock-server.js` — local API mock (use `npm run mock-server`)
- `packages/client/src/` — source code (TypeScript)
- `packages/client/tests/` — unit tests

## Deploying to GitHub Pages

To publish the demo to GitHub Pages:

```bash
cd packages/client
npm run prepare:ghpages
```

This creates/updates `docs/client/` in the repo. Then push to `main` and enable GitHub Pages in Settings (folder `/docs`).

The repo includes a GitHub Actions workflow (`.github/workflows/deploy-pages.yml`) that does this automatically on push to `main`.

## Common Problems

- **CORS errors in browser**: Start `npm run mock-server` — the demo needs it
- **QUERY not supported by server**: Check `OPTIONS` response or use fallback `POST`
- **Tests fail**: Run `npm test` to see details; usually in `tests/` folder

## Want More?

If you'd like:
- Automatic browser reload on rebuild (live-reload)
- An advanced demo (request builder, capability checker)
- Help publishing to npm

Just ask!

---

**Need it in German?** See `EXPLAINER_DE.md` in the same folder.

