import { describe, it, expect, vi } from "vitest";
import { createElement, type ReactNode } from "react";
import { renderHook, waitFor, act } from "@testing-library/react";
import { createClient } from "@kevincii/http-query-core";
import { HttpQueryProvider } from "../src/context";
import { useHttpQuery } from "../src/useHttpQuery";
import { useHttpMutation } from "../src/useHttpMutation";

function makeWrapper(fetchImpl: typeof fetch) {
  const client = createClient({ baseUrl: "https://api.test", fetch: fetchImpl });
  return ({ children }: { children: ReactNode }) =>
    createElement(HttpQueryProvider, { client }, children);
}

describe("useHttpQuery", () => {
  it("loads and returns data", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify([{ id: 1 }]), { status: 200 }),
    ) as unknown as typeof fetch;
    const wrapper = makeWrapper(fetchImpl);

    const { result } = renderHook(() => useHttpQuery<{ id: number }[]>("/users", { active: true }), { wrapper });

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: 1 }]);
    expect(result.current.isFetching).toBe(false);
  });

  it("dedupes identical concurrent queries via the shared cache", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 })) as unknown as typeof fetch;
    const wrapper = makeWrapper(fetchImpl);

    const { result } = renderHook(
      () => {
        const a = useHttpQuery("/same", { x: 1 });
        const b = useHttpQuery("/same", { x: 1 });
        return { a, b };
      },
      { wrapper },
    );

    await waitFor(() => expect(result.current.a.isSuccess && result.current.b.isSuccess).toBe(true));
    expect((fetchImpl as ReturnType<typeof vi.fn>).mock.calls.length).toBe(1);
  });
});

describe("useHttpMutation", () => {
  it("runs the mutation and exposes result", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ id: 9 }), { status: 200 })) as unknown as typeof fetch;
    const wrapper = makeWrapper(fetchImpl);

    const { result } = renderHook(
      () => useHttpMutation((client, vars: { name: string }) => client.request<{ id: number }>("/users", { method: "POST", body: vars })),
      { wrapper },
    );

    let created: { id: number } | undefined;
    await act(async () => {
      created = await result.current.mutateAsync({ name: "Ada" });
    });
    expect(created).toEqual({ id: 9 });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
