import { describe, expect, it } from "vitest";
import { computeLedger, computeSettlements } from "./ledger";
import {
  CommissionCalculator,
  makeCostBreakdown,
  type AccountingPeriod,
  type CommissionScheme,
  type Product,
  type Rep,
  type Sale,
  type Settlement,
} from "@/domain";

const IQD = "IQD";

function product(o: Partial<Product> = {}): Product {
  return {
    id: "P1",
    name: "منتج",
    sellingPrice: 100,
    currency: IQD,
    status: "active",
    costs: makeCostBreakdown({ purchase: { fixed: 60, percent: 0 } }),
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...o,
  };
}
function rep(o: Partial<Rep> = {}): Rep {
  return {
    id: "R1",
    name: "سارة",
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...o,
  };
}
function sale(o: Partial<Sale> = {}): Sale {
  return {
    id: "S1",
    productId: "P1",
    quantity: 1,
    unitPrice: 100,
    currency: IQD,
    soldAt: "2026-08-05T00:00:00.000Z",
    ...o,
  };
}
function settlement(o: Partial<Settlement> = {}): Settlement {
  return {
    id: "T1",
    repId: "R1",
    amountMinor: 2_000,
    currency: IQD,
    paidAt: "2026-08-10T00:00:00.000Z",
    ...o,
  };
}
function scheme(o: Partial<CommissionScheme> = {}): CommissionScheme {
  return {
    id: "half",
    name: "المناصفة",
    kind: "profitShare",
    repRatio: 0.5,
    profitBasis: "netProfit",
    lossPolicy: "ownerOnly",
    roundingBeneficiary: "owner",
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...o,
  };
}
/** Freezes a split exactly as the app does at record time. */
function frozen(s: Sale, p = product(), sc = scheme(), r = rep()): Sale {
  const snapshot = CommissionCalculator.snapshot({
    sale: s,
    costs: p.costs,
    rep: r,
    resolution: { scheme: sc, tier: "accountDefault" },
    calculatedAt: s.soldAt,
  });
  if (!snapshot) throw new Error("fixture failed to freeze");
  return { ...s, commissionSnapshot: snapshot };
}
function period(o: Partial<AccountingPeriod> = {}): AccountingPeriod {
  return {
    id: "PR1",
    label: "تموز 2026",
    startDate: "2026-07-01T00:00:00.000Z",
    status: "closed",
    endDate: "2026-07-31T23:59:59.000Z",
    ...o,
  };
}

