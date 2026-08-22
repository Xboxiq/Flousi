import { describe, expect, it } from "vitest";
import {
  computeRepAggregates,
  computeRepTrends,
  computeSaleCommissions,
  computeTeamCommissions,
  frozenSnapshots,
  repMomentum,
  resolveSaleCommission,
  toMajor,
  type CommissionInput,
} from "./commissions";
import {
  CommissionCalculator,
  makeCostBreakdown,
  type CommissionAssignment,
  type CommissionScheme,
  type CommissionSnapshot,
  type Order,
  type Product,
  type Rep,
  type Sale,
  type Settlement,
} from "@/domain";

const CURRENCY = "USD";

function product(overrides: Partial<Product> = {}): Product {
  return {
    id: "P",
    name: "منتج تجريبي",
    sellingPrice: 20,
    currency: CURRENCY,
    status: "active",
    costs: makeCostBreakdown({ purchase: { fixed: 10, percent: 0 } }),
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function rep(overrides: Partial<Rep> = {}): Rep {
  return {
    id: "R1",
    name: "سعد",
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function scheme(overrides: Partial<CommissionScheme> = {}): CommissionScheme {
  return {
    id: "half",
    name: "المناصفة الافتراضية",
    kind: "profitShare",
    repRatio: 0.5,
    profitBasis: "netProfit",
    lossPolicy: "ownerOnly",
    roundingBeneficiary: "owner",
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function sale(overrides: Partial<Sale> = {}): Sale {
  return {
    id: "S1",
    productId: "P",
    quantity: 1,
    unitPrice: 20,
    currency: CURRENCY,
    soldAt: "2026-06-10T12:00:00.000Z",
    ...overrides,
  };
}

function settlement(overrides: Partial<Settlement> = {}): Settlement {
  return {
    id: "T1",
    repId: "R1",
    amountMinor: 300,
    currency: CURRENCY,
    paidAt: "2026-06-11T12:00:00.000Z",
    ...overrides,
  };
}

/** Freezes a split exactly as the app does at record time. */
function frozen(s: Sale, p: Product, sc: CommissionScheme, r: Rep): Sale {
  const snapshot = CommissionCalculator.snapshot({
    sale: s,
    costs: p.costs,
    rep: r,
    resolution: { scheme: sc, tier: "accountDefault" },
    calculatedAt: s.soldAt,
  });
  if (!snapshot) throw new Error("fixture failed to freeze a snapshot");
  return { ...s, commissionSnapshot: snapshot };
}

function input(overrides: Partial<CommissionInput> = {}): CommissionInput {
  return {
    sales: [],
    products: [product()],
    reps: [rep()],
    schemes: [scheme()],
    assignments: [],
    settlements: [],
    defaultCommissionSchemeId: "half",
    ...overrides,
  };
}

describe("resolveSaleCommission", () => {
  it("credits nobody when the sale has no rep", () => {
    expect(resolveSaleCommission(sale(), input())).toBeNull();
  });

  it("resolves live and splits through the account default when nothing is frozen", () => {
    const row = resolveSaleCommission(sale({ repId: "R1" }), input());
    expect(row).not.toBeNull();
    expect(row?.frozen).toBe(false);
    expect(row?.needsScheme).toBe(true);
    expect(row?.schemeTier).toBe("accountDefault");
    expect(row?.revenueMinor).toBe(2000);
    expect(row?.netProfitMinor).toBe(1000);
    expect(row?.basisMinor).toBe(1000);
    expect(row?.repShareMinor).toBe(500);
    expect(row?.ownerShareMinor).toBe(500);
    expect(row?.effectiveRepRatio).toBeCloseTo(0.5, 5);
  });

  it("prefers the most specific tier on a live resolve", () => {
    const rich = scheme({ id: "rich", name: "حصة المنتج", repRatio: 0.7 });
    const assignment: CommissionAssignment = {
      id: "A1",
      schemeId: "rich",
      productId: "P",
      status: "active",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    const row = resolveSaleCommission(
      sale({ repId: "R1" }),
      input({ schemes: [scheme(), rich], assignments: [assignment] }),
    );
    expect(row?.schemeTier).toBe("product");
    expect(row?.schemeId).toBe("rich");
    expect(row?.repShareMinor).toBe(700);
    expect(row?.ownerShareMinor).toBe(300);
  });

  it("leaves the whole net profit with the owner when no rule resolves at any tier", () => {
    const row = resolveSaleCommission(
      sale({ repId: "R1" }),
      input({ defaultCommissionSchemeId: undefined }),
    );
    expect(row?.schemeTier).toBe("none");
    expect(row?.schemeId).toBeUndefined();
    expect(row?.needsScheme).toBe(true);
    expect(row?.repShareMinor).toBe(0);
    expect(row?.ownerShareMinor).toBe(1000);
    expect(row?.ownerKeepsMinor).toBe(1000);
    // Not 0%: with no rule the realised ratio is undefined, so the surface dashes it.
    expect(row?.effectiveRepRatio).toBeNull();
  });

  it("reads a frozen snapshot instead of recomputing it", () => {
    const s = frozen(sale({ repId: "R1" }), product(), scheme(), rep());
    // The merchant then edits the very scheme the sale froze.
    const edited = scheme({ repRatio: 0.9, profitBasis: "afterPurchaseCost" });
    const row = resolveSaleCommission(s, input({ sales: [s], schemes: [edited] }));
    expect(row?.frozen).toBe(true);
    expect(row?.needsScheme).toBe(false);
    expect(row?.repShareMinor).toBe(500);
    expect(row?.ownerShareMinor).toBe(500);
    expect(row?.schemeTier).toBe("accountDefault");
  });

  it("keeps a frozen row readable after the scheme and the rep record are gone", () => {
    const s = frozen(sale({ repId: "R1" }), product(), scheme(), rep());
    const row = resolveSaleCommission(
      s,
      input({ sales: [s], schemes: [], reps: [], defaultCommissionSchemeId: undefined }),
    );
    expect(row?.repShareMinor).toBe(500);
    expect(row?.repName).toBe("سعد");
    expect(row?.schemeName).toBe("المناصفة الافتراضية");
  });

  it("reports zeros rather than an uncosted revenue when the product is gone", () => {
    const row = resolveSaleCommission(sale({ repId: "R1" }), input({ products: [] }));
    expect(row?.revenueMinor).toBe(0);
    expect(row?.repShareMinor).toBe(0);
    expect(row?.effectiveRepRatio).toBeNull();
  });

  it("surfaces a loss with the rep shielded and the owner carrying it", () => {
    const thin = product({ costs: makeCostBreakdown({ purchase: { fixed: 25, percent: 0 } }) });
    const row = resolveSaleCommission(sale({ repId: "R1" }), input({ products: [thin] }));
    expect(row?.basisMinor).toBe(-500);
    expect(row?.repShareMinor).toBe(0);
    expect(row?.ownerShareMinor).toBe(-500);
    expect(row?.lossApplied).toBe(true);
  });
});

describe("computeSaleCommissions", () => {
  it("omits sales with no rep and orders the ledger newest first", () => {
    const ownerSold = sale({ id: "S0" });
    const older = sale({ id: "S1", repId: "R1", soldAt: "2026-04-10T12:00:00.000Z" });
    const newer = sale({ id: "S2", repId: "R1", soldAt: "2026-06-10T12:00:00.000Z" });
    const rows = computeSaleCommissions(input({ sales: [older, ownerSold, newer] }));
    expect(rows.map((r) => r.sale.id)).toEqual(["S2", "S1"]);
  });
});

describe("computeRepAggregates", () => {
  const q = product({ id: "Q", name: "منتج ثانٍ", sellingPrice: 18 });
  const r1 = rep();
  const r2 = rep({ id: "R2", name: "ليث" });
  const s1 = frozen(sale({ id: "S1", repId: "R1" }), product(), scheme(), r1);
  const s2 = frozen(
    sale({ id: "S2", productId: "Q", unitPrice: 18, repId: "R1", soldAt: "2026-06-20T12:00:00.000Z" }),
    q,
    scheme(),
    r1,
  );
  const s3 = frozen(
    sale({ id: "S3", repId: "R2", quantity: 2, soldAt: "2026-06-05T12:00:00.000Z" }),
    product(),
    scheme(),
    r2,
  );
  const team = input({
    sales: [s1, s2, s3],
    products: [product(), q],
    reps: [r1, r2],
  });

  it("totals units, revenue, profit and both shares per rep", () => {
    const row = computeRepAggregates(team).find((a) => a.repId === "R1");
    expect(row?.saleCount).toBe(2);
    expect(row?.units).toBe(2);
    expect(row?.revenueMinor).toBe(3800);
    expect(row?.netProfitMinor).toBe(1800);
    expect(row?.repShareMinor).toBe(900);
    expect(row?.ownerShareMinor).toBe(900);
    expect(row?.lastSaleAt).toBe("2026-06-20T12:00:00.000Z");
    expect(row?.needsSchemeCount).toBe(0);
  });

  it("counts a multi-unit sale's units, not its rows", () => {
    const second = computeRepAggregates(team).find((a) => a.repId === "R2");
    // qty 2 at 20.00 with a 10.00 purchase: basis 2000, split 1000/1000.
    expect(second?.units).toBe(2);
    expect(second?.saleCount).toBe(1);
    expect(second?.repShareMinor).toBe(1000);
  });

  it("ranks the best earner first", () => {
    const ranked = computeRepAggregates(team);
    expect(ranked.map((a) => a.repId)).toEqual(["R2", "R1"]);
    expect(ranked.map((a) => a.rank)).toEqual([1, 2]);
  });

  it("lists a rep with no sales at all rather than hiding them", () => {
    const idle = rep({ id: "R9", name: "نور" });
    const aggregates = computeRepAggregates(input({ reps: [rep(), idle] }));
    const row = aggregates.find((a) => a.repId === "R9");
    expect(row?.saleCount).toBe(0);
    expect(row?.repShareMinor).toBe(0);
    expect(row?.balanceMinor).toBe(0);
    expect(row?.lastSaleAt).toBeNull();
  });

  it("keeps an archived rep payable and in the aggregates", () => {
    const retired = rep({ id: "R3", name: "نور", status: "archived" });
    const s = frozen(sale({ id: "S9", repId: "R3" }), product(), scheme(), retired);
    const row = computeRepAggregates(
      input({ sales: [s], reps: [rep(), retired] }),
    ).find((a) => a.repId === "R3");
    expect(row?.status).toBe("archived");
    expect(row?.repShareMinor).toBe(500);
    expect(row?.balanceMinor).toBe(500);
  });

  it("keeps a repId that survives only in history", () => {
    const ghost = rep({ id: "RX", name: "قديم" });
    const s = frozen(sale({ id: "SX", repId: "RX" }), product(), scheme(), ghost);
    const row = computeRepAggregates(input({ sales: [s], reps: [] })).find((a) => a.repId === "RX");
    expect(row?.repName).toBe("قديم");
    expect(row?.balanceMinor).toBe(500);
  });
});

describe("balance derivation", () => {
  const q = product({ id: "Q", name: "منتج ثانٍ", sellingPrice: 18 });
  const r1 = rep();

  function balanceOf(sales: Sale[], settlements: Settlement[]): number {
    const [row] = computeRepAggregates(
      input({ sales, settlements, products: [product(), q], reps: [r1] }),
    );
    return row.balanceMinor;
  }

  it("stays derived and correct across an interleaved sale/settlement sequence", () => {
    // t0 sale 1 → frozen rep share 500
    const s1 = frozen(sale({ id: "S1", repId: "R1", soldAt: "2026-06-01T12:00:00.000Z" }), product(), scheme(), r1);
    // t1 partial settlement 300
    const t1 = settlement({ id: "T1", amountMinor: 300, paidAt: "2026-06-02T12:00:00.000Z" });
    // t2 sale 2 on the thinner product → frozen rep share 400
    const s2 = frozen(
      sale({
        id: "S2",
        productId: "Q",
        unitPrice: 18,
        repId: "R1",
        soldAt: "2026-06-03T12:00:00.000Z",
      }),
      q,
      scheme(),
      r1,
    );
    // t3 settlement 600 clears the rest
    const t2 = settlement({ id: "T2", amountMinor: 600, paidAt: "2026-06-04T12:00:00.000Z" });

    expect(balanceOf([s1], [])).toBe(500);
    expect(balanceOf([s1], [t1])).toBe(200);
    expect(balanceOf([s1, s2], [t1])).toBe(600);
    expect(balanceOf([s1, s2], [t1, t2])).toBe(0);

    // Order-independent by construction: the same events shuffled still net to 0.
    expect(balanceOf([s2, s1], [t2, t1])).toBe(0);

    const [row] = computeRepAggregates(
      input({ sales: [s1, s2], settlements: [t1, t2], products: [product(), q], reps: [r1] }),
    );
    expect(row.earnedMinor).toBe(900);
    expect(row.settledMinor).toBe(900);
    expect(Object.is(row.balanceMinor, 0)).toBe(true);
  });

  it("carries an over-settlement forward instead of clamping it", () => {
    const s1 = frozen(sale({ id: "S1", repId: "R1" }), product(), scheme(), r1);
    const paidAhead = settlement({ id: "T1", amountMinor: 800 });
    expect(balanceOf([s1], [paidAhead])).toBe(-300);

    const s2 = frozen(
      sale({ id: "S2", repId: "R1", soldAt: "2026-06-20T12:00:00.000Z" }),
      product(),
      scheme(),
      r1,
    );
    // The next credit reads 200, not 500 — clamping would have destroyed 300.
    expect(balanceOf([s1, s2], [paidAhead])).toBe(200);
  });

  it("never nets a foreign-currency settlement against the account currency", () => {
    const s1 = frozen(sale({ id: "S1", repId: "R1" }), product(), scheme(), r1);
    const eur = settlement({ id: "T1", amountMinor: 400, currency: "EUR" });
    const [row] = computeRepAggregates(
      input({ sales: [s1], settlements: [eur], reps: [r1] }),
      { currency: CURRENCY },
    );
    expect(row.balance.lines).toHaveLength(2);
    expect(row.balance.lines.map((l) => l.currency)).toEqual(["EUR", "USD"]);
    expect(row.balanceMinor).toBe(500);
    expect(row.currencies).toEqual(["EUR", "USD"]);
    expect(row.balance.lines.find((l) => l.currency === "EUR")?.balanceMinor).toBe(-400);
  });

  it("excludes a provisional live share from the payable but shows it as earnings", () => {
    const unfrozen = sale({ id: "S1", repId: "R1" });
    const [row] = computeRepAggregates(input({ sales: [unfrozen], reps: [r1] }));
    expect(row.repShareMinor).toBe(500);
    expect(row.needsSchemeCount).toBe(1);
    // Nothing is owed until the split is frozen on the sale.
    expect(row.earnedMinor).toBe(0);
    expect(row.balanceMinor).toBe(0);
  });

  it("derives the balance from frozen splits only", () => {
    const s1 = frozen(sale({ id: "S1", repId: "R1" }), product(), scheme(), r1);
    const snapshots: CommissionSnapshot[] = frozenSnapshots([s1, sale({ id: "S2", repId: "R1" })]);
    expect(snapshots).toHaveLength(1);
    expect(snapshots[0]?.repShareMinor).toBe(500);
  });
});

describe("computeTeamCommissions", () => {
  const r1 = rep();
  const r2 = rep({ id: "R2", name: "ليث" });
  const r3 = rep({ id: "R3", name: "نور", status: "archived" });
  const s1 = frozen(sale({ id: "S1", repId: "R1" }), product(), scheme(), r1);
  const s2 = frozen(
    sale({ id: "S2", repId: "R2", soldAt: "2026-06-12T12:00:00.000Z" }),
    product(),
    scheme(),
    r2,
  );
  const ownerSold = sale({ id: "S3", soldAt: "2026-06-13T12:00:00.000Z" });

  it("totals the team and counts only active reps as active", () => {
    const team = computeTeamCommissions(
      input({ sales: [s1, s2, ownerSold], reps: [r1, r2, r3], settlements: [settlement()] }),
    );
    expect(team.currency).toBe(CURRENCY);
    expect(team.reps).toHaveLength(3);
    expect(team.saleCount).toBe(2);
    expect(team.revenueMinor).toBe(4000);
    expect(team.netProfitMinor).toBe(2000);
    expect(team.repShareMinor).toBe(1000);
    expect(team.ownerShareMinor).toBe(1000);
    expect(team.earnedMinor).toBe(1000);
    expect(team.settledMinor).toBe(300);
    expect(team.outstandingMinor).toBe(700);
    expect(team.activeRepCount).toBe(2);
    expect(team.needsSchemeCount).toBe(0);
  });

  it("keeps the parts equal to the whole on every rail", () => {
    const team = computeTeamCommissions(input({ sales: [s1, s2], reps: [r1, r2] }));
    const repShare = team.reps.reduce((sum, r) => sum + r.repShareMinor, 0);
    const ownerShare = team.reps.reduce((sum, r) => sum + r.ownerShareMinor, 0);
    expect(repShare).toBe(team.repShareMinor);
    expect(ownerShare).toBe(team.ownerShareMinor);
    // The split contract itself: the two shares are exactly the basis.
    expect(team.repShareMinor + team.ownerShareMinor).toBe(team.basisMinor);
    expect(team.netProfitMinor - team.repShareMinor).toBe(team.ownerKeepsMinor);
  });

  it("reconciles against the basis, not net profit, once a scheme splits the gross margin", () => {
    // Shipping is outside an afterPurchaseCost basis, so the owner carries it
    // alone: ownerShare (what the contract says) and ownerKeeps (what the owner
    // pocketed) are different figures and both have to be readable.
    const shipped = product({
      costs: makeCostBreakdown({
        purchase: { fixed: 10, percent: 0 },
        shipping: { fixed: 2, percent: 0 },
      }),
    });
    const gross = scheme({ id: "gross", name: "مناصفة الربح الأولي", profitBasis: "afterPurchaseCost" });
    const s = frozen(sale({ id: "S1", repId: "R1" }), shipped, gross, r1);
    const team = computeTeamCommissions(
      input({ sales: [s], products: [shipped], schemes: [gross], reps: [r1] }),
    );
    expect(team.netProfitMinor).toBe(800);
    expect(team.basisMinor).toBe(1000);
    expect(team.repShareMinor).toBe(500);
    expect(team.ownerShareMinor).toBe(500);
    expect(team.ownerKeepsMinor).toBe(300);
    expect(team.repShareMinor + team.ownerShareMinor).toBe(team.basisMinor);
    expect(team.repShareMinor + team.ownerShareMinor).not.toBe(team.netProfitMinor);
  });

  it("excludes owner-sold sales from every team figure", () => {
    const team = computeTeamCommissions(input({ sales: [ownerSold], reps: [r1] }));
    expect(team.saleCount).toBe(0);
    expect(team.revenueMinor).toBe(0);
    expect(team.repShareMinor).toBe(0);
  });
});

describe("computeRepTrends", () => {
  const now = new Date("2026-06-26T12:00:00.000Z");
  const r1 = rep();

  it("returns one zero-padded track per rep, oldest first", () => {
    const s1 = frozen(
      sale({ id: "S1", repId: "R1", soldAt: "2026-04-10T12:00:00.000Z" }),
      product(),
      scheme(),
      r1,
    );
    const s2 = frozen(
      sale({ id: "S2", repId: "R1", soldAt: "2026-06-10T12:00:00.000Z" }),
      product(),
      scheme(),
      r1,
    );
    const trends = computeRepTrends(input({ sales: [s1, s2], reps: [r1] }), { now });
    expect(trends.get("R1")).toEqual([0, 0, 0, 500, 0, 500]);
  });

  it("sums several sales inside one month and honours the window length", () => {
    const s1 = frozen(
      sale({ id: "S1", repId: "R1", soldAt: "2026-06-02T12:00:00.000Z" }),
      product(),
      scheme(),
      r1,
    );
    const s2 = frozen(
      sale({ id: "S2", repId: "R1", soldAt: "2026-06-18T12:00:00.000Z" }),
      product(),
      scheme(),
      r1,
    );
    const trends = computeRepTrends(input({ sales: [s1, s2], reps: [r1] }), { now, months: 3 });
    expect(trends.get("R1")).toEqual([0, 0, 1000]);
  });

  it("gives an idle rep a flat track so the sparklines stay comparable", () => {
    const idle = rep({ id: "R9", name: "نور" });
    const trends = computeRepTrends(input({ reps: [r1, idle] }), { now });
    expect(trends.get("R9")).toEqual([0, 0, 0, 0, 0, 0]);
  });
});

describe("repMomentum", () => {
  it("reads the last month against the one before it", () => {
    expect(repMomentum([0, 0, 0, 0, 400, 500])).toBeCloseTo(0.25);
    expect(repMomentum([0, 0, 0, 0, 500, 400])).toBeCloseTo(-0.2);
    expect(repMomentum([0, 0, 0, 0, 500, 500])).toBe(0);
  });

  it("divides by the MAGNITUDE, so a recovery from a loss reads as a rise", () => {
    expect(repMomentum([-400, 200])).toBeCloseTo(1.5);
    expect(repMomentum([-400, -600])).toBeCloseTo(-0.5);
  });

  it("has nothing to state without a previous month to compare against", () => {
    expect(repMomentum([])).toBeNull();
    expect(repMomentum([500])).toBeNull();
  });

  it("refuses a zero previous month: up from nothing is not a percentage", () => {
    expect(repMomentum([0, 500])).toBeNull();
    expect(repMomentum([0, 0, 0, 0, 0, 0])).toBeNull();
  });

  it("reads the tail of a real series from computeRepTrends", () => {
    const now = new Date("2026-06-26T12:00:00.000Z");
    const r1 = rep();
    const may = frozen(
      sale({ id: "S1", repId: "R1", soldAt: "2026-05-10T12:00:00.000Z" }),
      product(),
      scheme(),
      r1,
    );
    const june = frozen(
      sale({ id: "S2", repId: "R1", quantity: 3, soldAt: "2026-06-10T12:00:00.000Z" }),
      product(),
      scheme(),
      r1,
    );
    const series = computeRepTrends(input({ sales: [may, june], reps: [r1] }), { now }).get("R1")!;
    expect(series).toEqual([0, 0, 0, 0, 500, 1500]);
    expect(repMomentum(series)).toBeCloseTo(2);
  });
});

describe("toMajor", () => {
  it("converts minor units for the formatter through Money", () => {
    expect(toMajor(500, CURRENCY)).toBe(5);
    expect(toMajor(-300, CURRENCY)).toBe(-3);
    expect(toMajor(0, CURRENCY)).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// P5 — a returned trip owes nobody. The snapshot stays; the balance changes.
// ─────────────────────────────────────────────────────────────────────────────

function order(id: string, o: Partial<Order> = {}): Order {
  return {
    id,
    currency: CURRENCY,
    placedAt: "2026-06-10T00:00:00.000Z",
    deliveryCharged: 5,
    deliveryPaid: 4,
    deliveryAllocation: "byValue",
    createdAt: "2026-06-10T00:00:00.000Z",
    updatedAt: "2026-06-10T00:00:00.000Z",
    ...o,
  };
}

/** One frozen sale of 20 (cost 10, half split = 5) riding trip `O1`. */
function tripSale(): Sale {
  return frozen(
    sale({ id: "S1", repId: "R1", orderId: "O1" }),
    product(),
    scheme(),
    rep(),
  );
}

describe("commission reverses on a void trip, and the snapshot stands (gate P5/G2)", () => {
  const s = tripSale();

  it("delivered: the frozen 500 is earned and owed", () => {
    const [agg] = computeRepAggregates(
      input({ sales: [s], orders: [order("O1", { status: "delivered" })] }),
      { currency: CURRENCY },
    );
    expect(agg.repShareMinor).toBe(500);
    expect(agg.earnedMinor).toBe(500);
    expect(agg.balanceMinor).toBe(500);
    expect(agg.voidedShareMinor).toBe(0);
    expect(agg.voidedCount).toBe(0);
  });

  it("returned: the balance drops by exactly that share, and says why", () => {
    const [agg] = computeRepAggregates(
      input({ sales: [s], orders: [order("O1", { status: "returned" })] }),
      { currency: CURRENCY },
    );
    expect(agg.repShareMinor).toBe(0);
    expect(agg.earnedMinor).toBe(0);
    expect(agg.balanceMinor).toBe(0);
    // Not silently dropped: the reversed share is reported on its own line.
    expect(agg.voidedShareMinor).toBe(500);
    expect(agg.voidedCount).toBe(1);
  });

  it("cancelled reverses the same way returned does", () => {
    const [agg] = computeRepAggregates(
      input({ sales: [s], orders: [order("O1", { status: "cancelled" })] }),
      { currency: CURRENCY },
    );
    expect(agg.earnedMinor).toBe(0);
    expect(agg.voidedShareMinor).toBe(500);
  });

  it("the frozen snapshot on the sale is untouched by any of it", () => {
    const before = JSON.stringify(s.commissionSnapshot);
    computeRepAggregates(input({ sales: [s], orders: [order("O1", { status: "returned" })] }), {
      currency: CURRENCY,
    });
    expect(JSON.stringify(s.commissionSnapshot)).toBe(before);
    // And the row still reports what was agreed — it is simply marked void.
    const rows = computeSaleCommissions(
      input({ sales: [s], orders: [order("O1", { status: "returned" })] }),
    );
    expect(rows[0].frozen).toBe(true);
    expect(rows[0].voided).toBe(true);
    expect(rows[0].repShareMinor).toBe(500);
  });

  it("marking it delivered again restores the balance exactly (gate P5/G4)", () => {
    const at = (status: Order["status"]) =>
      computeRepAggregates(input({ sales: [s], orders: [order("O1", { status })] }), {
        currency: CURRENCY,
      })[0];
    const before = at("delivered");
    const during = at("returned");
    const after = at("delivered");
    expect(during.balanceMinor).toBe(0);
    expect(after.balanceMinor).toBe(before.balanceMinor);
    expect(after.repShareMinor).toBe(before.repShareMinor);
    expect(after.voidedShareMinor).toBe(0);
  });

  it("a payment already made against a returned trip shows up as an overpayment", () => {
    const [agg] = computeRepAggregates(
      input({
        sales: [s],
        orders: [order("O1", { status: "returned" })],
        settlements: [settlement({ amountMinor: 500 })],
      }),
      { currency: CURRENCY },
    );
    // The 500 was paid and the 500 is no longer earned: the rep is 500 ahead, and
    // the figure is never clamped to zero.
    expect(agg.settledMinor).toBe(500);
    expect(agg.balanceMinor).toBe(-500);
  });

  it("a pending trip is not void — the split stands until the trip settles", () => {
    const [agg] = computeRepAggregates(
      input({ sales: [s], orders: [order("O1", { status: "pending" })] }),
      { currency: CURRENCY },
    );
    expect(agg.earnedMinor).toBe(500);
    expect(agg.voidedCount).toBe(0);
  });

  it("no orders at all leaves every share standing (gate P5/G6)", () => {
    const [agg] = computeRepAggregates(input({ sales: [s] }), { currency: CURRENCY });
    expect(agg.earnedMinor).toBe(500);
    expect(agg.voidedShareMinor).toBe(0);
  });

  it("a loose sale is never void, whatever else came back", () => {
    const loose = frozen(sale({ id: "S2", repId: "R1" }), product(), scheme(), rep());
    const [agg] = computeRepAggregates(
      input({ sales: [s, loose], orders: [order("O1", { status: "returned" })] }),
      { currency: CURRENCY },
    );
    expect(agg.earnedMinor).toBe(500);
    expect(agg.voidedShareMinor).toBe(500);
  });

  it("only the void trip's OWN lines are reversed", () => {
    const other = frozen(
      sale({ id: "S3", repId: "R1", orderId: "O2" }),
      product(),
      scheme(),
      rep(),
    );
    const [agg] = computeRepAggregates(
      input({
        sales: [s, other],
        orders: [order("O1", { status: "returned" }), order("O2", { status: "delivered" })],
      }),
      { currency: CURRENCY },
    );
    expect(agg.earnedMinor).toBe(500);
    expect(agg.voidedShareMinor).toBe(500);
    expect(agg.saleCount).toBe(1);
  });

  it("the team total reverses too, and reports the reversal", () => {
    const team = computeTeamCommissions(
      input({ sales: [s], orders: [order("O1", { status: "returned" })] }),
      { currency: CURRENCY },
    );
    expect(team.repShareMinor).toBe(0);
    expect(team.outstandingMinor).toBe(0);
    expect(team.voidedShareMinor).toBe(500);
    expect(team.voidedCount).toBe(1);
  });

  it("the sparkline does not show a peak the rep was never paid for", () => {
    const live = computeRepTrends(
      input({ sales: [s], orders: [order("O1", { status: "delivered" })] }),
      { currency: CURRENCY, now: new Date("2026-06-20T00:00:00.000Z"), months: 3 },
    );
    const voided = computeRepTrends(
      input({ sales: [s], orders: [order("O1", { status: "returned" })] }),
      { currency: CURRENCY, now: new Date("2026-06-20T00:00:00.000Z"), months: 3 },
    );
    expect(live.get("R1")).toEqual([0, 0, 500]);
    expect(voided.get("R1")).toEqual([0, 0, 0]);
  });
});

describe("frozenSnapshots with a void set", () => {
  it("drops only the splits of the trips named", () => {
    // Distinct prices so each snapshot is identifiable by its own frozen revenue.
    const a = frozen(
      sale({ id: "A", repId: "R1", orderId: "O1", unitPrice: 20 }),
      product(),
      scheme(),
      rep(),
    );
    const b = frozen(
      sale({ id: "B", repId: "R1", orderId: "O2", unitPrice: 30 }),
      product(),
      scheme(),
      rep(),
    );
    const c = frozen(sale({ id: "C", repId: "R1", unitPrice: 40 }), product(), scheme(), rep());
    const revenues = (voidOrders?: Set<string>) =>
      frozenSnapshots([a, b, c], voidOrders).map((s) => s.revenueMinor);
    expect(revenues()).toEqual([2000, 3000, 4000]);
    expect(revenues(new Set(["O1"]))).toEqual([3000, 4000]);
    expect(revenues(new Set(["O1", "O2"]))).toEqual([4000]);
    // An empty set removes nothing: it is not "everything is void".
    expect(revenues(new Set())).toEqual([2000, 3000, 4000]);
  });
});
