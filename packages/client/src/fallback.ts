import { HTTPMethod } from "./types";

export function resolveFallback(primary: HTTPMethod, fallback?: HTTPMethod | null): HTTPMethod[] {
  const order: HTTPMethod[] = [];
  if (primary) order.push(primary);
  if (fallback && fallback !== primary) order.push(fallback);
  // final fallback to GET if not already
  if (!order.includes("GET")) order.push("GET");
  return order;
}

