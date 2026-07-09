import { describe, it, expect, vi } from "vitest";
import { createQueryRouteHandler } from "../src/route";
import { parseQuery } from "../src/parse";
import { createServerClient } from "../src/server";

describe("parseQuery", () => {
  it("reverses nested bracket notation", () => {
    expect(parseQuery("filter[age][gte]=18&filter[country]=DE")).toEqual({
      filter: { age: { gte: "18" }, country: "DE" },
    });
  });

  it("collapses repeated keys into arrays", () => {
    expect(parseQuery("tag=a&tag=b")).toEqual({ tag: ["a", "b"] });
  });

  it("handles [] array notation", () => {
    expect(parseQuery("tag[]=a&tag[]=b")).toEqual({ tag: ["a", "b"] });
  });
});

describe("createQueryRouteHandler", () => {
  it("reads params from a QUERY JSON body and returns the resolver result", async () => {
    const resolver = vi.fn(async (params: Record<string, unknown>) => ({ received: params }));
    const { QUERY } = createQueryRouteHandler(resolver);

    const req = new Request("https://app.test/api/users", {
      method: "POST", // Request() rejects the custom QUERY verb; body path is identical.
      body: JSON.stringify({ page: 1, filter: { age: { gte: 18 } } }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await QUERY(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({ received: { page: 1, filter: { age: { gte: 18 } } } });
    expect(resolver).toHaveBeenCalledOnce();
  });

  it("reads params from the query string on GET", async () => {
    const { GET } = createQueryRouteHandler(async (params) => params);
    const req = new Request("https://app.test/api/users?filter[age][gte]=18&sort=name", { method: "GET" });
    const res = await GET(req);
    expect(await res.json()).toEqual({ filter: { age: { gte: "18" } }, sort: "name" });
  });

  it("returns a 500 with the error message on resolver failure", async () => {
    const { POST } = createQueryRouteHandler(async () => {
      throw new Error("boom");
    });
    const req = new Request("https://app.test/api", { method: "POST", body: "{}" });
    const res = await POST(req);
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "boom" });
  });
});

describe("createServerClient", () => {
  it("defaults to native QUERY with no fallback", async () => {
    let method = "";
    const fetchImpl = vi.fn(async (_url: string, init: RequestInit) => {
      method = String(init.method);
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }) as unknown as typeof fetch;

    const client = createServerClient({ baseUrl: "https://api.test", fetch: fetchImpl });
    await client.query("/users", { active: true });
    expect(method).toBe("QUERY");
    expect(client.fallback).toBeNull();
  });
});