describe("computeSettlements — «منو دفع»", () => {
  it("an empty store reports nothing, with no undefined totals", () => {
    const v = computeSettlements({ settlements: [], reps: [], sales: [], periods: [] });
    expect(v.rows).toEqual([]);
    expect(v.totals).toEqual([]);
    expect(v.count).toBe(0);
    expect(v.lastPaidAt).toBeUndefined();
  });

  it("newest payment first, with the rep's name joined and the amount in major units", () => {
    const v = computeSettlements({
      settlements: [
        settlement({ id: "old", paidAt: "2026-08-01T00:00:00.000Z", amountMinor: 1_000 }),
        settlement({ id: "new", paidAt: "2026-08-20T00:00:00.000Z", amountMinor: 5_000 }),
      ],
      reps: [rep()],
      sales: [],
      periods: [],
    });
    expect(v.rows.map((r) => r.settlement.id)).toEqual(["new", "old"]);
    expect(v.rows[0].repName).toBe("سارة");
    expect(v.rows[0].amount).toBe(50); // 5,000 minor / 100
    expect(v.lastPaidAt).toBe("2026-08-20T00:00:00.000Z");
  });

  it("a payment whose rep row is gone is still reported — the money still left", () => {
    const v = computeSettlements({
      settlements: [settlement({ repId: "GONE" })],
      reps: [rep()],
      sales: [],
      periods: [],
    });
    expect(v.rows).toHaveLength(1);
    expect(v.rows[0].repName).toBe("مندوب محذوف");
  });

  it("an archived rep is flagged, not hidden", () => {
    const v = computeSettlements({
      settlements: [settlement()],
      reps: [rep({ status: "archived" })],
      sales: [],
      periods: [],
    });
    expect(v.rows[0].repArchived).toBe(true);
  });

  it("joins the period label when the payment names one", () => {
    const v = computeSettlements({
      settlements: [settlement({ periodId: "PR1" })],
      reps: [rep()],
      sales: [],
      periods: [period()],
    });
    expect(v.rows[0].periodLabel).toBe("تموز 2026");
  });

  it("outstanding is earned minus paid, from the FROZEN splits", () => {
    // one sale: 100 revenue − 60 cost = 40 profit → rep half = 20 major = 2,000 minor
    const v = computeSettlements({
      settlements: [settlement({ amountMinor: 500 })],
      reps: [rep()],
      sales: [frozen(sale({ repId: "R1" }))],
      periods: [],
    });
    const iqd = v.totals.find((t) => t.currency === IQD);
    expect(iqd?.earned).toBe(20);
    expect(iqd?.paid).toBe(5);
    expect(iqd?.outstanding).toBe(15);
    expect(iqd?.count).toBe(1);
  });

  it("paid ahead of what was earned reads as a negative outstanding, never clamped", () => {
    const v = computeSettlements({
      settlements: [settlement({ amountMinor: 5_000 })],
      reps: [rep()],
      sales: [frozen(sale({ repId: "R1" }))],
      periods: [],
    });
    expect(v.totals[0].outstanding).toBe(-30); // 20 earned − 50 paid
  });

  it("G5 two currencies stay two lines and are NEVER summed", () => {
    const v = computeSettlements({
      settlements: [
        settlement({ id: "a", currency: "IQD", amountMinor: 100_000 }),
        settlement({ id: "b", currency: "USD", amountMinor: 4_000 }),
      ],
      reps: [rep()],
      sales: [],
      periods: [],
    });
    expect(v.totals).toHaveLength(2);
    expect(v.totals.map((t) => t.currency)).toEqual(["IQD", "USD"]);
    expect(v.totals.find((t) => t.currency === "IQD")?.paid).toBe(1_000);
    expect(v.totals.find((t) => t.currency === "USD")?.paid).toBe(40);
    // there is no combined figure anywhere on the view
    expect(v).not.toHaveProperty("totalPaid");
  });

  it("a currency that was only ever earned still gets its own line", () => {
    const v = computeSettlements({
      settlements: [],
      reps: [rep()],
      sales: [frozen(sale({ repId: "R1", currency: "USD" }), product({ currency: "USD" }))],
      periods: [],
    });
    expect(v.totals).toHaveLength(1);
    expect(v.totals[0].currency).toBe("USD");
    expect(v.totals[0].paid).toBe(0);
    expect(v.totals[0].outstanding).toBe(20);
  });

  it("does not mutate the settlements array it is given", () => {
    const list = [
      settlement({ id: "old", paidAt: "2026-08-01T00:00:00.000Z" }),
      settlement({ id: "new", paidAt: "2026-08-20T00:00:00.000Z" }),
    ];
    computeSettlements({ settlements: list, reps: [rep()], sales: [], periods: [] });
    expect(list.map((s) => s.id)).toEqual(["old", "new"]);
  });
});

