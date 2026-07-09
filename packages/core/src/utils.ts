import type { HTTPMethod } from "./types";

/** Safe (idempotent, cacheable) methods that may be retried and cached. */
export const isSafeMethod = (m: HTTPMethod): boolean => m === "GET" || m === "HEAD" || m === "QUERY";

/** Promise-based delay used for retry backoff. */
export function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
