import { describe, expect, it } from "vitest";
import { computeDashboard, computeProductTrends, profitForSale } from "./analytics";
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

  it("produces a 7-day series where empty days keep their slot", () => {
    // `now` is 2026-06-26; this sale lands two days earlier, inside the window.
    const m = computeDashboard([product()], [sale({ soldAt: "2026-06-24T09:00:00.000Z" })], {
      now,
    });
    expect(m.week).toHaveLength(7);
    expect(m.week[m.week.length - 1].key).toBe("2026-06-26");
    const day = m.week.find((d) => d.key === "2026-06-24");
    expect(day?.netProfit).toBe(60);
    // Days without sales are present and zero — the empty track is data.
    expect(m.week.filter((d) => d.netProfit === 0)).toHaveLength(6);
    // Every day carries its Arabic weekday mark.
    expect(m.week.every((d) => d.mark.length > 0)).toBe(true);
  });

  it("takes this month's revenue apart into cost lines that sum back to it", () => {
    // 3 cost lines on purpose, one of them percentage-based, plus a month that
    // must be ignored entirely.
    const p = product({
      costs: makeCostBreakdown({
        purchase: { fixed: 40, percent: 0 },
        shipping: { fixed: 10, percent: 0 },
        paymentFees: { fixed: 0, percent: 3 },
      }),
    });
    const m = computeDashboard(
      [p],
      [
        sale({ soldAt: "2026-06-05T12:00:00.000Z", quantity: 2 }),
        sale({ id: "s2", soldAt: "2026-04-05T12:00:00.000Z" }),
      ],
      { now },
    );

    expect(m.monthRevenue).toBe(200);
    expect(m.monthTotalCost).toBe(106); // (40 + 10 + 3) × 2
    expect(m.monthProfit).toBe(94);

    // Only lines that actually spent something, largest first.
    expect(m.monthCostLines.map((c) => c.line)).toEqual(["purchase", "shipping", "paymentFees"]);
    expect(m.monthCostLines.map((c) => c.amount)).toEqual([80, 20, 6]);

    // The identity the distribution bar depends on: the parts ARE the whole.
    const spent = m.monthCostLines.reduce((s, c) => s + c.amount, 0);
    expect(spent + m.monthProfit).toBeCloseTo(m.monthRevenue, 5);
    expect(m.monthCostLines[0].share).toBeCloseTo(0.4, 5);
  });

  it("averages net profit across the window for the chart's fallback threshold", () => {
    const m = computeDashboard([product()], [sale(), sale({ id: "s2" })], { now, months: 6 });
    // 120 of profit spread over a 6-month window.
    expect(m.averageMonthProfit).toBe(20);
  });

  it("builds a comparable trailing series per product, empty months included", () => {
    const a = product({ id: "a" });
    const b = product({ id: "b", costs: makeCostBreakdown({ purchase: { fixed: 90, percent: 0 } }) });
    const trends = computeProductTrends(
      [a, b],
      [
        sale({ productId: "a", soldAt: "2026-06-10T12:00:00.000Z" }), // +60
        sale({ id: "s2", productId: "a", soldAt: "2026-04-02T12:00:00.000Z", quantity: 2 }), // +120
        sale({ id: "s3", productId: "b", soldAt: "2026-05-15T12:00:00.000Z" }), // +10
        sale({ id: "s4", productId: "a", soldAt: "2025-11-01T12:00:00.000Z" }), // outside window
      ],
      { now, months: 6 },
    );
    // Window: Jan..Jun 2026, oldest first. Same length for every product.
    expect(trends.get("a")).toEqual([0, 0, 0, 120, 0, 60]);
    expect(trends.get("b")).toEqual([0, 0, 0, 0, 10, 0]);
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
