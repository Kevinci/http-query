import type { HTTPMethod } from "./types";

/**
 * Build the ordered list of methods to try. QUERY is attempted first; on a
 * 405/501 the client walks to the configured fallback and finally to GET.
 */
export function resolveFallback(primary: HTTPMethod, fallback?: HTTPMethod | null): HTTPMethod[] {
  const order: HTTPMethod[] = [];
  if (primary) order.push(primary);
  if (fallback && fallback !== primary) order.push(fallback);
  // final safety net: GET (query-string serialized) if not already present
  if (!order.includes("GET")) order.push("GET");
  return order;
}
