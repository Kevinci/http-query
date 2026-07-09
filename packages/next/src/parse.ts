import type { QueryParams, QueryValue } from "@kevincii/http-query-core";

/** Split `filter[age][gte]` into `["filter", "age", "gte"]`. */
function parsePath(key: string): string[] {
  const first = key.indexOf("[");
  if (first === -1) return [key];
  const segments = [key.slice(0, first)];
  const re = /\[([^\]]*)\]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(key)) !== null) segments.push(m[1] ?? "");
  return segments;
}

function assign(root: Record<string, QueryValue>, segments: string[], value: string): void {
  let node: Record<string, QueryValue> | QueryValue[] = root;

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]!;
    const last = i === segments.length - 1;
    const nextSeg = segments[i + 1];
    const wantArray = nextSeg === "";

    if (last) {
      if (seg === "") {
        // Trailing `[]` — push onto the current array node.
        if (Array.isArray(node)) node.push(value);
      } else if (Array.isArray(node)) {
        node[Number(seg)] = value;
      } else {
        // Repeated key → collapse into an array.
        const existing = node[seg];
        if (existing === undefined) node[seg] = value;
        else if (Array.isArray(existing)) existing.push(value);
        else node[seg] = [existing, value];
      }
      return;
    }

    // Descend, creating containers as needed.
    const container: Record<string, QueryValue> | QueryValue[] = wantArray ? [] : {};
    if (Array.isArray(node)) {
      const idx = seg === "" ? node.length : Number(seg);
      if (node[idx] === undefined) node[idx] = container;
      node = node[idx] as Record<string, QueryValue> | QueryValue[];
    } else {
      if (node[seg] === undefined) node[seg] = container;
      node = node[seg] as Record<string, QueryValue> | QueryValue[];
    }
  }
}

/**
 * Parse a query string (or `URLSearchParams`) back into a nested params object —
 * the inverse of core's `serializeParams`. Values remain strings.
 *
 * @example
 * parseQuery("filter[age][gte]=18&tag=a&tag=b")
 * // => { filter: { age: { gte: "18" } }, tag: ["a", "b"] }
 */
export function parseQuery(search: string | URLSearchParams): QueryParams {
  const sp =
    typeof search === "string"
      ? new URLSearchParams(search.startsWith("?") ? search.slice(1) : search)
      : search;
  const result: Record<string, QueryValue> = {};
  for (const [rawKey, value] of sp.entries()) {
    assign(result, parsePath(rawKey), value);
  }
  return result;
}
