import { describe, expect, it } from "vitest";
import { computeDashboard, profitForSale } from "./analytics";
import { makeCostBreakdown, type Product, type Sale } from "@/domain";

function product(overrides: Partial<Product> = {}): Product {
  return {
    id: "p1",
    name: "Test product",
    sellingPrice: 100,
    currency: "USD",
    status: "active",
    costs: makeCostBreakdown({ purchase: { fixed: 40, percent: 0 } }),
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function sale(overrides: Partial<Sale> = {}): Sale {
  return {
    id: "s1",
    productId: "p1",
    quantity: 1,
    unitPrice: 100,
    currency: "USD",
    soldAt: "2026-06-10T12:00:00.000Z",
    ...overrides,
  };
}

describe("profitForSale", () => {
  it("computes revenue, cost and profit for a known product", () => {
    const sp = profitForSale(sale({ quantity: 2 }), product());
    expect(sp.revenue).toBe(200);
    expect(sp.totalCost).toBe(80);
    expect(sp.netProfit).toBe(120);
    expect(sp.margin).toBeCloseTo(0.6, 5);
  });

  it("returns zeros for an unknown product", () => {
    const sp = profitForSale(sale(), undefined);
    expect(sp.revenue).toBe(0);
    expect(sp.netProfit).toBe(0);
  });
});

describe("computeDashboard", () => {
  const now = new Date("2026-06-26T12:00:00.000Z");

  it("aggregates totals across sales", () => {
    const m = computeDashboard([product()], [sale(), sale({ id: "s2" })], { now });
    expect(m.revenue).toBe(200);
    expect(m.totalCost).toBe(80);
    expect(m.netProfit).toBe(120);
    expect(m.margin).toBeCloseTo(0.6, 5);
    expect(m.saleCount).toBe(2);
  });

  it("isolates current-month figures", () => {
    const m = computeDashboard(
      [product()],
      [
        sale({ soldAt: "2026-06-05T12:00:00.000Z" }),
        sale({ id: "s2", soldAt: "2026-03-05T12:00:00.000Z" }),
      ],
      { now },
    );
    expect(m.monthProfit).toBe(60); // only June sale
    expect(m.monthRevenue).toBe(100);
  });

  it("produces a continuous trailing monthly series", () => {
    const m = computeDashboard([product()], [sale()], { now, months: 6 });
    expect(m.monthly).toHaveLength(6);
    expect(m.monthly[m.monthly.length - 1].label).toBe("يونيو");
  });

  it("ranks top products by net profit", () => {
    const a = product({
      id: "a",
      name: "A",
      sellingPrice: 100,
      costs: makeCostBreakdown({ purchase: { fixed: 40, percent: 0 } }),
    });
    const b = product({
      id: "b",
      name: "B",
      sellingPrice: 100,
      costs: makeCostBreakdown({ purchase: { fixed: 90, percent: 0 } }),
    });
    const m = computeDashboard(
      [a, b],
      [
        sale({ productId: "a", unitPrice: 100 }),
        sale({ id: "s2", productId: "b", unitPrice: 100 }),
      ],
      { now },
    );
    expect(m.topProducts[0].name).toBe("A");
    expect(m.topProducts[0].netProfit).toBeGreaterThan(m.topProducts[1].netProfit);
  });
});
