import { describe, it, expect, vi, afterEach } from "vitest";
import { createClient } from "../src/client";
import { TimeoutError } from "../src/errors";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("HttpQueryClient", () => {
  it("sends QUERY by default and parses json", async () => {
    const mock = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }));
    globalThis.fetch = mock as unknown as typeof fetch;
    const client = createClient({});
    const res = await client.request<{ ok: boolean }>("/test", { body: { a: 1 } });
    expect(res.ok).toBe(true);
    expect(mock.mock.calls[0]?.[1]?.method).toBe("QUERY");
  });

  it("query() sends the params object as the QUERY body", async () => {
    let captured: RequestInit | undefined;
    globalThis.fetch = vi.fn(async (_url: string, init: RequestInit) => {
      captured = init;
      return new Response(JSON.stringify([{ id: 1 }]), { status: 200 });
    }) as unknown as typeof fetch;

    const client = createClient({ baseUrl: "https://api.test" });
    await client.query("/users", { page: 1, filter: { age: { gte: 18 } } });
    expect(captured?.method).toBe("QUERY");
    expect(JSON.parse(String(captured?.body))).toEqual({ page: 1, filter: { age: { gte: 18 } } });
  });

  it("query() with mode:params serializes nested filters to the query string", async () => {
    let calledUrl = "";
    globalThis.fetch = vi.fn(async (url: string) => {
      calledUrl = url;
      return new Response(JSON.stringify([]), { status: 200 });
    }) as unknown as typeof fetch;

    const client = createClient({ baseUrl: "https://api.test", mode: "params" });
    await client.query("/users", { filter: { age: { gte: 18 } }, country: "DE" });
    // Bracket structure stays human-readable; only segment names and values are encoded.
    expect(calledUrl).toContain("filter[age][gte]=18");
    expect(calledUrl).toContain("country=DE");
  });

  it("falls back to POST when QUERY returns 405", async () => {
    globalThis.fetch = vi.fn(async (_url: string, init: RequestInit) => {
      if (init.method === "QUERY") return new Response(JSON.stringify({ message: "no" }), { status: 405 });
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }) as unknown as typeof fetch;

    const client = createClient({ fallback: "POST" });
    const res = await client.request<{ ok: boolean }>("/x", { body: { a: 1 } });
    expect(res.ok).toBe(true);
    expect((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it("serializes body to query string when falling back to GET", async () => {
    globalThis.fetch = vi.fn(async (_url: string, init: RequestInit) => {
      if (init.method === "QUERY") return new Response(null, { status: 405 });
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }) as unknown as typeof fetch;

    const client = createClient({ fallback: "GET" });
    const res = await client.request<{ ok: boolean }>("/foo", { body: { q: "search" } });
    expect(res.ok).toBe(true);
    const calls = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls;
    expect(String(calls[calls.length - 1]?.[0])).toContain("q=search");
  });

  it("times out and throws TimeoutError", async () => {
    globalThis.fetch = vi.fn((_url: string, init?: RequestInit) => {
      return new Promise<Response>((resolve, reject) => {
        const signal = init?.signal as AbortSignal | undefined;
        if (signal?.aborted) return reject(new DOMException("Aborted", "AbortError"));
        signal?.addEventListener?.("abort", () => reject(new DOMException("Aborted", "AbortError")));
        setTimeout(() => resolve(new Response(JSON.stringify({}), { status: 200 })), 200);
      });
    }) as unknown as typeof fetch;

    const client = createClient({ timeout: 20 });
    await expect(client.request("/slow")).rejects.toThrow(TimeoutError);
  });

  it("retries on network error for safe requests", async () => {
    let calls = 0;
    globalThis.fetch = vi.fn(async () => {
      calls += 1;
      if (calls < 3) throw new TypeError("network down");
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }) as unknown as typeof fetch;

    const client = createClient({ retries: 2 });
    const res = await client.request<{ ok: boolean }>("/r");
    expect(res.ok).toBe(true);
    expect(calls).toBe(3);
  });

  it("caches safe requests when enabled", async () => {
    let calls = 0;
    globalThis.fetch = vi.fn(async () => {
      calls += 1;
      return new Response(JSON.stringify({ v: calls }), { status: 200 });
    }) as unknown as typeof fetch;

    const client = createClient({ cache: true, cacheTTL: 1000 });
    const a = await client.query<{ v: number }>("/c", { p: 1 });
    const b = await client.query<{ v: number }>("/c", { p: 1 });
    expect(a.v).toBe(1);
    expect(b.v).toBe(1);
    expect(calls).toBe(1);
  });

  it("uses an injected fetch implementation", async () => {
    const injected = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }));
    const client = createClient({ fetch: injected as unknown as typeof fetch });
    await client.query("/x", { a: 1 });
    expect(injected).toHaveBeenCalled();
  });
});
