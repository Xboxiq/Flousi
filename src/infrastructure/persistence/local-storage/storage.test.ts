import { beforeEach, describe, expect, it } from "vitest";
import { migrateLegacyNamespace, storage } from "./storage";

/**
 * The read door, against the shapes a corrupt store actually holds.
 *
 * Every case here was found by DRIVING the app with a mangled `localStorage` (the P10
 * sweep), and every one of them used to reach a read model and crash it — which in a
 * local-first app means a blank screen on every route, including the one that would
 * let the merchant export or reset. One bad value bricked the app unrecoverably.
 */
describe("storage.get — an unusable value reads as absent (P10)", () => {
  beforeEach(() => window.localStorage.clear());

  const put = (raw: string) => window.localStorage.setItem("ritm:probe", raw);

  it("a list expected, an OBJECT stored: the fallback, not a crash downstream", () => {
    put('{"a":1}');
    expect(storage.get<number[]>("probe", [])).toEqual([]);
  });

  it("a list expected, NULL stored", () => {
    put("null");
    expect(storage.get<number[]>("probe", [])).toEqual([]);
  });

  it("a list expected, a bare number or string stored", () => {
    put("42");
    expect(storage.get<number[]>("probe", [])).toEqual([]);
    put('"hello"');
    expect(storage.get<number[]>("probe", [])).toEqual([]);
  });

  it("an object expected, a LIST stored", () => {
    put("[1,2,3]");
    expect(storage.get("probe", { currency: "IQD" })).toEqual({ currency: "IQD" });
  });

  it("an object expected, null stored", () => {
    put("null");
    expect(storage.get("probe", { currency: "IQD" })).toEqual({ currency: "IQD" });
  });

  it("invalid JSON, which already worked, still works", () => {
    put("{not json");
    expect(storage.get<number[]>("probe", [])).toEqual([]);
  });

  it("a matching shape passes through untouched", () => {
    put('[{"id":"a"},{"id":"b"}]');
    expect(storage.get<{ id: string }[]>("probe", [])).toEqual([{ id: "a" }, { id: "b" }]);
    put('{"currency":"USD"}');
    expect(storage.get("probe", { currency: "IQD" })).toEqual({ currency: "USD" });
  });

  it("a null fallback declares NO expectation, so anything passes", () => {
    // `get<number | null>(k, null)` is a caller saying "hand me what is there".
    // Judging that against `typeof null` rejected every valid schema-version stamp.
    put("1");
    expect(storage.get<number | null>("probe", null)).toBe(1);
    put('{"anything":true}');
    expect(storage.get<unknown>("probe", null)).toEqual({ anything: true });
  });

  it("an unusable value is LEFT in storage, never deleted", () => {
    // A merchant's only copy of their data is not ours to drop on a hunch, and a
    // later version that understands the shape can still recover it.
    put('{"a":1}');
    storage.get<number[]>("probe", []);
    expect(window.localStorage.getItem("ritm:probe")).toBe('{"a":1}');
  });

  it("an absent key is the fallback, and writing then reading round-trips", () => {
    expect(storage.get<number[]>("probe", [])).toEqual([]);
    storage.set("probe", [1, 2]);
    expect(storage.get<number[]>("probe", [])).toEqual([1, 2]);
  });
});

/**
 * The rename to رِتم moved the key namespace from «flousi:» to «ritm:».
 *
 * This app has no server, so these keys are a merchant's ONLY copy of their trading
 * history. A rename that dropped them would not corrupt anything — it would do
 * something quieter and worse: every screen would come up empty and perfectly
 * correct-looking, as though the shop had never traded. These cases are the proof
 * that it does not.
 */
describe("migrateLegacyNamespace — a rename may not cost a merchant their data", () => {
  beforeEach(() => window.localStorage.clear());

  const legacy = (k: string, v: unknown) =>
    window.localStorage.setItem(`flousi:${k}`, JSON.stringify(v));
  const current = (k: string) => window.localStorage.getItem(`ritm:${k}`);

  it("carries every old key forward, readable through the normal door", () => {
    legacy("sales", [{ id: "s1" }]);
    legacy("schema-version", 1);

    expect(migrateLegacyNamespace()).toBe(2);
    expect(storage.get<Array<{ id: string }>>("sales", [])).toEqual([{ id: "s1" }]);
    expect(storage.get<number | null>("schema-version", null)).toBe(1);
  });

  it("COPIES rather than moves, so an older build still finds its data", () => {
    legacy("sales", [{ id: "s1" }]);
    migrateLegacyNamespace();
    expect(window.localStorage.getItem("flousi:sales")).toBe('[{"id":"s1"}]');
  });

  it("never overwrites a value already written under the new namespace", () => {
    legacy("sales", [{ id: "old" }]);
    window.localStorage.setItem("ritm:sales", JSON.stringify([{ id: "new" }]));

    expect(migrateLegacyNamespace()).toBe(0);
    expect(current("sales")).toBe('[{"id":"new"}]');
  });

  it("is safe to run twice: the second pass copies nothing", () => {
    legacy("sales", [{ id: "s1" }]);
    expect(migrateLegacyNamespace()).toBe(1);
    expect(migrateLegacyNamespace()).toBe(0);
  });

  it("leaves keys that belong to other apps alone", () => {
    window.localStorage.setItem("someone-else:sales", "[]");
    expect(migrateLegacyNamespace()).toBe(0);
    expect(current("sales")).toBeNull();
  });
});
