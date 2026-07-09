import { describe, it, expect } from "vitest";
import { paginate, collectPages, queryPage } from "../src/pagination";
import type { QueryCapableClient, QueryParams } from "../src/types";

/** A fake client that serves `total` items in fixed page sizes. */
function fakeClient(total: number, key: "array" | "items" = "array"): QueryCapableClient {
  return {
    async query<T = unknown>(_path: string, params?: QueryParams): Promise<T> {
      const page = Number(params?.page ?? 1);
      const pageSize = Number(params?.pageSize ?? 20);
      const start = (page - 1) * pageSize;
      const items = Array.from({ length: Math.max(0, Math.min(pageSize, total - start)) }, (_, i) => ({
        id: start + i,
      }));
      if (key === "items") return { items, total } as T;
      return items as T;
    },
  };
}

describe("pagination", () => {
  it("queryPage reports hasNext by page fill", async () => {
    const client = fakeClient(25);
    const p1 = await queryPage(client, "/users", {}, 1, { pageSize: 10 });
    expect(p1.items).toHaveLength(10);
    expect(p1.hasNext).toBe(true);
    expect(p1.nextParams).toMatchObject({ page: 2, pageSize: 10 });

    const p3 = await queryPage(client, "/users", {}, 3, { pageSize: 10 });
    expect(p3.items).toHaveLength(5);
    expect(p3.hasNext).toBe(false);
  });

  it("paginate iterates all pages (array response)", async () => {
    const client = fakeClient(23);
    const batches: number[] = [];
    for await (const batch of paginate<{ id: number }>(client, "/users", {}, { pageSize: 10 })) {
      batches.push(batch.length);
    }
    expect(batches).toEqual([10, 10, 3]);
  });

  it("collectPages flattens using total from object response", async () => {
    const client = fakeClient(15, "items");
    const all = await collectPages<{ id: number }>(client, "/users", {}, { pageSize: 6 });
    expect(all).toHaveLength(15);
    expect(all[0]).toEqual({ id: 0 });
    expect(all[14]).toEqual({ id: 14 });
  });
});
