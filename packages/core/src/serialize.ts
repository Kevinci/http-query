import type { QueryParams, QueryValue, SerializeOptions } from "./types";

function isPlainObject(v: unknown): v is Record<string, QueryValue> {
  return typeof v === "object" && v !== null && !Array.isArray(v) && !(v instanceof Date);
}

function isPrimitiveArray(arr: QueryValue[]): boolean {
  return arr.every((v) => v === null || v === undefined || typeof v !== "object" || v instanceof Date);
}

function encodeVal(v: Exclude<QueryValue, QueryValue[] | Record<string, QueryValue>>, encode: boolean): string {
  const s = v instanceof Date ? v.toISOString() : String(v);
  return encode ? encodeURIComponent(s) : s;
}

/**
 * Serialize a (possibly deeply nested) params object into a query string.
 *
 * Nested objects use bracket notation (`filter[age][gte]=18`), so complex
 * filters map straight to the wire without any hand-built strings. Arrays are
 * rendered according to {@link SerializeOptions.arrayFormat}.
 *
 * @example
 * serializeParams({ page: 1, filter: { age: { gte: 18 }, country: "DE" } })
 * // => "page=1&filter[age][gte]=18&filter[country]=DE"
 */
export function serializeParams(params: QueryParams | null | undefined, options: SerializeOptions = {}): string {
  const { arrayFormat = "repeat", encodeValues = true, skipNulls = true } = options;
  if (!params || typeof params !== "object") return "";

  const parts: string[] = [];
  const enc = (s: string) => (encodeValues ? encodeURIComponent(s) : s);

  const walk = (keyExpr: string, value: QueryValue): void => {
    if (value === undefined) return;
    if (value === null) {
      if (skipNulls) return;
      parts.push(`${keyExpr}=`);
      return;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) return;
      if (arrayFormat === "comma" && isPrimitiveArray(value)) {
        const joined = value
          .filter((v): v is Exclude<QueryValue, null | undefined> => v !== null && v !== undefined)
          .map((v) => encodeVal(v as never, encodeValues))
          .join(",");
        parts.push(`${keyExpr}=${joined}`);
        return;
      }
      const bracketed = arrayFormat === "bracket" || arrayFormat === "comma";
      value.forEach((v, i) => {
        const sub = arrayFormat === "index" ? `${keyExpr}[${i}]` : bracketed ? `${keyExpr}[]` : keyExpr;
        walk(sub, v);
      });
      return;
    }

    if (isPlainObject(value)) {
      for (const [k, v] of Object.entries(value)) {
        walk(`${keyExpr}[${enc(k)}]`, v);
      }
      return;
    }

    parts.push(`${keyExpr}=${encodeVal(value, encodeValues)}`);
  };

  for (const [k, v] of Object.entries(params)) {
    walk(enc(k), v as QueryValue);
  }

  return parts.join("&");
}

/** Append a query string to a URL, choosing `?` or `&` correctly. */
export function appendQueryString(url: string, qs: string): string {
  if (!qs) return url;
  return url + (url.includes("?") ? "&" : "?") + qs;
}
