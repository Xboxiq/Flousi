import { describe, expect, it } from "vitest";
import { CommissionCalculator, RepBalanceCalculator } from "./commission-calculator";
import type { CommissionSplitResult, SchemeResolutionInput } from "./commission-calculator";
import { ProfitCalculator } from "./profit-calculator";
import { makeCostBreakdown, type CostBreakdown } from "../entities/cost-breakdown";
import { Money } from "../value-objects/money";
import {
  defaultCommissionSchemeParams,
  toFixedAmountMinor,
  type CommissionKind,
  type CommissionScheme,
  type CommissionSchemeParams,
  type LossPolicy,
  type RoundingBeneficiary,
} from "../entities/commission-scheme";
import type { CommissionAssignment } from "../entities/commission-assignment";
import { lossPolicyApplied, ownerKeepsMinor, type CommissionSnapshot } from "../entities/commission-snapshot";
import { isArchivedRep, type Rep } from "../entities/rep";
import { needsCommissionScheme, type Sale } from "../entities/sale";
import type { Settlement } from "../entities/settlement";

const USD = "USD";
const AT = "2026-08-17T12:00:00.000Z";
const ISO = "2026-01-01T00:00:00.000Z";

interface Row {
  price: number;
  qty?: number;
  currency?: string;
  costs?: Partial<CostBreakdown>;
  scheme?: Partial<CommissionSchemeParams>;
}

function params(overrides: Partial<CommissionSchemeParams> = {}): CommissionSchemeParams {
  return { ...defaultCommissionSchemeParams(), ...overrides };
}

/**
 * Every row of the table goes through here, so the invariants that must hold on
 * EVERY row — exact reconciliation, integrality, positive zero — are asserted
 * once instead of being retyped 41 times and forgotten on row 30.
 */
function run(row: Row): CommissionSplitResult {
  const r = CommissionCalculator.split({
    unitPrice: row.price,
    quantity: row.qty ?? 1,
    currency: row.currency ?? USD,
    costs: makeCostBreakdown(row.costs ?? {}),
    params: params(row.scheme),
  });
  expect(r.repShare.minorUnits + r.ownerShare.minorUnits).toBe(r.basis.minorUnits);
  expect(Number.isInteger(r.repShare.minorUnits)).toBe(true);
  expect(Number.isInteger(r.ownerShare.minorUnits)).toBe(true);
  expect(Object.is(r.repShare.minorUnits, -0)).toBe(false);
  expect(Object.is(r.ownerShare.minorUnits, -0)).toBe(false);
  expect(Object.is(r.ownerKeeps.minorUnits, -0)).toBe(false);
  // Every figure the surface renders, not only the shares: a -0 basis printed as
  // «-0» claims a loss that did not happen.
  expect(Object.is(r.revenue.minorUnits, -0)).toBe(false);
  expect(Object.is(r.totalCost.minorUnits, -0)).toBe(false);
  expect(Object.is(r.netProfit.minorUnits, -0)).toBe(false);
  expect(Object.is(r.basis.minorUnits, -0)).toBe(false);
  return r;
}

function shares(r: CommissionSplitResult): [number, number] {
  return [r.repShare.minorUnits, r.ownerShare.minorUnits];
}

function purchase(fixed: number): Partial<CostBreakdown> {
  return { purchase: { fixed, percent: 0 } };
}

function scheme(
  id: string,
  repRatio: number,
  overrides: Partial<CommissionScheme> = {},
): CommissionScheme {
  return {
    id,
    name: `مخطط ${id}`,
    kind: "profitShare",
    repRatio,
    profitBasis: "netProfit",
    lossPolicy: "ownerOnly",
    roundingBeneficiary: "owner",
    status: "active",
    createdAt: ISO,
    updatedAt: ISO,
    ...overrides,
  };
}

function assignment(
  id: string,
  schemeId: string,
  keys: { productId?: string; repId?: string },
  overrides: Partial<CommissionAssignment> = {},
): CommissionAssignment {
  return {
    id,
    schemeId,
    ...keys,
    status: "active",
    createdAt: ISO,
    updatedAt: ISO,
    ...overrides,
  };
}

function rep(id = "rep-R1", name = "سامي", overrides: Partial<Rep> = {}): Rep {
  return { id, name, status: "active", createdAt: ISO, updatedAt: ISO, ...overrides };
}

function settlement(
  id: string,
  amountMinor: number,
  overrides: Partial<Settlement> = {},
): Settlement {
  return { id, repId: "rep-R1", amountMinor, currency: USD, paidAt: AT, ...overrides };
}

// ---------------------------------------------------------------------------
// A. The client's locked example — the anchor.
// ---------------------------------------------------------------------------

describe("CommissionCalculator — مثال العميل المُقرّ", () => {
  it("T01 مثال العميل الحرفي: تكلفة 10، بيع 20، حصة 50٪ ← 5 للمندوب و5 للتاجر", () => {
    for (const profitBasis of ["netProfit", "afterPurchaseCost"] as const) {
      const r = run({ price: 20, costs: purchase(10), scheme: { profitBasis } });
      // Purchase is the only cost, so the basis toggle is provably invisible in
      // the one example the merchant knows by heart.
      expect(shares(r)).toEqual([500, 500]);
      expect(r.basis.minorUnits).toBe(1000);
      expect(r.netProfit.minorUnits).toBe(1000);
      expect(r.revenue.minorUnits).toBe(2000);
      expect(r.lossApplied).toBe(false);
      expect(r.effectiveRepRatio).toBe(0.5);
    }
  });

  it("T02 الشحن على أساس صافي الربح: 8 مقسومة 4/4 — المندوب يشارك في الشحن", () => {
    const r = run({ price: 20, costs: { ...purchase(10), shipping: { fixed: 2, percent: 0 } } });
    expect(shares(r)).toEqual([400, 400]);
    expect(r.basis.minorUnits).toBe(800);
    expect(r.netProfit.minorUnits).toBe(800);
    expect(r.totalCost.minorUnits).toBe(1200);
    expect(r.ownerKeeps.minorUnits).toBe(400);
  });

  it("T03 الشحن على أساس ما بعد الشراء: 10 مقسومة 5/5 والشحن كله على التاجر", () => {
    const r = run({
      price: 20,
      costs: { ...purchase(10), shipping: { fixed: 2, percent: 0 } },
      scheme: { profitBasis: "afterPurchaseCost" },
    });
    expect(shares(r)).toEqual([500, 500]);
    expect(r.basis.minorUnits).toBe(1000);
    expect(r.netProfit.minorUnits).toBe(800);
    // Two owner figures: 500 is what the split contract says, 300 is what the
    // owner actually pocketed.
    expect(r.ownerKeeps.minorUnits).toBe(300);
  });
});

// ---------------------------------------------------------------------------
// B. Rounding — integer basis points, one crumb, named holder.
// ---------------------------------------------------------------------------

