import { Money } from "../value-objects/money";
import { Percentage } from "../value-objects/percentage";
import { COST_LINES, type CostBreakdown, type CostComponent } from "../entities/cost-breakdown";
import type { Product } from "../entities/product";

export interface ProfitInput {
  sellingPrice: number;
  costs: CostBreakdown;
  currency?: string;
  /** Units sold; defaults to 1. Aggregates scale linearly with quantity. */
  quantity?: number;
}

export interface ProfitResult {
  currency: string;
  quantity: number;
  /** Revenue (selling price x quantity), major units. */
  revenue: number;
  /** Total of all cost lines, major units. */
  totalCost: number;
  /** Revenue minus total cost, major units. */
  netProfit: number;
  /** Net profit / revenue, as a ratio (0.42 === 42%). */
  margin: number;
  /** Net profit / total cost, as a ratio. */
  roi: number;
  /** (Selling price - unit cost) / unit cost, as a ratio. */
  markup: number;
  /**
   * Selling price at which net profit is exactly zero, accounting for
   * percentage-based costs. `null` when percentage costs reach/exceed 100%
   * (no finite break-even exists).
   */
  breakEvenPrice: number | null;
  isProfitable: boolean;
  /** Per-cost-line totals (major units) for breakdown displays. */
  costByLine: Record<string, number>;
}

/**
 * Pure profit engine. No I/O, no framework. The single home of all profit math.
 */
export class ProfitCalculator {
  /** Cost contributed by one component at a given selling price. */
  static componentCost(component: CostComponent, sellingPrice: Money): Money {
    const fixed = Money.fromMajor(component.fixed, sellingPrice.currency);
    const variable = Percentage.fromPercent(component.percent).of(sellingPrice);
    return fixed.add(variable);
  }

  static calculate(input: ProfitInput): ProfitResult {
    const currency = input.currency ?? "USD";
    const quantity = input.quantity && input.quantity > 0 ? input.quantity : 1;
    const unitPrice = Money.fromMajor(input.sellingPrice, currency);

    // Per-unit cost per line.
    const costByLine: Record<string, number> = {};
    let unitCost = Money.zero(currency);
    for (const line of COST_LINES) {
      const lineCost = this.componentCost(input.costs[line], unitPrice);
      costByLine[line] = lineCost.multiply(quantity).amount;
      unitCost = unitCost.add(lineCost);
    }

    const revenue = unitPrice.multiply(quantity);
    const totalCost = unitCost.multiply(quantity);
    const netProfit = revenue.subtract(totalCost);

    const margin = revenue.isZero() ? 0 : netProfit.ratioTo(revenue);
    const roi = totalCost.isZero() ? 0 : netProfit.ratioTo(totalCost);
    const markup = unitCost.isZero() ? 0 : unitPrice.subtract(unitCost).ratioTo(unitCost);

    return {
      currency,
      quantity,
      revenue: revenue.amount,
      totalCost: totalCost.amount,
      netProfit: netProfit.amount,
      margin,
      roi,
      markup,
      breakEvenPrice: this.breakEvenPrice(input.costs),
      isProfitable: netProfit.isPositive(),
      costByLine,
    };
  }

  /** Convenience overload for a stored product (uses its list price). */
  static forProduct(product: Product, quantity = 1): ProfitResult {
    return this.calculate({
      sellingPrice: product.sellingPrice,
      costs: product.costs,
      currency: product.currency,
      quantity,
    });
  }

  /**
   * Break-even selling price. Solves price = fixedCosts + rate * price:
   *   price = fixedCosts / (1 - rate)
   * Returns null when total percentage costs >= 100% (no finite solution).
   */
  static breakEvenPrice(costs: CostBreakdown): number | null {
    let fixedTotal = 0;
    let rateTotal = 0;
    for (const line of COST_LINES) {
      fixedTotal += costs[line].fixed || 0;
      rateTotal += (costs[line].percent || 0) / 100;
    }
    if (rateTotal >= 1) return null;
    return round2(fixedTotal / (1 - rateTotal));
  }
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
