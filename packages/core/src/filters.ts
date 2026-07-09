/**
 * Typed filter operators. These are plain, serializable objects — dropping one
 * under a `filter` key produces bracket-notation query params
 * (`filter[age][gte]=18`) or a nested JSON body for a QUERY request, with no
 * manual string building.
 *
 * @example
 * const params = {
 *   filter: {
 *     age: { gte: 18, lt: 65 },
 *     country: { in: ["DE", "AT"] },
 *     name: { contains: "an" },
 *   },
 * } satisfies { filter: Filter };
 */
export interface FilterOperators<T = unknown> {
  /** Equal to. */
  eq?: T;
  /** Not equal to. */
  ne?: T;
  /** Greater than. */
  gt?: T;
  /** Greater than or equal. */
  gte?: T;
  /** Less than. */
  lt?: T;
  /** Less than or equal. */
  lte?: T;
  /** Value is one of. */
  in?: T[];
  /** Value is none of. */
  nin?: T[];
  /** Substring match. */
  contains?: string;
  /** Prefix match. */
  startsWith?: string;
  /** Suffix match. */
  endsWith?: string;
  /** SQL-style LIKE pattern. */
  like?: string;
  /** Inclusive range `[min, max]`. */
  between?: [T, T];
}

/** A field filter is either a bare value (shorthand for `eq`) or an operator map. */
export type FilterValue<T = unknown> = T | FilterOperators<T>;

/**
 * A filter object keyed by the fields of `TShape`. Every field is optional and
 * accepts either a value or a {@link FilterOperators} map.
 */
export type Filter<TShape extends Record<string, unknown> = Record<string, unknown>> = {
  [K in keyof TShape]?: FilterValue<TShape[K]>;
};
