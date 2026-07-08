---
"@http-query/client": minor
---

Initial release of @http-query/client - a TypeScript client for the HTTP QUERY method (RFC 10008).

Includes:
- Full HTTP QUERY support with automatic fallback (POST, GET)
- Type-safe API with generics
- Built-in retry logic with exponential backoff
- Timeout and AbortController support
- Optional in-memory caching with TTL
- Middleware/hook system (beforeRequest, afterResponse, onError)
- Multiple response parsing modes (json, text, blob, arrayBuffer)
- Comprehensive test suite and demo
- Zero runtime dependencies

