import { describe, it, expect } from "vitest";
import { TargetCalculator } from "./target-calculator";
import { targetScope, targetMonthKey, type Target } from "../entities/target";

let seq = 0;
function t(partial: Partial<Target> = {}): Target {
  seq += 1;
  return {
    id: `t${seq}`,
    metric: "netProfit",
    amount: 1_000_000,
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...partial,
  };
}

const AUG = "2026-08";

describe("targetScope", () => {
  it("reads repId first, then productId, then falls to the account", () => {
    expect(targetScope({ repId: "r1" })).toBe("rep");
    expect(targetScope({ productId: "p1" })).toBe("product");
    expect(targetScope({})).toBe("account");
    // Both ids is not a combination this product can create; it resolves as the
    // rep's rather than inventing a rung nothing can set.
    expect(targetScope({ repId: "r1", productId: "p1" })).toBe("rep");
  });

  it("targetMonthKey takes yyyy-mm off an ISO timestamp", () => {
    expect(targetMonthKey("2026-08-18T22:31:00.000Z")).toBe("2026-08");
  });
});

describe("TargetCalculator.resolve — الأخصّ يفوز", () => {
  it("G2a returns nothing when the store is empty", () => {
    const r = TargetCalculator.resolve([], { metric: "netProfit", month: AUG });
    expect(r).toEqual({ target: null, scope: null, fromOverride: false });
  });

  it("G2b an account standing target answers when nothing narrower exists", () => {
    const acc = t({ amount: 5_000_000 });
    const r = TargetCalculator.resolve([acc], { metric: "netProfit", month: AUG, repId: "r1" });
    expect(r.target?.id).toBe(acc.id);
    expect(r.scope).toBe("account");
    expect(r.fromOverride).toBe(false);
  });

  it("G2c a rep standing target outranks the account's", () => {
    const acc = t({ amount: 5_000_000 });
    const rep = t({ amount: 900_000, repId: "r1" });
    const r = TargetCalculator.resolve([acc, rep], {
      metric: "netProfit",
      month: AUG,
      repId: "r1",
    });
    expect(r.target?.id).toBe(rep.id);
    expect(r.scope).toBe("rep");
  });

  it("G2d another rep's target never answers for this rep", () => {
    const other = t({ amount: 900_000, repId: "r2" });
    const acc = t({ amount: 5_000_000 });
    const r = TargetCalculator.resolve([other, acc], {
      metric: "netProfit",
      month: AUG,
      repId: "r1",
    });
    expect(r.target?.id).toBe(acc.id);
  });

  it("G2e a month override outranks a standing row at the SAME scope", () => {
    const standing = t({ amount: 900_000, repId: "r1" });
    const override = t({ amount: 400_000, repId: "r1", month: AUG });
    const r = TargetCalculator.resolve([standing, override], {
      metric: "netProfit",
      month: AUG,
      repId: "r1",
    });
    expect(r.target?.id).toBe(override.id);
    expect(r.fromOverride).toBe(true);
  });

  it("G2f a month override outranks a NARROWER standing row — month is the stronger axis", () => {
    // Deliberate and documented: «هدف هذا الشهر» is a decision the merchant made
    // about this month specifically, so it beats a standing rep figure set once.
    const repStanding = t({ amount: 900_000, repId: "r1" });
    const accountThisMonth = t({ amount: 300_000, month: AUG });
    const r = TargetCalculator.resolve([repStanding, accountThisMonth], {
      metric: "netProfit",
      month: AUG,
      repId: "r1",
    });
    expect(r.target?.id).toBe(accountThisMonth.id);
    expect(r.scope).toBe("account");
    expect(r.fromOverride).toBe(true);
  });

  it("G2g an override for a DIFFERENT month is ignored", () => {
    const july = t({ amount: 100, month: "2026-07" });
    const standing = t({ amount: 5_000_000 });
    const r = TargetCalculator.resolve([july, standing], { metric: "netProfit", month: AUG });
    expect(r.target?.id).toBe(standing.id);
  });

  it("G2h a different metric is ignored", () => {
    const revenue = t({ amount: 99, metric: "revenue" });
    const r = TargetCalculator.resolve([revenue], { metric: "netProfit", month: AUG });
    expect(r.target).toBeNull();
    const r2 = TargetCalculator.resolve([revenue], { metric: "revenue", month: AUG });
    expect(r2.target?.id).toBe(revenue.id);
  });

  it("G2i an archived target never answers", () => {
    const archived = t({ amount: 400_000, repId: "r1", status: "archived" });
    const acc = t({ amount: 5_000_000 });
    const r = TargetCalculator.resolve([archived, acc], {
      metric: "netProfit",
      month: AUG,
      repId: "r1",
    });
    expect(r.target?.id).toBe(acc.id);
  });

  it("G2j a rep target is invisible to an account-level read", () => {
    const rep = t({ amount: 900_000, repId: "r1" });
    const r = TargetCalculator.resolve([rep], { metric: "netProfit", month: AUG });
    expect(r.target).toBeNull();
  });

  it("G2k duplicates at one rung: the most recently updated wins", () => {
    const older = t({ amount: 1, repId: "r1", updatedAt: "2026-05-01T00:00:00.000Z" });
    const newer = t({ amount: 2, repId: "r1", updatedAt: "2026-07-01T00:00:00.000Z" });
    const r = TargetCalculator.resolve([older, newer], {
      metric: "netProfit",
      month: AUG,
      repId: "r1",
    });
    expect(r.target?.amount).toBe(2);
  });

  it("G2l storage missing updatedAt does not throw — it is the duplicate case the sort exists for", () => {
    const a = { ...t({ amount: 1, repId: "r1" }), updatedAt: undefined } as unknown as Target;
    const b = { ...t({ amount: 2, repId: "r1" }), updatedAt: undefined } as unknown as Target;
    expect(() =>
      TargetCalculator.resolve([a, b], { metric: "netProfit", month: AUG, repId: "r1" }),
    ).not.toThrow();
    // and it is deterministic: the id breaks the tie, so two reads agree
    const first = TargetCalculator.resolve([a, b], { metric: "netProfit", month: AUG, repId: "r1" });
    const second = TargetCalculator.resolve([b, a], { metric: "netProfit", month: AUG, repId: "r1" });
    expect(first.target?.id).toBe(second.target?.id);
  });

  it("G2m resolving does not mutate the caller's array order", () => {
    const a = t({ repId: "r1", updatedAt: "2026-01-01T00:00:00.000Z" });
    const b = t({ repId: "r1", updatedAt: "2026-09-01T00:00:00.000Z" });
    const list = [a, b];
    TargetCalculator.resolve(list, { metric: "netProfit", month: AUG, repId: "r1" });
    expect(list[0]).toBe(a);
  });
});

