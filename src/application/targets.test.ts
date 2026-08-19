import { describe, expect, it } from "vitest";
import { computeTargets } from "./targets";
import { makeCostBreakdown, type Product, type Rep, type Sale, type Target } from "@/domain";

const AUG = "2026-08";
const ASOF = "2026-08-16T00:00:00.000Z"; // 16/31 ≈ 51.6% elapsed

function product(o: Partial<Product> = {}): Product {
  return {
    id: "P1",
    name: "منتج",
    sellingPrice: 100,
    currency: "IQD",
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
    currency: "IQD",
    soldAt: "2026-08-05T00:00:00.000Z",
    ...o,
  };
}
let seq = 0;
function target(o: Partial<Target> = {}): Target {
  seq += 1;
  return {
    id: `T${seq}`,
    metric: "netProfit",
    amount: 100,
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...o,
  };
}
function view(o: Partial<Parameters<typeof computeTargets>[0]> = {}) {
  return computeTargets({
    targets: [],
    sales: [],
    products: [product()],
    reps: [rep()],
    month: AUG,
    asOf: ASOF,
    ...o,
  });
}

describe("computeTargets", () => {
  it("an empty store still reports the account row, with no target set", () => {
    const v = view();
    expect(v.account.scope).toBe("account");
    expect(v.account.target).toBeNull();
    expect(v.account.progress.hasTarget).toBe(false);
    expect(v.withTarget).toBe(0);
    expect(v.behind).toBe(0);
  });

  it("counts only the month asked for", () => {
    const v = view({
      targets: [target({ amount: 40 })],
      sales: [
        sale({ id: "in", soldAt: "2026-08-05T00:00:00.000Z" }),
        sale({ id: "out", soldAt: "2026-07-05T00:00:00.000Z" }),
      ],
    });
    // one August sale: 100 revenue − 60 purchase = 40 net
    expect(v.account.progress.actual).toBe(40);
    expect(v.account.progress.met).toBe(true);
  });

  it("every active rep gets a row even with no target — a MISSING target is the finding", () => {
    const v = view({ reps: [rep(), rep({ id: "R2", name: "علي" })] });
    expect(v.reps).toHaveLength(2);
    expect(v.reps.every((r) => r.target === null)).toBe(true);
    expect(v.reps.map((r) => r.name)).toEqual(["سارة", "علي"]);
  });

  it("a rep row NEVER inherits the account's target — «هدف سارة» is not the whole account's", () => {
    const v = view({ targets: [target({ amount: 1000 })] });
    expect(v.account.progress.hasTarget).toBe(true);
    expect(v.reps[0].target).toBeNull();
    expect(v.reps[0].progress.hasTarget).toBe(false);
    expect(v.withTarget).toBe(1);
  });

  it("a rep's own target answers, measured against that rep's own sales", () => {
    const v = view({
      targets: [target({ amount: 30, repId: "R1" })],
      reps: [rep(), rep({ id: "R2", name: "علي" })],
      sales: [
        sale({ id: "a", repId: "R1" }),
        sale({ id: "b", repId: "R2" }),
        sale({ id: "c" }), // no rep at all
      ],
    });
    const sara = v.reps.find((r) => r.repId === "R1");
    expect(sara?.progress.actual).toBe(40); // R1's one sale only
    expect(sara?.progress.attainment).toBeCloseTo(40 / 30, 6);
    expect(sara?.progress.met).toBe(true);
    // and the account still counts all three
    expect(v.account.progress.actual).toBe(120);
  });

  it("an archived rep with a target still gets a row; one without does not", () => {
    const withTarget = view({
      targets: [target({ amount: 10, repId: "R9" })],
      reps: [rep({ id: "R9", name: "متقاعد", status: "archived" })],
    });
    expect(withTarget.reps).toHaveLength(1);

    const without = view({ reps: [rep({ id: "R9", name: "متقاعد", status: "archived" })] });
    expect(without.reps).toHaveLength(0);
  });

  it("an archived rep with sales this month gets a row — the money happened", () => {
    const v = view({
      reps: [rep({ id: "R9", name: "متقاعد", status: "archived" })],
      sales: [sale({ repId: "R9" })],
    });
    expect(v.reps).toHaveLength(1);
    expect(v.reps[0].progress.actual).toBe(40);
  });

  it("products appear ONLY when they have a target — a store of hundreds is not a list", () => {
    const many = [product(), product({ id: "P2", name: "ب" }), product({ id: "P3", name: "ج" })];
    expect(view({ products: many }).products).toHaveLength(0);
    const v = view({ products: many, targets: [target({ amount: 20, productId: "P2" })] });
    expect(v.products).toHaveLength(1);
    expect(v.products[0].name).toBe("ب");
  });

  it("a product target measures that product's own sales", () => {
    const v = view({
      products: [product(), product({ id: "P2", name: "ب", sellingPrice: 100 })],
      targets: [target({ amount: 20, productId: "P2" })],
      sales: [sale({ id: "a", productId: "P1" }), sale({ id: "b", productId: "P2" })],
    });
    expect(v.products[0].progress.actual).toBe(40);
    expect(v.account.progress.actual).toBe(80);
  });

  it("the revenue metric reads revenue, not profit", () => {
    const v = view({ targets: [target({ amount: 50, metric: "revenue" })], sales: [sale()], metric: "revenue" });
    expect(v.account.progress.actual).toBe(100);
    expect(v.account.progress.attainment).toBe(2);
  });

  it("the units metric counts quantity, not money", () => {
    const v = view({
      targets: [target({ amount: 5, metric: "units" })],
      sales: [sale({ quantity: 3 })],
      metric: "units",
    });
    expect(v.account.progress.actual).toBe(3);
    expect(v.account.progress.remaining).toBe(2);
  });

  it("a target for another metric does not answer this metric's read", () => {
    const v = view({ targets: [target({ amount: 50, metric: "revenue" })], metric: "netProfit" });
    expect(v.account.target).toBeNull();
  });

  it("behind counts only rows that HAVE a target, and pace decides — not attainment", () => {
    const v = view({
      // account: 40 of 200 = 20% attained with 51.6% of the month gone → behind
      // rep:     40 of 50  = 80% attained with 51.6% gone            → ahead
      targets: [target({ amount: 200 }), target({ amount: 50, repId: "R1" })],
      sales: [sale({ repId: "R1" })],
    });
    expect(v.account.progress.attainment).toBeCloseTo(0.2, 6);
    expect(v.account.progress.onPace).toBe(false);
    expect(v.reps[0].progress.attainment).toBeCloseTo(0.8, 6);
    expect(v.reps[0].progress.onPace).toBe(true);
    expect(v.withTarget).toBe(2);
    expect(v.behind).toBe(1);
  });

  it("a row with no target is never counted as behind", () => {
    const v = view({ reps: [rep(), rep({ id: "R2", name: "علي" })] });
    expect(v.reps.every((r) => r.progress.onPace)).toBe(true);
    expect(v.behind).toBe(0);
  });

  it("a month override is reported as such so the screen can say so", () => {
    const v = view({ targets: [target({ amount: 10, month: AUG })] });
    expect(v.account.fromOverride).toBe(true);
    const standing = view({ targets: [target({ amount: 10 })] });
    expect(standing.account.fromOverride).toBe(false);
  });

  it("does not mutate the arrays it is given", () => {
    const targets = [target({ amount: 1 }), target({ amount: 2 })];
    const snapshot = targets.map((t) => t.id);
    view({ targets });
    expect(targets.map((t) => t.id)).toEqual(snapshot);
  });

  it("a sale of a deleted product contributes nothing rather than throwing", () => {
    const v = view({ sales: [sale({ productId: "GONE" })], targets: [target({ amount: 10 })] });
    expect(v.account.progress.actual).toBe(0);
  });
});