describe("computeLedger — «شنو صار»", () => {
  const base = {
    sales: [] as Sale[],
    settlements: [] as Settlement[],
    periods: [] as AccountingPeriod[],
    products: [product()],
    reps: [rep()],
    currency: IQD,
  };

  it("an empty store is an empty log, not a crash", () => {
    const v = computeLedger(base);
    expect(v.rows).toEqual([]);
    expect(v.total).toBe(0);
    expect(v.counts).toEqual({ sale: 0, settlement: 0, periodClose: 0 });
  });

  it("G6 interleaves the three kinds strictly by when they happened", () => {
    const v = computeLedger({
      ...base,
      sales: [sale({ id: "s", soldAt: "2026-08-05T00:00:00.000Z" })],
      settlements: [settlement({ id: "t", paidAt: "2026-08-10T00:00:00.000Z" })],
      periods: [period({ endDate: "2026-07-31T00:00:00.000Z" })],
    });
    expect(v.rows.map((r) => r.kind)).toEqual(["settlement", "sale", "periodClose"]);
    expect(v.total).toBe(3);
    expect(v.counts).toEqual({ sale: 1, settlement: 1, periodClose: 1 });
  });

  it("direction is per kind: a sale is in, a payment is out, a close moves nothing", () => {
    const v = computeLedger({
      ...base,
      sales: [sale()],
      settlements: [settlement()],
      periods: [period()],
    });
    const byKind = new Map(v.rows.map((r) => [r.kind, r.direction]));
    expect(byKind.get("sale")).toBe("in");
    expect(byKind.get("settlement")).toBe("out");
    expect(byKind.get("periodClose")).toBe("none");
  });

  it("amounts are always positive — the direction carries the sign", () => {
    const v = computeLedger({ ...base, settlements: [settlement({ amountMinor: 5_000 })] });
    expect(v.rows[0].amount).toBe(50);
    expect(v.rows.every((r) => r.amount >= 0)).toBe(true);
  });

  it("a sale carries revenue with profit as the quieter second figure", () => {
    const v = computeLedger({ ...base, sales: [sale()] });
    expect(v.rows[0].amount).toBe(100);
    expect(v.rows[0].secondary).toBe(40);
  });

  it("an open period is not a close and never appears", () => {
    const v = computeLedger({
      ...base,
      periods: [period({ status: "open", endDate: undefined })],
    });
    expect(v.rows).toHaveLength(0);
  });

  it("a closed period with no endDate cannot be placed in time, so it is left out", () => {
    const v = computeLedger({ ...base, periods: [period({ endDate: undefined })] });
    expect(v.rows).toHaveLength(0);
  });

  it("G7 limit windows the rows but total and counts report the whole log", () => {
    const sales = Array.from({ length: 40 }, (_, i) =>
      sale({ id: `s${i}`, soldAt: `2026-08-${String((i % 28) + 1).padStart(2, "0")}T00:00:00.000Z` }),
    );
    const v = computeLedger({ ...base, sales, limit: 12 });
    expect(v.rows).toHaveLength(12);
    expect(v.total).toBe(40);
    expect(v.counts.sale).toBe(40);
  });

  it("kind filters the rows, and total follows the filter while counts do not", () => {
    const v = computeLedger({
      ...base,
      sales: [sale()],
      settlements: [settlement(), settlement({ id: "T2" })],
      kind: "settlement",
    });
    expect(v.rows.every((r) => r.kind === "settlement")).toBe(true);
    expect(v.total).toBe(2);
    expect(v.counts).toEqual({ sale: 1, settlement: 2, periodClose: 0 });
  });

  it("a sale of a deleted product is still logged, named for what is missing", () => {
    const v = computeLedger({ ...base, sales: [sale({ productId: "GONE" })] });
    expect(v.rows).toHaveLength(1);
    expect(v.rows[0].title).toBe("منتج محذوف");
    expect(v.rows[0].amount).toBe(0);
    expect(v.rows[0].href).toBeUndefined();
  });

  it("a payment whose rep is gone is logged with no dead link", () => {
    const v = computeLedger({ ...base, settlements: [settlement({ repId: "GONE" })] });
    expect(v.rows[0].title).toBe("مندوب محذوف");
    expect(v.rows[0].href).toBeUndefined();
  });

  it("ids are unique across kinds so two events never collide as one row key", () => {
    const v = computeLedger({
      ...base,
      sales: [sale({ id: "X" })],
      settlements: [settlement({ id: "X" })],
    });
    expect(new Set(v.rows.map((r) => r.id)).size).toBe(2);
  });

  it("a settlement keeps ITS OWN currency, not the account's", () => {
    const v = computeLedger({ ...base, settlements: [settlement({ currency: "USD", amountMinor: 500 })] });
    expect(v.rows[0].currency).toBe("USD");
    expect(v.rows[0].amount).toBe(5);
  });

  it("does not mutate the arrays it is given", () => {
    const sales = [sale({ id: "a", soldAt: "2026-08-01T00:00:00.000Z" }), sale({ id: "b", soldAt: "2026-08-09T00:00:00.000Z" })];
    computeLedger({ ...base, sales });
    expect(sales.map((s) => s.id)).toEqual(["a", "b"]);
  });
});

