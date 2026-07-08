import { BodyLike, HTTPMethod } from "./types";

export const isSafeMethod = (m: HTTPMethod) => m === "GET" || m === "HEAD" || m === "QUERY";

export function serializeQueryParams(obj: BodyLike): string {
  if (!obj || typeof obj !== "object") return "";
  const parts: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    if (Array.isArray(v)) {
      for (const item of v) parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(item))}`);
    } else {
      parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
    }
  }
  return parts.join("&");
}

export function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

