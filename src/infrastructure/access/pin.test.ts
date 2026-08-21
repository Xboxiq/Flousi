import { describe, expect, it } from "vitest";
import { hashPin, verifyPin } from "./pin";

const NOW = "2026-08-19T00:00:00.000Z";

describe("PIN storage (gate P3/G8)", () => {
  it("G8 the stored record contains no trace of the digits", async () => {
    const pin = "482915";
    const record = await hashPin(pin, NOW);
    const serialised = JSON.stringify(record);
    expect(serialised).not.toContain(pin);
    // and not any run of it either
    for (let i = 0; i + 3 <= pin.length; i += 1) {
      expect(serialised.includes(pin.slice(i, i + 3))).toBe(false);
    }
    expect(record.hash).toHaveLength(64);
    expect(record.salt).toHaveLength(32);
  });

  it("verifies the right PIN and rejects a wrong one", async () => {
    const record = await hashPin("1234", NOW);
    expect(await verifyPin(record, "1234")).toBe(true);
    expect(await verifyPin(record, "1235")).toBe(false);
    expect(await verifyPin(record, "")).toBe(false);
    expect(await verifyPin(record, "12345")).toBe(false);
  });

  it("the same PIN hashed twice differs, because the salt is per install", async () => {
    const a = await hashPin("1234", NOW);
    const b = await hashPin("1234", NOW);
    expect(a.salt).not.toBe(b.salt);
    expect(a.hash).not.toBe(b.hash);
    expect(await verifyPin(a, "1234")).toBe(true);
    expect(await verifyPin(b, "1234")).toBe(true);
  });

  it("no PIN set means the way back is unconditional, not blocked", async () => {
    expect(await verifyPin(null, "")).toBe(true);
    expect(await verifyPin(null, "anything")).toBe(true);
  });

  it("a half-written record is treated as no PIN rather than as a locked door", async () => {
    expect(await verifyPin({ hash: "", salt: "abc", updatedAt: NOW }, "1")).toBe(true);
    expect(await verifyPin({ hash: "abc", salt: "", updatedAt: NOW }, "1")).toBe(true);
  });

  it("handles a non-ASCII PIN without mangling it", async () => {
    const record = await hashPin("٤٨٢٩", NOW);
    expect(await verifyPin(record, "٤٨٢٩")).toBe(true);
    expect(await verifyPin(record, "4829")).toBe(false);
  });
});
