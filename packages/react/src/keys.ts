import type { QueryParams } from "@kevincii/http-query-core";

/** Deterministic JSON stringify (sorted keys) so equal params produce equal keys. */
export function stableStringify(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value !== "object") return JSON.stringify(value);
  if (value instanceof Date) return JSON.stringify(value.toISOString());
  if (Array.isArray(value)) return "[" + value.map(stableStringify).join(",") + "]";
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return "{" + keys.map((k) => JSON.stringify(k) + ":" + stableStringify(obj[k])).join(",") + "}";
}

/** Build a stable cache key from a path and its params. */
export function queryKey(path: string, params?: QueryParams): string {
  return params && Object.keys(params).length ? `${path}?${stableStringify(params)}` : path;
}
