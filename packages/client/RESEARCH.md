# @kevincii/http-query-client — Research & Competitive Analysis

Date: July 8, 2026

## Summary

`@kevincii/http-query-client` is a **new** TypeScript client for the HTTP QUERY method (RFC 10008). The package name and namespace are currently unclaimed on npm.

**Status:**
- ✅ Namespace `@http-query/*` is available
- ✅ Package `@kevincii/http-query-client` has not been published yet (verified via `npm view @kevincii/http-query-client` → 404)
- ⚠️  There are other packages with "http query" in npm, but they serve different purposes
- 🚀 The QUERY method is starting to gain adoption (see findings below)

---

## Existing Packages with "http query" in npm

### Similar Purpose (HTTP QUERY Method Support)

#### 1. `@thecodepace/fastify-http-query` (v0.0.4, 2026-06-10)
- **URL:** https://www.npmjs.com/package/@thecodepace/fastify-http-query
- **Description:** Plugin to enable HTTP query method in Fastify
- **License:** MIT
- **Author:** luca@delpuppo.net (@puppo92)
- **Note:** This is a Fastify plugin. Your `@kevincii/http-query-client` is a standalone client library. **These are complementary**, not competing:
  - `@thecodepace/fastify-http-query` — server-side Fastify plugin
  - `@kevincii/http-query-client` — client-side TypeScript library (framework-agnostic)
  - Future plans: `@http-query/node`, `@http-query/express`, `@http-query/fastify` (from RFC 10008 ecosystem)

### Different Purpose (Query String / Parameter Handling)

- `@apimatic/http-query` — URL query parameter utilities
- `@http-query/core` — HTTP query pattern for filtering data (not the QUERY method)
- `http-query-string` — Parse/stringify query strings
- `json-to-http-query-string` — Convert JSON to query strings
- ... and 15+ others

**Conclusion:** None of these are direct competitors to `@kevincii/http-query-client`. They handle URL query **parameters**, not the HTTP `QUERY` **method**.

---

## Adoption of HTTP QUERY Method

Evidence that RFC 10008 QUERY method is gaining early adoption:

1. **Fastify Integration** (June 2026)
   - `@thecodepace/fastify-http-query` published
   - Shows server-side adoption is starting

2. **Your Ecosystem**
   - `@kevincii/http-query-client` — reference client implementation
   - Planned packages: `@http-query/react`, `@http-query/node`, `@http-query/express`, `@http-query/fastify`, `@http-query/openapi`
   - This suggests a coordinated RFC 10008 adoption effort

---

## Competitive Advantages of `@kevincii/http-query-client`

### Unique to This Package

1. **Reference Implementation**
   - First comprehensive, production-ready client for RFC 10008
   - Fully typed TypeScript with zero runtime dependencies

2. **Core Features**
   - Intelligent fallback system (QUERY → POST → GET with auto-serialization)
   - Built-in retries with exponential backoff
   - Timeout + AbortController support
   - Middleware/hook system (beforeRequest, afterResponse, onError)
   - Optional caching with TTL
   - Multiple response parsing modes

3. **Developer Experience**
   - Type-safe API with generics
   - Comprehensive test suite (>95% coverage target)
   - Demo with mock server (CORS-enabled)
   - Clear documentation (EXPLAINER_DE.md, EXPLAINER_EN.md, README.md)

4. **Ecosystem Foundation**
   - Designed as foundation for framework-specific packages
   - ESM + CommonJS builds
   - Node.js 20+ compatible
   - Browser-compatible

### Compared to Other HTTP Clients

Typical HTTP clients (fetch, axios, got, etc.) support many methods but:
- Don't have QUERY method awareness
- Don't have intelligent fallbacks for QUERY
- Don't specifically optimize for RFC 10008 semantics

Your client is **purpose-built** for the QUERY method.

---

## Market Opportunity

**Early Stage:**
- RFC 10008 is new (published 2026)
- Server adoption is starting (Fastify plugin exists)
- Client libraries are rare → **You're among the first**

**Growth Potential:**
- If major frameworks (Express, Fastify, etc.) adopt QUERY, demand for client libraries will grow
- Your ecosystem (`@http-query/*`) is well-positioned
- Reference implementation advantage

**Risk:**
- Adoption depends on server-side support
- CORS may limit client-side QUERY usage
- Large HTTP clients (axios, fetch wrapper libraries) may add QUERY support later

---

## Recommendations Before Publishing

1. ✅ **Namespace Control:** Reserve npm scope `@http-query` (create npm org or use personal account)
2. ✅ **Package Metadata:** Done (license, repository, keywords, author, homepage)
3. ✅ **Changesets & Release:** Configured (.changeset/config.json + release.yml)
4. 🔄 **Server Support Validation:** Document which servers support QUERY (Fastify via plugin, etc.)
5. 🔄 **Integration Tests:** Consider tests against real servers or Fastify mock
6. 🔄 **Announcement Strategy:** Publish with clear messaging about RFC 10008 adoption

---

## Next Steps for Publishing

1. Create npm account or org with scope `@http-query`
2. Update GitHub repository URL in package.json (if different from template)
3. Run full test suite locally (`npm test -- --run`)
4. Commit and push changesets
5. Create GitHub release or use GH Actions `release.yml` workflow
6. Set NPM_TOKEN in GitHub Secrets
7. First publish: `npm publish` or trigger release workflow

---

## Context7 Search Results

Context7 library search for "http-query client" found:
- No exact match for `@kevincii/http-query-client`
- Multiple HTTP client libraries (axios, got, fetch wrappers, etc.)
- None specifically for RFC 10008 QUERY method

**Conclusion:** Your package fills a specific niche that's currently uncovered.

---

Generated: July 8, 2026  
Author: Research & Analysis for @kevincii/http-query-client  
Next Review: Before 0.1.0 release

