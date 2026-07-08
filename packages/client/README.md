# @http-query/client

Reference TypeScript client for the HTTP QUERY method (RFC 10008).

## Quick Start

### Installation

```bash
cd packages/client
npm install
```

### Build

```bash
npm run build
```

### Tests

```bash
npm test
```

### Development with Demo

To run the demo locally with auto-rebuild on file changes:

**Terminal 1 — Start the dev server (serves demo + dist):**
```bash
npm run dev
```
This will:
- Build the package once
- Start `tsup --watch` for automatic rebuilds
- Start a local HTTP server on http://localhost:5173

**Terminal 2 — Start the mock API server (CORS-enabled QUERY endpoint):**
```bash
npm run mock-server
```
This will start a mock API on http://localhost:3000 that:
- Supports all HTTP methods including QUERY
- Includes proper CORS headers allowing QUERY from any origin
- Echoes back the request (method, URL, body, headers, timestamp)

**Terminal 3 (optional) — Watch tests:**
```bash
npm test -- --watch
```

### Try the Demo

1. Open http://localhost:5173 in your browser
2. Edit the URL, body, fallback method, timeout as desired
3. Click "Send QUERY"
4. The response from the mock server appears below

## API Usage

```ts
import { createClient, query } from "@http-query/client";

const client = createClient({ 
  baseUrl: "https://api.example.com", 
  fallback: "POST" 
});

const users = await client.request<User[]>("/users", { 
  body: { active: true } 
});

// top-level shortcut
const data = await query("/users", { body: { q: 1 } });
```

## Features

- **HTTP QUERY method** — send requests with JSON body
- **Automatic fallbacks** — try QUERY → POST → GET with automatic query param serialization for GET
- **Type safety** — fully generic request and response types
- **AbortController** — cancel requests with signal
- **Timeout** — automatic abort after specified duration
- **Retries** — exponential backoff for safe requests (QUERY, GET, HEAD)
- **Custom errors** — HttpError, TimeoutError, NetworkError, ParseError
- **Response parsing** — json, text, blob, arrayBuffer
- **Middleware** — beforeRequest, afterResponse, onError hooks
- **Caching** — optional in-memory cache with TTL (safe requests only)

## Deployment

### GitHub Pages

Build and prepare docs for GitHub Pages deployment:

```bash
npm run prepare:ghpages
```

This copies `dist/` and `demo/` to `docs/client/` for GitHub Pages hosting.

### Continuous Deployment

The repository includes a GitHub Actions workflow (`.github/workflows/deploy-pages.yml`) that automatically:
- Builds the package on push to main
- Runs `npm run prepare:ghpages`
- Deploys to GitHub Pages

To enable:
1. Push to main
2. Go to repo Settings → Pages
3. Select Deploy from branch: main, folder: /docs
