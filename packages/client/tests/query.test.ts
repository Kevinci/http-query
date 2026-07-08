import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createClient } from "../src/client";
import { HttpError, TimeoutError, NetworkError, ParseError } from "../src/errors";

const originalFetch = globalThis.fetch;

beforeEach(() => {
  // ensure clean state for each test
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("HttpClient basic", () => {
  it("sends QUERY by default and parses json", async () => {
    const mock = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }));
    globalThis.fetch = mock as any;
    const client = createClient({});
    const res = await client.request<{ ok: boolean }>("/test", { body: { a: 1 } });
    expect(res.ok).toBe(true);
    expect(mock).toHaveBeenCalled();
  });

  it("falls back to POST when QUERY returns 405", async () => {
    const calls: any[] = [];
    globalThis.fetch = vi.fn(async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      if ((init.method as string) === "QUERY") {
        return new Response(JSON.stringify({ message: "no" }), { status: 405 });
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }) as any;

    const client = createClient({ fallback: "POST" });
    const res = await client.request<{ ok: boolean }>("/x", { body: { a: 1 } });
    expect(res.ok).toBe(true);
    expect((globalThis.fetch as any).mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it("serializes body to query string when falling back to GET", async () => {
    globalThis.fetch = vi.fn(async (url: string, init: RequestInit) => {
      if ((init.method as string) === "QUERY") {
        return new Response(null, { status: 405 });
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }) as any;

    const client = createClient({ fallback: "GET" });
    const res = await client.request<{ ok: boolean }>("/foo", { body: { q: "search" } });
    expect(res.ok).toBe(true);
    const lastCall = (globalThis.fetch as any).mock.calls[(globalThis.fetch as any).mock.calls.length - 1];
    expect(lastCall[0]).toContain("q=search");
  });

  it("times out and throws TimeoutError", async () => {
    // fetch resolves after a long delay, while client timeout is short
    globalThis.fetch = vi.fn((url: string, init?: RequestInit) => {
      return new Promise((resolve, reject) => {
        const signal = init?.signal as AbortSignal | undefined;
        if (signal?.aborted) return reject(new DOMException("Aborted", "AbortError"));
        const onAbort = () => reject(new DOMException("Aborted", "AbortError"));
        signal?.addEventListener?.("abort", onAbort);
        setTimeout(() => {
          signal?.removeEventListener?.("abort", onAbort);
          resolve(new Response(JSON.stringify({}), { status: 200 }));
        }, 200);
      });
    }) as any;

    const client = createClient({ timeout: 20 });
    await expect(client.request("/slow")).rejects.toThrow(TimeoutError);
  });

  it("retries on network error for safe requests", async () => {
    let calls = 0;
    globalThis.fetch = vi.fn(async () => {
      calls += 1;
      if (calls < 3) throw new TypeError("network down");
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }) as any;

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
    }) as any;

    const client = createClient({ cache: true, cacheTTL: 1000 });
    const a = await client.request<{ v: number }>("/c", { body: { p: 1 }, method: "QUERY" });
    const b = await client.request<{ v: number }>("/c", { body: { p: 1 }, method: "QUERY" });
    expect(a.v).toBe(1);
    expect(b.v).toBe(1);
    expect(calls).toBe(1);
  });
});

