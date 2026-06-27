import { describe, expect, it } from "vitest";
import { computePeriodSummary, nextPeriodAfter } from "./periods";
import { makeCostBreakdown, type AccountingPeriod, type Product, type Sale } from "@/domain";

const period: AccountingPeriod = {
  id: "per1",
  label: "June 2026",
  startDate: "2026-06-01T00:00:00.000Z",
  status: "open",
};

const products: Product[] = [
  {
    id: "p1",
    name: "Item",
    sellingPrice: 50,
    currency: "USD",
    status: "active",
    costs: makeCostBreakdown({ purchase: { fixed: 20, percent: 0 } }),
    createdAt: "",
    updatedAt: "",
  },
];

const sales: Sale[] = [
  {
    id: "s1",
    productId: "p1",
    quantity: 2,
    unitPrice: 50,
    currency: "USD",
    soldAt: "2026-06-10T12:00:00Z",
    periodId: "per1",
  },
  {
    id: "s2",
    productId: "p1",
    quantity: 1,
    unitPrice: 50,
    currency: "USD",
    soldAt: "2026-05-10T12:00:00Z",
    periodId: "other",
  },
];

describe("computePeriodSummary", () => {
  it("only counts sales tagged to the period", () => {
    const summary = computePeriodSummary(period, products, sales);
    expect(summary.revenue).toBe(100); // 2 x 50
    expect(summary.totalCost).toBe(40); // 2 x 20
    expect(summary.netProfit).toBe(60);
    expect(summary.saleCount).toBe(1);
    expect(summary.productCount).toBe(1);
    expect(summary.margin).toBeCloseTo(0.6, 5);
  });
});

describe("nextPeriodAfter", () => {
  it("rolls into the following month", () => {
    const next = nextPeriodAfter(period);
    expect(next.label).toBe("يوليو 2026");
    expect(new Date(next.startDate).getMonth()).toBe(6); // July (0-indexed)
  });

  it("rolls over the year boundary", () => {
    const dec: AccountingPeriod = {
      ...period,
      label: "December 2026",
      startDate: "2026-12-01T00:00:00.000Z",
    };
    const next = nextPeriodAfter(dec);
    expect(next.label).toBe("يناير 2027");
  });
});
