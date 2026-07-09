import { describe, it, expect, vi, afterEach } from "vitest";
import { createClient, createBrowserClient, client as defaultClient, HttpError } from "../src";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("@kevincii/http-query-client re-exports core", () => {
  it("createClient sends QUERY and parses json", async () => {
    globalThis.fetch = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 })) as unknown as typeof fetch;
    const client = createClient({});
    const res = await client.request<{ ok: boolean }>("/test", { body: { a: 1 } });
    expect(res.ok).toBe(true);
  });

  it("createBrowserClient defaults to POST fallback", async () => {
    globalThis.fetch = vi.fn(async (_url: string, init: RequestInit) => {
      if (init.method === "QUERY") return new Response(null, { status: 405 });
      return new Response(JSON.stringify({ method: init.method }), { status: 200 });
    }) as unknown as typeof fetch;

    const client = createBrowserClient({ baseUrl: "https://api.test" });
    const res = await client.query<{ method: string }>("/users", { active: true });
    expect(res.method).toBe("POST");
  });

  it("exposes a shared default client", () => {
    expect(typeof defaultClient.query).toBe("function");
  });

  it("re-exports error classes", () => {
    expect(new HttpError(404, null)).toBeInstanceOf(Error);
  });
});