describe("CommissionCalculator — التقريب", () => {
  it("T04 puts the single odd fils on the named beneficiary's line, both ways", () => {
    const asOwner = run({ price: 20.01, costs: purchase(10) });
    const asRep = run({ price: 20.01, costs: purchase(10), scheme: { roundingBeneficiary: "rep" } });
    expect(asOwner.basis.minorUnits).toBe(1001);
    expect(shares(asOwner)).toEqual([500, 501]);
    expect(shares(asRep)).toEqual([501, 500]);
  });

  it("T05 never lets a float floor steal a fils that is exactly splittable", () => {
    // All three are exact in decimal. Math.floor(180*0.35)=62, (300*0.41)=122,
    // (100*0.29)=28 are binary artefacts, and each one is a real fils.
    const a = run({ price: 2, costs: purchase(0.2), scheme: { repRatio: 0.35 } });
    expect([a.basis.minorUnits, ...shares(a)]).toEqual([180, 63, 117]);
    const b = run({ price: 4, costs: purchase(1), scheme: { repRatio: 0.41 } });
    expect([b.basis.minorUnits, ...shares(b)]).toEqual([300, 123, 177]);
    const c = run({ price: 1.5, costs: purchase(0.5), scheme: { repRatio: 0.29 } });
    expect([c.basis.minorUnits, ...shares(c)]).toEqual([100, 29, 71]);
  });

  it("T06 never manufactures a crumb the basis does not contain", () => {
    // Math.ceil(100*0.55) = 56 invents a fils; roundingBeneficiary only ever
    // moves a crumb that already exists.
    const r = run({
      price: 1.5,
      costs: purchase(0.5),
      scheme: { repRatio: 0.55, roundingBeneficiary: "rep" },
    });
    expect(r.basis.minorUnits).toBe(100);
    expect(shares(r)).toEqual([55, 45]);
  });

  it("T07 splits the whole line once, not each unit", () => {
    // Per-unit-then-split would give 6/9: one transaction, one basis, one split.
    const r = run({ price: 0.35, qty: 3, costs: purchase(0.3) });
    expect(r.basis.minorUnits).toBe(15);
    expect(shares(r)).toEqual([7, 8]);
  });

  it("T08 keeps the crumb at one fils however large the quantity", () => {
    // Per-unit alternative gives 497/504 — a 3 fils drift on 7 units.
    const r = run({ price: 3, qty: 7, costs: purchase(1.57) });
    expect(r.basis.minorUnits).toBe(1001);
    expect(shares(r)).toEqual([500, 501]);
  });

  it("T09 rounds a percentage cost per unit against the sale price, then scales", () => {
    // unit purchase = round(1999 x 0.33) = 660, unit basis 1339 x 3 = 4017.
    // The whole-line alternative round(5997 x 0.33) = 1979 gives 4018 → 2009/2009.
    const r = run({
      price: 19.99,
      qty: 3,
      costs: { purchase: { fixed: 0, percent: 33 } },
      scheme: { profitBasis: "afterPurchaseCost" },
    });
    expect(r.basis.minorUnits).toBe(4017);
    expect(shares(r)).toEqual([2008, 2009]);
  });
});

// ---------------------------------------------------------------------------
// C. Kinds other than profitShare.
// ---------------------------------------------------------------------------

describe("CommissionCalculator — أنواع العمولة", () => {
  it("T10 returns a null effective ratio (not 0%, not NaN%) on a zero basis", () => {
    const r = run({
      price: 0,
      qty: 4,
      scheme: { kind: "percentOfPrice", priceRatio: 0.1, repRatio: undefined },
    });
    expect(r.basis.minorUnits).toBe(0);
    expect(Object.is(r.repShare.minorUnits, 0)).toBe(true);
    expect(Object.is(r.ownerShare.minorUnits, 0)).toBe(true);
    expect(r.effectiveRepRatio).toBeNull();
    expect(r.lossApplied).toBe(false);
  });

  it("T11 emits a giveaway that still cost money to ship as a signed loss", () => {
    const r = run({
      price: 0,
      costs: { shipping: { fixed: 1.5, percent: 0 } },
      scheme: { kind: "percentOfPrice", priceRatio: 0.1 },
    });
    expect(r.basis.minorUnits).toBe(-150);
    expect(shares(r)).toEqual([0, -150]);
    expect(r.lossApplied).toBe(true);
  });

  it("T12 caps a fixed fee at the basis under ownerOnly, so a commission cannot create a loss", () => {
    // «ownerOnly» means the rep does not carry the downside — therefore a fee
    // cannot manufacture one. The uncapped version put the owner at -200 while a
    // one-fils WORSE sale paid the rep nothing, so selling badly paid better.
    const r = run({
      price: 12,
      costs: purchase(9),
      scheme: { kind: "fixedPerUnit", fixedAmountMinor: 500 },
    });
    expect(r.basis.minorUnits).toBe(300);
    expect(shares(r)).toEqual([300, 0]);
    expect(r.lossApplied).toBe(false);
    // Reported, not hidden: the rep is owed less than the rule promises.
    expect(r.feeCapped).toBe(true);
  });

  it("T12b keeps the fee uncapped under shared, where the rep does carry the downside", () => {
    const r = run({
      price: 12,
      costs: purchase(9),
      scheme: { kind: "fixedPerUnit", fixedAmountMinor: 500, lossPolicy: "shared" },
    });
    expect(r.basis.minorUnits).toBe(300);
    expect(shares(r)).toEqual([500, -200]);
    expect(r.feeCapped).toBe(false);
  });

  it("T12c has no cliff at break-even: one fils of basis pays one fils, not the whole fee", () => {
    // The defect this replaces: at basis 0 the rep took the full 500 and the owner
    // went to -500, but at basis -1 the rep took 0 — a discontinuity that rewarded
    // the owner for selling worse. The cap makes the payout continuous.
    const atZero = run({ price: 12, costs: purchase(12), scheme: { kind: "fixedPerUnit", fixedAmountMinor: 500 } });
    expect(atZero.basis.minorUnits).toBe(0);
    expect(shares(atZero)).toEqual([0, 0]);

    const oneFils = run({ price: 12.01, costs: purchase(12), scheme: { kind: "fixedPerUnit", fixedAmountMinor: 500 } });
    expect(oneFils.basis.minorUnits).toBe(1);
    expect(shares(oneFils)).toEqual([1, 0]);

    const oneUnder = run({ price: 11.99, costs: purchase(12), scheme: { kind: "fixedPerUnit", fixedAmountMinor: 500 } });
    expect(oneUnder.basis.minorUnits).toBe(-1);
    expect(shares(oneUnder)).toEqual([0, -1]);
    expect(oneUnder.lossApplied).toBe(true);
  });

  it("T12d never lets a percentOfPrice fee push a profitable sale negative", () => {
    // 10% of a 20.00 price is 200, but the sale only made 100 of basis.
    const r = run({
      price: 20,
      costs: purchase(19),
      scheme: { kind: "percentOfPrice", priceRatio: 0.1 },
    });
    expect(r.basis.minorUnits).toBe(100);
    expect(shares(r)).toEqual([100, 0]);
    expect(r.feeCapped).toBe(true);
  });

  it("T13 normalises a sub-fils fee once at creation, so 13 x 8 = 104 not 100", () => {
    expect(toFixedAmountMinor(0.125)).toBe(13);
    const r = run({
      price: 1,
      qty: 8,
      costs: purchase(0.5),
      scheme: { kind: "fixedPerUnit", fixedAmountMinor: toFixedAmountMinor(0.125) },
    });
    expect(r.basis.minorUnits).toBe(400);
    expect(shares(r)).toEqual([104, 296]);
  });

  it("T14 rounds percentOfPrice per unit, then multiplies by quantity", () => {
    // per-unit: applyRatioMinor(1999, 0.1) = 199 (owner) / 200 (rep), x 3.
    // The whole-line alternative applyRatioMinor(5997, 0.1) = 599 is a different answer.
    const asOwner = run({
      price: 19.99,
      qty: 3,
      costs: purchase(10),
      scheme: { kind: "percentOfPrice", priceRatio: 0.1 },
    });
    const asRep = run({
      price: 19.99,
      qty: 3,
      costs: purchase(10),
      scheme: { kind: "percentOfPrice", priceRatio: 0.1, roundingBeneficiary: "rep" },
    });
    expect(asOwner.basis.minorUnits).toBe(2997);
    expect(shares(asOwner)).toEqual([597, 2400]);
    expect(shares(asRep)).toEqual([600, 2397]);
  });
});

// ---------------------------------------------------------------------------
// D. Loss policy and negative bases.
// ---------------------------------------------------------------------------