describe("TargetCalculator.progress — لا هدف حالة حقيقية", () => {
  it("G3a no target: hasTarget false, and no division by zero anywhere", () => {
    const p = TargetCalculator.progress({
      target: null,
      actual: 6_312_000,
      month: AUG,
      asOf: "2026-08-18T00:00:00.000Z",
    });
    expect(p.hasTarget).toBe(false);
    expect(p.targetAmount).toBe(0);
    expect(p.attainment).toBe(0);
    expect(p.remaining).toBe(0);
    expect(p.surplus).toBe(0);
    expect(p.met).toBe(false);
    expect(p.pace).toBe(0);
    // «لا هدف» is not «متأخر»: a merchant with no target set is not behind one.
    expect(p.onPace).toBe(true);
    expect(Number.isFinite(p.attainment)).toBe(true);
    expect(Number.isFinite(p.pace)).toBe(true);
  });

  it("G3b a target of zero is the same state as no target", () => {
    const p = TargetCalculator.progress({
      target: t({ amount: 0 }),
      actual: 500,
      month: AUG,
      asOf: "2026-08-18T00:00:00.000Z",
    });
    expect(p.hasTarget).toBe(false);
    expect(p.attainment).toBe(0);
  });

  it("G3c a non-finite stored amount cannot produce NaN attainment", () => {
    const bad = { ...t(), amount: Number.NaN } as Target;
    const p = TargetCalculator.progress({
      target: bad,
      actual: 500,
      month: AUG,
      asOf: "2026-08-18T00:00:00.000Z",
    });
    expect(p.hasTarget).toBe(false);
    expect(Number.isNaN(p.attainment)).toBe(false);
  });

  it("G3d a non-finite actual is read as zero rather than poisoning the reading", () => {
    const p = TargetCalculator.progress({
      target: t({ amount: 1000 }),
      actual: Number.POSITIVE_INFINITY,
      month: AUG,
      asOf: "2026-08-18T00:00:00.000Z",
    });
    expect(p.actual).toBe(0);
    expect(p.attainment).toBe(0);
  });

  it("G8 major units: 6,312,000 against a 5,000,000 target reads as 126%", () => {
    const p = TargetCalculator.progress({
      target: t({ amount: 5_000_000 }),
      actual: 6_312_000,
      month: AUG,
      asOf: "2026-08-31T00:00:00.000Z",
    });
    expect(p.attainment).toBeCloseTo(1.2624, 4);
    expect(p.met).toBe(true);
    expect(p.remaining).toBe(0);
    expect(p.surplus).toBe(1_312_000);
  });

  it("G4a behind: 45% attained with 58% of the month gone", () => {
    const p = TargetCalculator.progress({
      target: t({ amount: 1_000_000 }),
      actual: 450_000,
      month: AUG, // August has 31 days
      asOf: "2026-08-18T12:00:00.000Z", // 18/31
    });
    expect(p.attainment).toBeCloseTo(0.45, 6);
    expect(p.elapsed).toBeCloseTo(18 / 31, 6);
    expect(p.pace).toBeLessThan(1);
    expect(p.onPace).toBe(false);
    expect(p.remaining).toBe(550_000);
  });

  it("G4b ahead: the same 45% on the 10th day is on pace", () => {
    const p = TargetCalculator.progress({
      target: t({ amount: 1_000_000 }),
      actual: 450_000,
      month: AUG,
      asOf: "2026-08-10T00:00:00.000Z",
    });
    expect(p.pace).toBeGreaterThan(1);
    expect(p.onPace).toBe(true);
  });

  it("G4c a month already past is fully elapsed, so it reads as a final result", () => {
    const p = TargetCalculator.progress({
      target: t({ amount: 1_000_000 }),
      actual: 900_000,
      month: "2026-07",
      asOf: "2026-08-18T00:00:00.000Z",
    });
    expect(p.elapsed).toBe(1);
    expect(p.pace).toBeCloseTo(0.9, 6);
    expect(p.onPace).toBe(false);
    expect(p.met).toBe(false);
  });

  it("G4d a month not yet begun is 0% elapsed and not behind", () => {
    const p = TargetCalculator.progress({
      target: t({ amount: 1_000_000 }),
      actual: 0,
      month: "2026-09",
      asOf: "2026-08-18T00:00:00.000Z",
    });
    expect(p.elapsed).toBe(0);
    expect(p.pace).toBe(1);
    expect(p.onPace).toBe(true);
    expect(Number.isFinite(p.pace)).toBe(true);
  });

  it("G4e February's length is February's, not thirty-one days", () => {
    const feb = TargetCalculator.progress({
      target: t({ amount: 100 }),
      actual: 0,
      month: "2026-02",
      asOf: "2026-02-28T00:00:00.000Z",
    });
    expect(feb.elapsed).toBe(1); // 28/28
    const leap = TargetCalculator.progress({
      target: t({ amount: 100 }),
      actual: 0,
      month: "2028-02",
      asOf: "2028-02-28T00:00:00.000Z",
    });
    expect(leap.elapsed).toBeCloseTo(28 / 29, 6);
  });

  it("G4f a losing month against a target: attainment is negative, nothing is clamped to a lie", () => {
    const p = TargetCalculator.progress({
      target: t({ amount: 1_000_000 }),
      actual: -250_000,
      month: AUG,
      asOf: "2026-08-31T00:00:00.000Z",
    });
    expect(p.attainment).toBeCloseTo(-0.25, 6);
    expect(p.met).toBe(false);
    // The whole target is still ahead of him, plus the hole he is in.
    expect(p.remaining).toBe(1_250_000);
    expect(p.surplus).toBe(0);
    expect(p.onPace).toBe(false);
  });

  it("exactly on target is met, with no remainder and no surplus", () => {
    const p = TargetCalculator.progress({
      target: t({ amount: 1_000_000 }),
      actual: 1_000_000,
      month: AUG,
      asOf: "2026-08-31T00:00:00.000Z",
    });
    expect(p.met).toBe(true);
    expect(p.remaining).toBe(0);
    expect(p.surplus).toBe(0);
    expect(p.attainment).toBe(1);
  });
});
