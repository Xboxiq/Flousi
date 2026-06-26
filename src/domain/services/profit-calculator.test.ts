import { describe, expect, it } from "vitest";
import { ProfitCalculator } from "./profit-calculator";
import { makeCostBreakdown } from "../entities/cost-breakdown";
import { Money } from "../value-objects/money";

describe("Money", () => {
  it("avoids floating-point drift", () => {
    const a = Money.fromMajor(0.1);
    const b = Money.fromMajor(0.2);
    expect(a.add(b).amount).toBe(0.3);
  });

  it("computes ratios safely", () => {
    expect(Money.fromMajor(50).ratioTo(Money.fromMajor(200))).toBe(0.25);
    expect(Money.fromMajor(50).ratioTo(Money.zero())).toBe(0);
  });

  it("rejects currency mismatch", () => {
    expect(() => Money.fromMajor(1, "USD").add(Money.fromMajor(1, "EUR"))).toThrow();
  });
});

describe("ProfitCalculator", () => {
  it("computes net profit, margin and ROI for fixed costs", () => {
    const result = ProfitCalculator.calculate({
      sellingPrice: 100,
      costs: makeCostBreakdown({
        purchase: { fixed: 40, percent: 0 },
        shipping: { fixed: 10, percent: 0 },
      }),
    });
    expect(result.revenue).toBe(100);
    expect(result.totalCost).toBe(50);
    expect(result.netProfit).toBe(50);
    expect(result.margin).toBeCloseTo(0.5, 5);
    expect(result.roi).toBeCloseTo(1, 5);
    expect(result.isProfitable).toBe(true);
  });

  it("handles percentage-based fees (marketplace + payment)", () => {
    const result = ProfitCalculator.calculate({
      sellingPrice: 100,
      costs: makeCostBreakdown({
        purchase: { fixed: 30, percent: 0 },
        marketplaceFees: { fixed: 0, percent: 10 }, // $10
        paymentFees: { fixed: 0.3, percent: 2.9 }, // $3.20
      }),
    });
    // total cost = 30 + 10 + 3.20 = 43.20
    expect(result.totalCost).toBeCloseTo(43.2, 2);
    expect(result.netProfit).toBeCloseTo(56.8, 2);
  });

  it("scales aggregates linearly with quantity", () => {
    const result = ProfitCalculator.calculate({
      sellingPrice: 20,
      quantity: 5,
      costs: makeCostBreakdown({ purchase: { fixed: 8, percent: 0 } }),
    });
    expect(result.revenue).toBe(100);
    expect(result.totalCost).toBe(40);
    expect(result.netProfit).toBe(60);
    // margin is quantity-independent
    expect(result.margin).toBeCloseTo(0.6, 5);
  });

  it("reports a loss as not profitable", () => {
    const result = ProfitCalculator.calculate({
      sellingPrice: 10,
      costs: makeCostBreakdown({ purchase: { fixed: 15, percent: 0 } }),
    });
    expect(result.netProfit).toBe(-5);
    expect(result.isProfitable).toBe(false);
  });

  it("computes break-even price with mixed fixed + percent costs", () => {
    // fixed = 40, percent total = 20% -> break-even = 40 / (1 - 0.2) = 50
    const breakEven = ProfitCalculator.breakEvenPrice(
      makeCostBreakdown({
        purchase: { fixed: 40, percent: 0 },
        marketplaceFees: { fixed: 0, percent: 20 },
      }),
    );
    expect(breakEven).toBe(50);
  });

  it("returns null break-even when percentage costs reach 100%", () => {
    const breakEven = ProfitCalculator.breakEvenPrice(
      makeCostBreakdown({ taxes: { fixed: 0, percent: 100 } }),
    );
    expect(breakEven).toBeNull();
  });
});
