import { describe, it, expect } from "vitest";
import { serializeParams, appendQueryString } from "../src/serialize";

describe("serializeParams", () => {
  it("serializes flat primitives", () => {
    expect(serializeParams({ page: 1, sort: "name", active: true })).toBe("page=1&sort=name&active=true");
  });

  it("skips null and undefined by default", () => {
    expect(serializeParams({ a: 1, b: null, c: undefined })).toBe("a=1");
  });

  it("serializes nested objects with bracket notation", () => {
    expect(serializeParams({ filter: { age: { gte: 18 }, country: "DE" } })).toBe(
      "filter[age][gte]=18&filter[country]=DE",
    );
  });

  it("repeats array keys by default", () => {
    expect(serializeParams({ tag: ["a", "b"] })).toBe("tag=a&tag=b");
  });

  it("supports bracket array format", () => {
    expect(serializeParams({ tag: ["a", "b"] }, { arrayFormat: "bracket" })).toBe("tag[]=a&tag[]=b");
  });

  it("supports comma array format", () => {
    expect(serializeParams({ tag: ["a", "b"] }, { arrayFormat: "comma" })).toBe("tag=a,b");
  });

  it("supports index array format", () => {
    expect(serializeParams({ tag: ["a", "b"] }, { arrayFormat: "index" })).toBe("tag[0]=a&tag[1]=b");
  });

  it("serializes arrays inside filter operators (in)", () => {
    expect(serializeParams({ filter: { country: { in: ["DE", "AT"] } } })).toBe(
      "filter[country][in]=DE&filter[country][in]=AT",
    );
  });

  it("encodes keys and values", () => {
    expect(serializeParams({ "a b": "c&d" })).toBe("a%20b=c%26d");
  });

  it("serializes Date as ISO string", () => {
    const d = new Date("2026-01-01T00:00:00.000Z");
    expect(serializeParams({ since: d })).toBe("since=2026-01-01T00%3A00%3A00.000Z");
  });

  it("appendQueryString picks the right separator", () => {
    expect(appendQueryString("/x", "a=1")).toBe("/x?a=1");
    expect(appendQueryString("/x?y=2", "a=1")).toBe("/x?y=2&a=1");
    expect(appendQueryString("/x", "")).toBe("/x");
  });
});