describe("CommissionCalculator — سياسة الخسارة", () => {
  it("T15 zeroes the rep on a losing sale under ownerOnly, with no debit", () => {
    const r = run({ price: 10, costs: purchase(15) });
    expect(r.basis.minorUnits).toBe(-500);
    expect(shares(r)).toEqual([0, -500]);
    expect(r.lossApplied).toBe(true);
    // A rep on no salary cannot fund the owner's buying mistake: the frozen
    // split leaves their balance at zero, with no debit line to unwind.
    const losing = CommissionCalculator.snapshot({
      sale: { unitPrice: 10, quantity: 1, currency: USD, repId: "rep-R1" },
      costs: makeCostBreakdown(purchase(15)),
      rep: rep("rep-R1"),
      resolution: { scheme: scheme("s-half", 0.5), tier: "accountDefault" },
      calculatedAt: AT,
    })!;
    expect(losing.repShareMinor).toBe(0);
    expect(RepBalanceCalculator.forRep("rep-R1", [losing], []).lines).toEqual([
      { currency: USD, earnedMinor: 0, settledMinor: 0, balanceMinor: 0 },
    ]);
  });

  it("T16 debits the rep on a losing sale under shared", () => {
    const r = run({ price: 10, costs: purchase(15), scheme: { lossPolicy: "shared" } });
    expect(shares(r)).toEqual([-250, -250]);
    // The policy did not clamp — the rep participated, so this is not lossApplied.
    expect(r.lossApplied).toBe(false);
  });

  it("T17 makes one ratio govern both directions", () => {
    const r = run({
      price: 10,
      costs: purchase(20),
      scheme: { lossPolicy: "shared", repRatio: 0.7 },
    });
    expect(r.basis.minorUnits).toBe(-1000);
    expect(shares(r)).toEqual([-700, -300]);
  });

  it("T18 puts the negative crumb on the named residual holder, both ways", () => {
    // The named party's line absorbs the unsplittable fils in BOTH signs; the
    // other party's share is the exact truncation toward zero.
    const a = run({ price: 1, costs: purchase(1.05), scheme: { lossPolicy: "shared" } });
    expect(a.basis.minorUnits).toBe(-5);
    expect(shares(a)).toEqual([-2, -3]);

    const b = run({
      price: 1,
      costs: purchase(1.05),
      scheme: { lossPolicy: "shared", roundingBeneficiary: "rep" },
    });
    expect(shares(b)).toEqual([-3, -2]);

    const c = run({ price: 1, costs: purchase(1.01), scheme: { lossPolicy: "shared" } });
    expect(c.basis.minorUnits).toBe(-1);
    expect(shares(c)).toEqual([0, -1]);
    expect(Object.is(c.repShare.minorUnits, 0)).toBe(true);

    const d = run({
      price: 1,
      costs: purchase(1.01),
      scheme: { lossPolicy: "shared", roundingBeneficiary: "rep" },
    });
    expect(shares(d)).toEqual([-1, 0]);
    expect(Object.is(d.ownerShare.minorUnits, 0)).toBe(true);

    const e = run({ price: 1, costs: purchase(1.05) });
    expect(shares(e)).toEqual([0, -5]);
    expect(Object.is(e.repShare.minorUnits, 0)).toBe(true);

    const f = run({ price: 9.99, costs: purchase(15), scheme: { lossPolicy: "shared" } });
    expect(f.basis.minorUnits).toBe(-501);
    expect(shares(f)).toEqual([-250, -251]);
    const fRep = run({
      price: 9.99,
      costs: purchase(15),
      scheme: { lossPolicy: "shared", roundingBeneficiary: "rep" },
    });
    expect(shares(fRep)).toEqual([-251, -250]);
  });

  it("T19 surfaces both owner figures when the purchase alone exceeds the price", () => {
    const r = run({
      price: 10,
      costs: { ...purchase(12), shipping: { fixed: 3, percent: 0 } },
      scheme: { profitBasis: "afterPurchaseCost" },
    });
    expect(r.basis.minorUnits).toBe(-200);
    expect(shares(r)).toEqual([0, -200]);
    expect(r.netProfit.minorUnits).toBe(-500);
    expect(r.ownerKeeps.minorUnits).toBe(-500);
  });

  it("T20 keeps shipping wholly the owner's even inside a shared loss", () => {
    const r = run({
      price: 10,
      costs: { ...purchase(12), shipping: { fixed: 3, percent: 0 } },
      scheme: { profitBasis: "afterPurchaseCost", lossPolicy: "shared" },
    });
    expect(r.basis.minorUnits).toBe(-200);
    expect(shares(r)).toEqual([-100, -100]);
    expect(r.netProfit.minorUnits).toBe(-500);
    expect(r.ownerKeeps.minorUnits).toBe(-400);
  });

  it("T21 evaluates lossPolicy on the CHOSEN basis, never on net profit", () => {
    const costs = { ...purchase(8), shipping: { fixed: 5, percent: 0 } };
    const r = run({ price: 10, costs, scheme: { profitBasis: "afterPurchaseCost" } });
    expect(r.basis.minorUnits).toBe(200);
    expect(shares(r)).toEqual([100, 100]);
    expect(r.netProfit.minorUnits).toBe(-300);
    expect(r.ownerKeeps.minorUnits).toBe(-400);
    expect(r.lossApplied).toBe(false);

    // Control: the same costs on a netProfit basis DO trigger the policy.
    const control = run({ price: 10, costs });
    expect(control.basis.minorUnits).toBe(-300);
    expect(shares(control)).toEqual([0, -300]);
    expect(control.lossApplied).toBe(true);
  });

  it("T22 applies ownerOnly to every kind, and leaves a shared fee standing", () => {
    const costs = { ...purchase(8), shipping: { fixed: 5, percent: 0 } };
    const cases: Array<[Partial<CommissionSchemeParams>, [number, number]]> = [
      [{ kind: "percentOfPrice", priceRatio: 0.1 }, [0, -300]],
      [{ kind: "percentOfPrice", priceRatio: 0.1, lossPolicy: "shared" }, [100, -400]],
      [{ kind: "fixedPerUnit", fixedAmountMinor: 500 }, [0, -300]],
      [{ kind: "fixedPerUnit", fixedAmountMinor: 500, lossPolicy: "shared" }, [500, -800]],
    ];
    for (const [delta, expected] of cases) {
      const r = run({ price: 10, costs, scheme: delta });
      expect(r.basis.minorUnits).toBe(-300);
      expect(shares(r)).toEqual(expected);
    }
  });

  it("T23 treats a break-even basis as neither profit nor loss, at positive zero", () => {
    for (const lossPolicy of ["shared", "ownerOnly"] as const) {
      const r = run({ price: 10, costs: purchase(10), scheme: { lossPolicy } });
      expect(r.basis.minorUnits).toBe(0);
      expect(shares(r)).toEqual([0, 0]);
      expect(r.lossApplied).toBe(false);
      expect(r.effectiveRepRatio).toBeNull();
    }
    // Math.trunc(-500 * 0) is -0: it slips past Money.equals but renders "−0.00".
    const zeroRatio = run({
      price: 10,
      costs: purchase(15),
      scheme: { repRatio: 0, lossPolicy: "shared" },
    });
    expect(zeroRatio.basis.minorUnits).toBe(-500);
    expect(shares(zeroRatio)).toEqual([0, -500]);
    expect(Object.is(zeroRatio.repShare.minorUnits, 0)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// E. Scheme resolution — most specific wins.
// ---------------------------------------------------------------------------

const P = "prod-P";
const Q = "prod-Q";
const R1 = "rep-R1";
const R2 = "rep-R2";

const S_PR = scheme("s-pr", 0.7);
const S_P = scheme("s-p", 0.6);
const S_R = scheme("s-r", 0.55);
const S_DEF = scheme("s-def", 0.5);
const A_PR = assignment("a-pr", "s-pr", { productId: P, repId: R1 });
const A_P = assignment("a-p", "s-p", { productId: P });
const A_R = assignment("a-r", "s-r", { repId: R1 });

/** Resolve, then freeze — the record-time pipeline the sale form runs. */
function record(
  input: Omit<SchemeResolutionInput, "productId" | "repId"> & {
    productId?: string;
    repId?: string;
  },
) {
  const resolution = CommissionCalculator.resolveScheme({
    productId: input.productId ?? P,
    repId: input.repId,
    assignments: input.assignments,
    schemes: input.schemes,
    accountDefaultSchemeId: input.accountDefaultSchemeId,
  });
  const sale: Sale = {
    id: "sale-1",
    productId: input.productId ?? P,
    quantity: 1,
    unitPrice: 20,
    currency: USD,
    soldAt: AT,
    repId: input.repId,
  };
  const snapshot = CommissionCalculator.snapshot({
    sale,
    costs: makeCostBreakdown(purchase(10)),
    rep: input.repId ? rep(input.repId) : null,
    resolution,
    calculatedAt: AT,
  });
  return { resolution, snapshot, sale: { ...sale, commissionSnapshot: snapshot } };
}

const ALL_SCHEMES = [S_PR, S_P, S_R, S_DEF];

describe("CommissionCalculator.resolveScheme — الأخصّ يفوز", () => {
  it("T24 lets product x rep beat every other tier", () => {
    const { resolution, snapshot } = record({
      repId: R1,
      assignments: [A_PR, A_P, A_R],
      schemes: ALL_SCHEMES,
      accountDefaultSchemeId: S_DEF.id,
    });
    expect(resolution.tier).toBe("productRep");
    expect(resolution.assignmentId).toBe(A_PR.id);
    expect(snapshot?.params.repRatio).toBe(0.7);
    expect(snapshot?.repShareMinor).toBe(700);
    expect(snapshot?.ownerShareMinor).toBe(300);
    expect(snapshot!.repShareMinor + snapshot!.ownerShareMinor).toBe(snapshot!.basisMinor);
  });

  it("T25 lets a product rule beat a rep-wide rate", () => {
    const { resolution, snapshot } = record({
      repId: R1,
      assignments: [A_P, A_R],
      schemes: ALL_SCHEMES,
      accountDefaultSchemeId: S_DEF.id,
    });
    expect(resolution.tier).toBe("product");
    expect(snapshot?.params.repRatio).toBe(0.6);
    expect([snapshot?.repShareMinor, snapshot?.ownerShareMinor]).toEqual([600, 400]);
  });

  it("T26 lets a rep rule beat the account default, to the exact fils", () => {
    const { resolution, snapshot } = record({
      repId: R1,
      assignments: [A_R],
      schemes: ALL_SCHEMES,
      accountDefaultSchemeId: S_DEF.id,
    });
    expect(resolution.tier).toBe("rep");
    expect(snapshot?.params.repRatio).toBe(0.55);
    expect(snapshot?.repShareMinor).toBe(550);
    expect(snapshot?.ownerShareMinor).toBe(450);
  });

  it("T27 terminates on the account default rather than erroring or zeroing", () => {
    const { resolution, snapshot } = record({
      repId: R1,
      assignments: [],
      schemes: ALL_SCHEMES,
      accountDefaultSchemeId: S_DEF.id,
    });
    expect(resolution.tier).toBe("accountDefault");
    expect(resolution.assignmentId).toBeUndefined();
    expect([snapshot?.repShareMinor, snapshot?.ownerShareMinor]).toEqual([500, 500]);
  });

  it("T28 matches identity, so a foreign product's 0.90 override is invisible", () => {
    const decoys = [
      assignment("d-qr2", "s-decoy-90", { productId: Q, repId: R2 }),
      assignment("d-q", "s-decoy-25", { productId: Q }),
      assignment("d-r2", "s-decoy-80", { repId: R2 }),
    ];
    const { resolution, snapshot } = record({
      repId: R1,
      assignments: [...decoys, A_R],
      schemes: [
        ...ALL_SCHEMES,
        scheme("s-decoy-90", 0.9),
        scheme("s-decoy-25", 0.25),
        scheme("s-decoy-80", 0.8),
      ],
      accountDefaultSchemeId: S_DEF.id,
    });
    expect(resolution.tier).toBe("rep");
    expect([snapshot?.repShareMinor, snapshot?.ownerShareMinor]).toEqual([550, 450]);
  });

  it("T29 falls through an archived scheme, an archived binding and a dangling id", () => {
    const expectProductTier = (input: Pick<SchemeResolutionInput, "assignments" | "schemes">) => {
      const { resolution, snapshot } = record({
        repId: R1,
        assignments: input.assignments,
        schemes: input.schemes,
        accountDefaultSchemeId: S_DEF.id,
      });
      expect(resolution.tier).toBe("product");
      expect([snapshot?.repShareMinor, snapshot?.ownerShareMinor]).toEqual([600, 400]);
    };

    // Archived scheme: the record stays readable for the history it already froze.
    expectProductTier({
      assignments: [A_PR, A_P, A_R],
      schemes: [scheme("s-pr", 0.7, { status: "archived" }), S_P, S_R, S_DEF],
    });
    // Archived assignment.
    expectProductTier({
      assignments: [{ ...A_PR, status: "archived" }, A_P, A_R],
      schemes: ALL_SCHEMES,
    });
    // Dangling schemeId: the scheme row is simply gone.
    expectProductTier({
      assignments: [assignment("a-dangling", "s-deleted", { productId: P, repId: R1 }), A_P, A_R],
      schemes: ALL_SCHEMES,
    });
  });

  it("T30 records the sale with no snapshot when no tier resolves — never a guess, never a throw", () => {
    for (const accountDefaultSchemeId of [undefined, "s-does-not-exist"]) {
      const { resolution, snapshot, sale } = record({
        repId: R1,
        assignments: [],
        schemes: ALL_SCHEMES,
        accountDefaultSchemeId,
      });
      expect(resolution).toEqual({ scheme: null, tier: "none" });
      expect(snapshot).toBeUndefined();
      // The sale is still real and still persisted; the state is repairable.
      expect(needsCommissionScheme(sale)).toBe(true);
      // The owner provisionally holds the whole net profit.
      expect(
        CommissionCalculator.basis({
          unitPrice: 20,
          quantity: 1,
          currency: USD,
          costs: makeCostBreakdown(purchase(10)),
          profitBasis: "netProfit",
        }).netProfit.minorUnits,
      ).toBe(1000);
    }
    // An archived account default is not a usable last resort either.
    const archived = record({
      repId: R1,
      assignments: [],
      schemes: [scheme("s-def", 0.5, { status: "archived" })],
      accountDefaultSchemeId: "s-def",
    });
    expect(archived.resolution.tier).toBe("none");
    expect(archived.snapshot).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// F. No rep, archived rep.
// ---------------------------------------------------------------------------

describe("CommissionCalculator — بلا مندوب / مندوب مؤرشف", () => {
  it("T31 creates no split at all for a sale the owner made directly", () => {
    const { resolution, snapshot, sale } = record({
      repId: undefined,
      assignments: [A_PR, A_P, A_R],
      schemes: ALL_SCHEMES,
      accountDefaultSchemeId: S_DEF.id,
    });
    expect(resolution).toEqual({ scheme: null, tier: "none" });
    expect(snapshot).toBeUndefined();
    expect(needsCommissionScheme(sale)).toBe(false);
    expect(RepBalanceCalculator.forRep(R1, [], []).lines).toEqual([]);
    // The sale still counts in revenue and profit: the owner keeps all 1000.
    const b = CommissionCalculator.basis({
      unitPrice: 20,
      quantity: 1,
      currency: USD,
      costs: makeCostBreakdown(purchase(10)),
      profitBasis: "netProfit",
    });
    expect([b.revenue.minorUnits, b.netProfit.minorUnits]).toEqual([2000, 1000]);
  });

  it("T32 never gates the math on an archived rep", () => {
    const before = record({
      repId: R1,
      assignments: [],
      schemes: [S_DEF],
      accountDefaultSchemeId: S_DEF.id,
    });
    expect([before.snapshot?.repShareMinor, before.snapshot?.ownerShareMinor]).toEqual([500, 500]);
    const frozenBytes = JSON.stringify(before.snapshot);

    const archivedRep = rep(R1, "سامي", { status: "archived" });
    expect(isArchivedRep(archivedRep)).toBe(true);

    // Existing split is byte-identical and still payable.
    expect(RepBalanceCalculator.forRep(R1, [before.snapshot!], []).lines).toEqual([
      { currency: USD, earnedMinor: 500, settledMinor: 0, balanceMinor: 500 },
    ]);

    // A back-dated sale against the archived rep computes, and throws nothing.
    const backDated = CommissionCalculator.snapshot({
      sale: { unitPrice: 20, quantity: 1, currency: USD, repId: R1 },
      costs: makeCostBreakdown(purchase(10)),
      rep: archivedRep,
      resolution: { scheme: S_DEF, tier: "accountDefault" },
      calculatedAt: AT,
    });
    expect([backDated?.repShareMinor, backDated?.ownerShareMinor]).toEqual([500, 500]);
    // The earlier split is byte-identical: nothing about archival touched it.
    expect(JSON.stringify(before.snapshot)).toBe(frozenBytes);
    expect(
      RepBalanceCalculator.forRep(R1, [before.snapshot!, backDated!], []).lines[0].balanceMinor,
    ).toBe(1000);
  });
});

// ---------------------------------------------------------------------------
// G. Snapshot immutability.
// ---------------------------------------------------------------------------

describe("CommissionCalculator.snapshot — التجميد", () => {
  it("T33 applies a ratio and basis edit to new sales only", () => {
    const before = scheme("s-1", 0.5);
    const costs = makeCostBreakdown({ ...purchase(10), shipping: { fixed: 2, percent: 0 } });
    const saleInput = { unitPrice: 20, quantity: 1, currency: USD, repId: R1 };

    const s1 = CommissionCalculator.snapshot({
      sale: saleInput,
      costs,
      rep: rep(R1),
      resolution: { scheme: before, tier: "accountDefault" },
      calculatedAt: AT,
    })!;
    expect([s1.repShareMinor, s1.ownerShareMinor]).toEqual([400, 400]);
    expect(s1.basisMinor).toBe(800);

    // The merchant edits the same scheme in place.
    const after = scheme("s-1", 0.6, {
      profitBasis: "afterPurchaseCost",
      updatedAt: "2026-08-18T00:00:00.000Z",
    });
    const s2 = CommissionCalculator.snapshot({
      sale: saleInput,
      costs,
      rep: rep(R1),
      resolution: { scheme: after, tier: "accountDefault" },
      calculatedAt: AT,
    })!;
    expect([s2.repShareMinor, s2.ownerShareMinor]).toEqual([600, 400]);
    expect(s2.basisMinor).toBe(1000);

    // Re-reading S1 never moves, however many edits follow.
    const reread = CommissionCalculator.fromSnapshot(s1);
    expect(reread.repShare.minorUnits).toBe(400);
    expect(s1.params.repRatio).toBe(0.5);
    expect(s1.params.profitBasis).toBe("netProfit");
    expect(RepBalanceCalculator.forRep(R1, [s1, s2], []).lines[0].balanceMinor).toBe(1000);
  });

  it("T34 never retro-debits a rep when lossPolicy is edited", () => {
    const costs = makeCostBreakdown(purchase(15));
    const saleInput = { unitPrice: 10, quantity: 1, currency: USD, repId: R1 };
    const s1 = CommissionCalculator.snapshot({
      sale: saleInput,
      costs,
      rep: rep(R1),
      resolution: { scheme: scheme("s-1", 0.5), tier: "accountDefault" },
      calculatedAt: AT,
    })!;
    expect([s1.repShareMinor, s1.ownerShareMinor]).toEqual([0, -500]);
    expect(lossPolicyApplied(s1)).toBe(true);

    const s2 = CommissionCalculator.snapshot({
      sale: saleInput,
      costs,
      rep: rep(R1),
      resolution: {
        scheme: scheme("s-1", 0.5, { lossPolicy: "shared" }),
        tier: "accountDefault",
      },
      calculatedAt: AT,
    })!;
    expect([s2.repShareMinor, s2.ownerShareMinor]).toEqual([-250, -250]);

    // S1 is untouched, so the edit alone moves the balance by exactly 0.
    expect(CommissionCalculator.fromSnapshot(s1).repShare.minorUnits).toBe(0);
    expect(RepBalanceCalculator.forRep(R1, [s1], []).lines[0].balanceMinor).toBe(0);
    expect(RepBalanceCalculator.forRep(R1, [s1, s2], []).lines[0].balanceMinor).toBe(-250);
  });

  it("T35 survives scheme deletion, cleared assignments and a changed account currency", () => {
    const iqdScheme = scheme("s-iqd", 0.5, { name: "المناصفة الافتراضية" });
    const s1 = CommissionCalculator.snapshot({
      sale: { unitPrice: 20000, quantity: 1, currency: "IQD", repId: R1 },
      costs: makeCostBreakdown(purchase(10000)),
      rep: rep(R1),
      resolution: { scheme: iqdScheme, tier: "accountDefault" },
      calculatedAt: AT,
    })!;
    expect([s1.repShareMinor, s1.ownerShareMinor]).toEqual([500_000, 500_000]);
    expect(s1.currency).toBe("IQD");

    // Hard-delete the scheme, clear the rep-tier binding, switch the account to USD.
    const afterDeletion = CommissionCalculator.resolveScheme({
      productId: P,
      repId: R1,
      assignments: [],
      schemes: [],
      accountDefaultSchemeId: undefined,
    });
    expect(afterDeletion).toEqual({ scheme: null, tier: "none" });

    const readback = CommissionCalculator.fromSnapshot(s1);
    expect(readback.repShare.minorUnits).toBe(500_000);
    expect(readback.ownerShare.minorUnits).toBe(500_000);
    expect(readback.repShare.currency).toBe("IQD");
    expect(readback.ownerShare.currency).toBe("IQD");
    // The label comes from the snapshot's own copy, not a lookup.
    expect(s1.schemeName).toBe("المناصفة الافتراضية");
    expect(s1.repName).toBe("سامي");
    // Any settlement against it defaults to the snapshot's own currency.
    expect(
      RepBalanceCalculator.forRep(R1, [s1], [settlement("t1", 100_000, { currency: "IQD" })])
        .lines,
    ).toEqual([{ currency: "IQD", earnedMinor: 500_000, settledMinor: 100_000, balanceMinor: 400_000 }]);
  });
});

// ---------------------------------------------------------------------------
// H. Balance and settlements.
// ---------------------------------------------------------------------------

function frozen(o: {
  repId?: string;
  currency?: string;
  price: number;
  purchaseFixed: number;
}): CommissionSnapshot {
  return CommissionCalculator.snapshot({
    sale: {
      unitPrice: o.price,
      quantity: 1,
      currency: o.currency ?? USD,
      repId: o.repId ?? R1,
    },
    costs: makeCostBreakdown(purchase(o.purchaseFixed)),
    rep: rep(o.repId ?? R1),
    resolution: { scheme: scheme("s-half", 0.5), tier: "accountDefault" },
    calculatedAt: AT,
  })!;
}

describe("RepBalanceCalculator — الرصيد مشتق دائماً", () => {
  it("T36 derives a running balance across partial settlements, order-independently", () => {
    const sale1 = frozen({ price: 20, purchaseFixed: 10 }); // rep 500
    const sale2 = frozen({ price: 18, purchaseFixed: 10 }); // basis 800, rep 400
    expect(sale1.repShareMinor).toBe(500);
    expect(sale2.basisMinor).toBe(800);
    expect(sale2.repShareMinor).toBe(400);
    const t1 = settlement("t1", 300);
    const t2 = settlement("t2", 600);

    const balanceAt = (snaps: CommissionSnapshot[], pays: Settlement[]) =>
      RepBalanceCalculator.forRep(R1, snaps, pays).lines[0].balanceMinor;

    expect(balanceAt([sale1], [])).toBe(500);
    expect(balanceAt([sale1], [t1])).toBe(200);
    expect(balanceAt([sale1, sale2], [t1])).toBe(600);
    expect(balanceAt([sale1, sale2], [t1, t2])).toBe(0);

    // Insertion order cannot change the totals.
    const shuffled = RepBalanceCalculator.forRep(R1, [sale2, sale1], [t2, t1]);
    expect(shuffled.lines).toEqual([
      { currency: USD, earnedMinor: 900, settledMinor: 900, balanceMinor: 0 },
    ]);
  });

  it("T37 carries an over-settlement forward instead of clamping it to zero", () => {
    const sale1 = frozen({ price: 20, purchaseFixed: 10 });
    const over = settlement("t-over", 800);
    expect(RepBalanceCalculator.forRep(R1, [sale1], [over]).lines[0].balanceMinor).toBe(-300);
    // Clamping would destroy 300 of the merchant's own cash on the next credit.
    const sale2 = frozen({ price: 20, purchaseFixed: 10 });
    expect(RepBalanceCalculator.forRep(R1, [sale1, sale2], [over]).lines[0].balanceMinor).toBe(200);
  });

  it("T38 reports one line per currency and never nets across them", () => {
    const usd = [
      frozen({ price: 20, purchaseFixed: 10 }),
      frozen({ price: 18, purchaseFixed: 10 }),
    ]; // 500 + 400 = 900 USD
    const eur = settlement("t-eur", 400, { currency: "EUR" });
    const balance = RepBalanceCalculator.forRep(R1, usd, [eur]);
    expect(balance.lines).toEqual([
      { currency: "EUR", earnedMinor: 0, settledMinor: 400, balanceMinor: -400 },
      { currency: USD, earnedMinor: 900, settledMinor: 0, balanceMinor: 900 },
    ]);
    // Explicitly NOT a single 500 USD line.
    expect(balance.lines).toHaveLength(2);
    expect(() =>
      Money.fromMinor(900, USD).subtract(Money.fromMinor(400, "EUR")),
    ).toThrow(/Currency mismatch/);
  });

  it("forAll returns one balance per rep, isolating each rep's ledger", () => {
    const mine = frozen({ price: 20, purchaseFixed: 10 });
    const theirs = frozen({ repId: R2, price: 20, purchaseFixed: 10 });
    const all = RepBalanceCalculator.forAll([R1, R2], [mine, theirs], [settlement("t1", 500)]);
    expect(all.map((b) => [b.repId, b.lines[0]?.balanceMinor ?? 0])).toEqual([
      [R1, 0],
      [R2, 500],
    ]);
  });
});

// ---------------------------------------------------------------------------
// I. Property test — the law itself.
// ---------------------------------------------------------------------------

const RATIOS = [0, 0.0001, 0.1234, 0.25, 0.3333, 0.5, 0.6667, 0.9999, 1.0];
const BENEFICIARIES: RoundingBeneficiary[] = ["owner", "rep"];
const KINDS: CommissionKind[] = ["profitShare", "fixedPerUnit", "percentOfPrice"];
const POLICIES: LossPolicy[] = ["shared", "ownerOnly"];
const QUANTITIES = [1, 3, 7, 100];

/**
 * Unit price is pinned at 5.00 and the purchase line is solved so the unit net
 * profit lands exactly on `unitBasis`. This addresses every basis in the sweep
 * through the real public API rather than a private hook.
 */
const COSTS_BY_UNIT_BASIS = new Map<number, CostBreakdown>();
for (let b = -500; b <= 500; b++) {
  COSTS_BY_UNIT_BASIS.set(b, makeCostBreakdown(purchase((500 - b) / 100)));
}

describe("CommissionCalculator — القانون (property)", () => {
  it(
    "T39 reconciles the two shares exactly across 432,432 combinations",
    () => {
      const failures: string[] = [];
      const note = (msg: string) => {
        if (failures.length < 8) failures.push(msg);
      };
      let combinations = 0;

      for (const kind of KINDS) {
        for (const lossPolicy of POLICIES) {
          for (const quantity of QUANTITIES) {
            for (const beneficiary of BENEFICIARIES) {
              for (const ratio of RATIOS) {
                for (let unitBasis = -500; unitBasis <= 500; unitBasis++) {
                  combinations++;
                  const r = CommissionCalculator.split({
                    unitPrice: 5,
                    quantity,
                    currency: USD,
                    costs: COSTS_BY_UNIT_BASIS.get(unitBasis)!,
                    params: {
                      kind,
                      repRatio: ratio,
                      priceRatio: ratio,
                      fixedAmountMinor: 13,
                      profitBasis: "netProfit",
                      lossPolicy,
                      roundingBeneficiary: beneficiary,
                    },
                  });
                  const repShare = r.repShare.minorUnits;
                  const ownerShare = r.ownerShare.minorUnits;
                  const basis = r.basis.minorUnits;
                  const at = `${kind}/${lossPolicy}/q${quantity}/${beneficiary}/r${ratio}/b${unitBasis}`;

                  if (basis !== unitBasis * quantity) note(`basis ${basis} at ${at}`);
                  if (repShare + ownerShare !== basis) {
                    note(`sum ${repShare}+${ownerShare} !== ${basis} at ${at}`);
                  }
                  if (!Number.isInteger(repShare) || !Number.isInteger(ownerShare)) {
                    note(`non-integer ${repShare}/${ownerShare} at ${at}`);
                  }
                  if (Object.is(repShare, -0) || Object.is(ownerShare, -0)) {
                    note(`negative zero at ${at}`);
                  }
                  if (kind === "profitShare" && !r.lossApplied) {
                    if (Math.abs(repShare - basis * ratio) >= 1) {
                      note(`drift ${repShare} vs ${basis * ratio} at ${at}`);
                    }
                    if (basis > 0 && (repShare < 0 || repShare > basis)) {
                      note(`out of range ${repShare} at ${at}`);
                    }
                    if (basis < 0 && (repShare > 0 || repShare < basis)) {
                      note(`out of range ${repShare} at ${at}`);
                    }
                  }
                }
              }
            }
          }
        }
      }

      expect(failures).toEqual([]);
      expect(combinations).toBe(432_432);
    },
    120_000,
  );

  it("T39 keeps the rep's share monotonic in repRatio, in the basis's own sign", () => {
    // Bases of +-999 and +-1001 straddle the crumb; lossPolicy is "shared" so a
    // negative basis is not clamped away before the comparison.
    for (const target of [999, 1001, -999, -1001]) {
      for (const beneficiary of BENEFICIARIES) {
        let previous = -Infinity;
        for (let bp = 0; bp <= 10_000; bp += 137) {
          const r = CommissionCalculator.split({
            unitPrice: 20,
            quantity: 1,
            currency: USD,
            costs: makeCostBreakdown(purchase((2000 - target) / 100)),
            params: params({
              repRatio: bp / 10_000,
              lossPolicy: "shared",
              roundingBeneficiary: beneficiary,
            }),
          });
          expect(r.basis.minorUnits).toBe(target);
          const signed = r.repShare.minorUnits * Math.sign(target);
          expect(signed).toBeGreaterThanOrEqual(previous);
          previous = signed;
        }
      }
    }
  });

  it("applyRatioMinor moves an existing crumb but never manufactures one", () => {
    for (const beneficiary of BENEFICIARIES) {
      // rem === 0: both beneficiaries must agree exactly.
      expect(CommissionCalculator.applyRatioMinor(100, 0.55, beneficiary)).toBe(55);
      expect(CommissionCalculator.applyRatioMinor(180, 0.35, beneficiary)).toBe(63);
      expect(CommissionCalculator.applyRatioMinor(0, 0.5, beneficiary)).toBe(0);
      // A corrupt ratio is 0, never NaN, and clamping keeps [0, 1].
      expect(CommissionCalculator.applyRatioMinor(1000, Number.NaN, beneficiary)).toBe(0);
      expect(CommissionCalculator.applyRatioMinor(1000, -5, beneficiary)).toBe(0);
      expect(CommissionCalculator.applyRatioMinor(1000, 9, beneficiary)).toBe(1000);
      expect(Object.is(CommissionCalculator.applyRatioMinor(-500, 0, beneficiary), 0)).toBe(true);
    }
    expect(CommissionCalculator.RATIO_SCALE).toBe(10_000);
  });

  it("keeps a share at POSITIVE zero where the tempting float shortcut yields -0", () => {
    // The hazard: Money does not normalise, and Money.equals cannot see the
    // difference — so a -0 reaches the screen as "−0.00", telling a rep they owe
    // a loss they do not owe.
    expect(Object.is(Money.fromMinor(-0, USD).minorUnits, -0)).toBe(true);
    expect(Money.fromMinor(-0, USD).equals(Money.zero(USD))).toBe(true);

    // `(num - rem) / RATIO_SCALE` yields +0 on exactly the inputs where
    // `Math.trunc(num / RATIO_SCALE)` yields -0. Both guards — the exact-integer
    // truncation and norm0 — must survive for these to read as positive zero.
    for (const [amountMinor, ratio] of [
      [-1, 0.5],
      [-500, 0],
      [-3, 0.25],
    ] as const) {
      const bp = Math.round(ratio * 10_000);
      expect(Object.is(Math.trunc((amountMinor * bp) / 10_000), -0)).toBe(true);
      expect(
        Object.is(CommissionCalculator.applyRatioMinor(amountMinor, ratio, "owner"), 0),
      ).toBe(true);
    }
    expect(CommissionCalculator.effectiveRepRatio(0, 0)).toBeNull();
    expect(CommissionCalculator.effectiveRepRatio(1000, 550)).toBe(0.55);
  });
});

// ---------------------------------------------------------------------------
// J. Regression guard.
// ---------------------------------------------------------------------------

describe("CommissionCalculator — حراسة الانحدار", () => {
  it("T40 agrees with ProfitCalculator to the fils, one rounding order", () => {
    const rows: Array<{ price: number; qty: number; costs: Partial<CostBreakdown> }> = [
      { price: 20, qty: 1, costs: purchase(10) },
      { price: 20, qty: 1, costs: { ...purchase(10), shipping: { fixed: 2, percent: 0 } } },
      { price: 19.99, qty: 3, costs: { purchase: { fixed: 0, percent: 33 } } },
      { price: 10, qty: 1, costs: { ...purchase(8), shipping: { fixed: 5, percent: 0 } } },
    ];
    for (const row of rows) {
      const costs = makeCostBreakdown(row.costs);
      const mine = CommissionCalculator.basis({
        unitPrice: row.price,
        quantity: row.qty,
        currency: USD,
        costs,
        profitBasis: "netProfit",
      });
      const theirs = ProfitCalculator.calculate({
        sellingPrice: row.price,
        costs,
        currency: USD,
        quantity: row.qty,
      });
      expect(mine.netProfit.minorUnits).toBe(
        Money.fromMajor(theirs.netProfit, USD).minorUnits,
      );
      expect(mine.revenue.minorUnits).toBe(Money.fromMajor(theirs.revenue, USD).minorUnits);
      expect(mine.totalCost.minorUnits).toBe(Money.fromMajor(theirs.totalCost, USD).minorUnits);
    }
  });

  it("T41 reads a frozen split back without recomputing anything", () => {
    const s1 = CommissionCalculator.snapshot({
      sale: { unitPrice: 20000, quantity: 1, currency: "IQD", repId: R1 },
      costs: makeCostBreakdown(purchase(10000)),
      rep: rep(R1),
      resolution: { scheme: scheme("s-iqd", 0.5), tier: "accountDefault" },
      calculatedAt: AT,
    })!;

    // Mutating the frozen params in a clone must change nothing on read-back.
    const tampered: CommissionSnapshot = {
      ...s1,
      schemeId: "s-that-no-longer-exists",
      params: { ...s1.params, repRatio: 0.9 },
    };
    const readback = CommissionCalculator.fromSnapshot(tampered);
    expect(readback.repShare.minorUnits).toBe(500_000);
    expect(readback.ownerShare.minorUnits).toBe(500_000);
    expect(readback.basis.minorUnits).toBe(1_000_000);
    expect(readback.netProfit.minorUnits).toBe(1_000_000);
    expect(readback.totalCost.minorUnits).toBe(1_000_000);
    expect(readback.ownerKeeps.minorUnits).toBe(500_000);
    expect(readback.effectiveRepRatio).toBe(0.5);
    expect(readback.lossApplied).toBe(false);
    expect(() => CommissionCalculator.fromSnapshot(tampered)).not.toThrow();
  });

  it("derives lossApplied and ownerKeeps from the snapshot rather than storing them", () => {
    const losing = CommissionCalculator.snapshot({
      sale: { unitPrice: 10, quantity: 1, currency: USD, repId: R1 },
      costs: makeCostBreakdown({ ...purchase(12), shipping: { fixed: 3, percent: 0 } }),
      rep: rep(R1),
      resolution: {
        scheme: scheme("s-apc", 0.5, { profitBasis: "afterPurchaseCost" }),
        tier: "accountDefault",
      },
      calculatedAt: AT,
    })!;
    expect(losing.basisMinor).toBe(-200);
    expect(losing.netProfitMinor).toBe(-500);
    expect(lossPolicyApplied(losing)).toBe(true);
    expect(ownerKeepsMinor(losing)).toBe(-500);
    expect(Object.is(ownerKeepsMinor({ ...losing, netProfitMinor: 0, repShareMinor: 0 }), 0)).toBe(
      true,
    );
    expect("lossApplied" in losing).toBe(false);
    expect("ownerKeeps" in losing).toBe(false);
    expect("effectiveRepRatio" in losing).toBe(false);
  });

  it("refuses to freeze a snapshot when the rep record does not match the sale", () => {
    const base = {
      costs: makeCostBreakdown(purchase(10)),
      resolution: { scheme: S_DEF, tier: "accountDefault" as const },
      calculatedAt: AT,
    };
    const sale = { unitPrice: 20, quantity: 1, currency: USD, repId: R1 };
    expect(CommissionCalculator.snapshot({ ...base, sale, rep: null })).toBeUndefined();
    expect(CommissionCalculator.snapshot({ ...base, sale, rep: rep(R2) })).toBeUndefined();
    expect(
      CommissionCalculator.snapshot({
        ...base,
        sale: { ...sale, repId: undefined },
        rep: rep(R1),
      }),
    ).toBeUndefined();
    expect(
      CommissionCalculator.snapshot({
        ...base,
        sale,
        rep: rep(R1),
        resolution: { scheme: null, tier: "none" },
      }),
    ).toBeUndefined();
  });
  it("T41 survives a corrupt fee: a non-finite fixedAmountMinor is owed to nobody", () => {
    // Math.max(0, NaN) is NaN and Math.max(0, Infinity) is Infinity, and
    // Money.fromMinor has no finiteness guard — so before the fix a hand-edited
    // backup could freeze an unreconcilable snapshot into permanent history.
    for (const corrupt of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      const r = run({
        price: 20,
        costs: purchase(10),
        scheme: { kind: "fixedPerUnit", fixedAmountMinor: corrupt },
      });
      expect(shares(r)).toEqual([0, 1000]);
    }
  });

  it("T42 resolves without throwing when storage holds a row missing its timestamps", () => {
    // The comparator exists because storage may hold duplicates at one tier — and
    // the same distrust applies to the timestamps themselves. An archived
    // malformed row must not reach the comparator at all.
    const malformed = {
      id: "a1",
      schemeId: "s1",
      repId: R1,
      status: "archived",
    } as unknown as CommissionAssignment;
    const good: CommissionAssignment = {
      id: "a2",
      schemeId: "s1",
      repId: R1,
      status: "active",
      createdAt: ISO,
      updatedAt: ISO,
    };
    const resolved = CommissionCalculator.resolveScheme({
      productId: P,
      repId: R1,
      assignments: [malformed, good],
      schemes: [scheme("s1", 0.5)],
    });
    expect(resolved.tier).toBe("rep");
    expect(resolved.scheme?.id).toBe("s1");
    expect(resolved.assignmentId).toBe("a2");
  });

  it("T43 keeps a tie deterministic when both timestamps are missing", () => {
    const rows = ["b", "a"].map(
      (id) =>
        ({ id, schemeId: "s1", repId: R1, status: "active" }) as unknown as CommissionAssignment,
    );
    const resolved = CommissionCalculator.resolveScheme({
      productId: P,
      repId: R1,
      assignments: rows,
      schemes: [scheme("s1", 0.5)],
    });
    expect(resolved.assignmentId).toBe("a");
  });

  it("T44 never returns a negative zero from a negative-zero price", () => {
    const r = run({ price: -0.001, scheme: { repRatio: 0.5 } });
    expect(r.revenue.minorUnits).toBe(0);
    expect(r.basis.minorUnits).toBe(0);
    expect(shares(r)).toEqual([0, 0]);
  });
  it("T45 pays a share that can actually change hands in a zero-decimal currency", () => {
    // IQD has no sub-unit in circulation: a rep is paid whole dinars. Money stores
    // every currency on a x100 scale, so a 50% share of an odd amount produced
    // «2,009,881.4 د.ع.» — a figure the app cannot even display and the merchant
    // cannot hand over. It also pre-filled the settlement input, making the
    // default payment unpayable.
    const r = run({
      price: 40197.63,
      currency: "IQD",
      costs: purchase(0),
      scheme: { repRatio: 0.5 },
    });
    expect(r.basis.minorUnits).toBe(4019763);
    // The rep's share is a whole dinar; the owner absorbs the residual, exactly as
    // roundingBeneficiary already governs the single-fils crumb.
    expect(r.repShare.minorUnits % 100).toBe(0);
    expect(r.repShare.minorUnits).toBe(2009800);
    expect(r.ownerShare.minorUnits).toBe(2009963);
    expect(r.repShare.minorUnits + r.ownerShare.minorUnits).toBe(r.basis.minorUnits);
  });

  it("T46 rounds the whole unit toward the rep when the rep holds the residual", () => {
    const r = run({
      price: 40197.63,
      currency: "IQD",
      costs: purchase(0),
      scheme: { repRatio: 0.5, roundingBeneficiary: "rep" },
    });
    expect(r.repShare.minorUnits).toBe(2009900);
    expect(r.repShare.minorUnits % 100).toBe(0);
    expect(r.repShare.minorUnits + r.ownerShare.minorUnits).toBe(r.basis.minorUnits);
  });

  it("T47 leaves a two-decimal currency at its own granularity", () => {
    // USD really does circulate cents, so nothing is snapped away.
    const r = run({ price: 20.01, costs: purchase(0), scheme: { repRatio: 0.5 } });
    expect(r.basis.minorUnits).toBe(2001);
    expect(shares(r)).toEqual([1000, 1001]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// P6 — the discount and the scheme's treatment of it (gate P6/G3).
// ─────────────────────────────────────────────────────────────────────────────

describe("CommissionCalculator — discountTreatment «خيار لكل طريقة عمولة»", () => {
  // One sale: 100 revenue, 60 purchase cost, 10 discount share. Half split.
  const base = {
    unitPrice: 100,
    quantity: 1,
    currency: USD,
    costs: makeCostBreakdown(purchase(60)),
    discount: 10,
  };

  it("afterDiscount (the default): the rep shares the cost of the offer", () => {
    const r = CommissionCalculator.split({
      ...base,
      params: params({ repRatio: 0.5, discountTreatment: "afterDiscount" }),
    });
    // basis = (100 − 10) − 60 = 30 → rep 15
    expect(r.revenue.amount).toBe(90);
    expect(r.basis.amount).toBe(30);
    expect(shares(r)).toEqual([1_500, 1_500]);
  });

  it("an absent treatment IS afterDiscount — the stored default from P4", () => {
    const r = CommissionCalculator.split({
      ...base,
      params: params({ repRatio: 0.5 }),
    });
    expect(r.basis.amount).toBe(30);
  });

  it("beforeDiscount: the merchant carries the offer alone", () => {
    const r = CommissionCalculator.split({
      ...base,
      params: params({ repRatio: 0.5, discountTreatment: "beforeDiscount" }),
    });
    // basis = 100 − 60 = 40 → rep 20, and the merchant's keep absorbs the 10
    expect(r.revenue.amount).toBe(100);
    expect(r.basis.amount).toBe(40);
    expect(shares(r)).toEqual([2_000, 2_000]);
  });

  it("the two treatments differ by exactly the rep's share of the discount", () => {
    const after = CommissionCalculator.split({
      ...base,
      params: params({ repRatio: 0.5, discountTreatment: "afterDiscount" }),
    });
    const before = CommissionCalculator.split({
      ...base,
      params: params({ repRatio: 0.5, discountTreatment: "beforeDiscount" }),
    });
    expect(before.repShare.amount - after.repShare.amount).toBe(5);
  });

  it("no discount: both treatments are the same split, byte for byte", () => {
    for (const discountTreatment of ["afterDiscount", "beforeDiscount"] as const) {
      const r = CommissionCalculator.split({
        ...base,
        discount: 0,
        params: params({ repRatio: 0.5, discountTreatment }),
      });
      expect(r.basis.amount).toBe(40);
      expect(shares(r)).toEqual([2_000, 2_000]);
    }
  });

  it("a discount deep enough to make the sale a loss meets the loss policy", () => {
    // (100 − 45) − 60 = −5: the offer turned the sale into a loss.
    const ownerOnly = CommissionCalculator.split({
      ...base,
      discount: 45,
      params: params({ repRatio: 0.5, lossPolicy: "ownerOnly" }),
    });
    expect(ownerOnly.basis.amount).toBe(-5);
    expect(ownerOnly.repShare.amount).toBe(0);
    expect(ownerOnly.lossApplied).toBe(true);
    const shared = CommissionCalculator.split({
      ...base,
      discount: 45,
      params: params({ repRatio: 0.5, lossPolicy: "shared" }),
    });
    expect(shared.repShare.amount).toBeLessThan(0);
  });

  it("a corrupt or negative discount is zero, never NaN and never a bonus", () => {
    for (const discount of [Number.NaN, -10, Number.POSITIVE_INFINITY]) {
      const r = CommissionCalculator.split({
        ...base,
        discount,
        params: params({ repRatio: 0.5 }),
      });
      expect(Number.isFinite(r.basis.amount)).toBe(true);
      // Treated as no discount at all: the undiscounted basis of 40.
      expect(r.basis.amount).toBe(40);
    }
  });

  it("the snapshot freezes the discounted figures, so history holds the offer", () => {
    const s = CommissionCalculator.snapshot({
      sale: { unitPrice: 100, quantity: 1, currency: USD, repId: "rep-R1", discount: 10 },
      costs: makeCostBreakdown(purchase(60)),
      rep: rep(),
      resolution: { scheme: scheme("half", 0.5), tier: "accountDefault" },
      calculatedAt: ISO,
    });
    expect(s?.revenueMinor).toBe(9_000);
    expect(s?.basisMinor).toBe(3_000);
    expect(s?.repShareMinor).toBe(1_500);
  });
});