describe("scoping to one rep (gate P3/G3)", () => {
  const products = [product()];
  const reps = [rep(), rep({ id: "R2", name: "علي" })];
  const sales = [
    frozen(sale({ id: "mine", repId: "R1" })),
    frozen(sale({ id: "theirs", repId: "R2" }), product(), scheme(), rep({ id: "R2", name: "علي" })),
    sale({ id: "houseSale" }), // no rep: the store's own
  ];
  const settlements = [
    settlement({ id: "toMe", repId: "R1", amountMinor: 1_000 }),
    settlement({ id: "toThem", repId: "R2", amountMinor: 9_000 }),
  ];
  const periods = [period()];

  it("the ledger returns only that rep's sales and payments", () => {
    const v = computeLedger({
      sales,
      settlements,
      periods,
      products,
      reps,
      currency: IQD,
      scope: { repId: "R1" },
    });
    expect(v.rows.map((r) => r.id).sort()).toEqual(["sale:mine", "settlement:toMe"]);
    // and the COUNTS follow the scope, because they are printed on the screen
    expect(v.counts).toEqual({ sale: 1, settlement: 1, periodClose: 0 });
    expect(v.total).toBe(2);
  });

  it("a period close never appears in a scoped log — it is the store's event", () => {
    const v = computeLedger({
      sales: [],
      settlements: [],
      periods,
      products,
      reps,
      currency: IQD,
      scope: { repId: "R1" },
    });
    expect(v.rows).toHaveLength(0);
    expect(v.counts.periodClose).toBe(0);
    // unscoped, the same period IS reported
    expect(
      computeLedger({ sales: [], settlements: [], periods, products, reps, currency: IQD }).counts
        .periodClose,
    ).toBe(1);
  });

  it('scope "none" yields nothing at all rather than everything', () => {
    const v = computeLedger({
      sales,
      settlements,
      periods,
      products,
      reps,
      currency: IQD,
      scope: "none",
    });
    expect(v.rows).toHaveLength(0);
    expect(v.total).toBe(0);
    expect(v.counts).toEqual({ sale: 0, settlement: 0, periodClose: 0 });
  });

  it("an unscoped read still sees everything, including the house sale", () => {
    const v = computeLedger({ sales, settlements, periods, products, reps, currency: IQD });
    expect(v.counts).toEqual({ sale: 3, settlement: 2, periodClose: 1 });
  });

  it("settlement TOTALS are the rep's own, not the store's with rows hidden", () => {
    const mine = computeSettlements({ settlements, reps, sales, periods, scope: { repId: "R1" } });
    expect(mine.rows.map((r) => r.settlement.id)).toEqual(["toMe"]);
    expect(mine.count).toBe(1);
    const line = mine.totals.find((t) => t.currency === IQD);
    // R1 earned 20 (half of 40 profit) and was paid 10
    expect(line?.earned).toBe(20);
    expect(line?.paid).toBe(10);
    expect(line?.outstanding).toBe(10);

    // the unscoped view is visibly larger — proof the scope is doing the filtering
    const all = computeSettlements({ settlements, reps, sales, periods });
    expect(all.count).toBe(2);
    expect(all.totals.find((t) => t.currency === IQD)?.earned).toBe(40);
  });

  it('settlements under scope "none" report no payments and no earnings', () => {
    const v = computeSettlements({ settlements, reps, sales, periods, scope: "none" });
    expect(v.rows).toHaveLength(0);
    expect(v.totals).toEqual([]);
  });
});

describe("withholding costs from the ledger (gate P3/G4)", () => {
  const products = [product()];
  const reps = [rep()];
  const withSnapshot = [frozen(sale({ id: "s1", repId: "R1" }))];

  it("by default a sale carries its NET PROFIT", () => {
    const v = computeLedger({
      sales: withSnapshot,
      settlements: [],
      periods: [],
      products,
      reps,
      currency: IQD,
    });
    expect(v.rows[0].secondary).toBe(40);
    expect(v.rows[0].secondaryKind).toBe("profit");
  });

  it("costs:false replaces the profit with the rep's OWN frozen share", () => {
    const v = computeLedger({
      sales: withSnapshot,
      settlements: [],
      periods: [],
      products,
      reps,
      currency: IQD,
      costs: false,
    });
    // 100 revenue − 60 cost = 40 profit; the rep's half is 20
    expect(v.rows[0].amount).toBe(100);
    expect(v.rows[0].secondary).toBe(20);
    expect(v.rows[0].secondaryKind).toBe("repShare");
    // and the profit is nowhere on the row, so revenue − secondary cannot recover cost
    expect(v.rows[0].secondary).not.toBe(40);
  });

  it("costs:false on a sale with NO snapshot attaches nothing at all", () => {
    const v = computeLedger({
      sales: [sale({ id: "bare" })],
      settlements: [],
      periods: [],
      products,
      reps,
      currency: IQD,
      costs: false,
    });
    expect(v.rows[0].secondary).toBeUndefined();
    expect(v.rows[0].secondaryKind).toBeUndefined();
    // revenue alone reveals nothing about what it cost
    expect(v.rows[0].amount).toBe(100);
  });

  it("a settlement is unaffected: a payment is not a cost", () => {
    const v = computeLedger({
      sales: [],
      settlements: [settlement({ amountMinor: 5_000 })],
      periods: [],
      products,
      reps,
      currency: IQD,
      costs: false,
    });
    expect(v.rows[0].amount).toBe(50);
    expect(v.rows[0].secondary).toBeUndefined();
  });
});
