import type { AccountingPeriod, PeriodSummary, Product, Sale } from "@/domain";
import { profitForSale } from "./analytics";

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Compute a frozen-able financial summary for a period from its sales.
 * Used both for the live "running totals" of an open period and for the
 * snapshot stored when the period is closed.
 */
export function computePeriodSummary(
  period: AccountingPeriod,
  products: Product[],
  sales: Sale[],
): PeriodSummary {
  const productById = new Map(products.map((p) => [p.id, p]));
  const periodSales = sales.filter((s) => s.periodId === period.id);

  let revenue = 0;
  let totalCost = 0;
  let netProfit = 0;
  const productIds = new Set<string>();

  for (const sale of periodSales) {
    const sp = profitForSale(sale, productById.get(sale.productId));
    revenue += sp.revenue;
    totalCost += sp.totalCost;
    netProfit += sp.netProfit;
    productIds.add(sale.productId);
  }

  return {
    revenue: round2(revenue),
    totalCost: round2(totalCost),
    netProfit: round2(netProfit),
    margin: revenue ? netProfit / revenue : 0,
    productCount: productIds.size,
    saleCount: periodSales.length,
    currency: products[0]?.currency ?? "USD",
  };
}

/** Build the label + start date for the month following a given period. */
export function nextPeriodAfter(period: AccountingPeriod): { label: string; startDate: string } {
  const start = new Date(period.startDate);
  const next = new Date(start.getFullYear(), start.getMonth() + 1, 1);
  return {
    label: new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(next),
    startDate: next.toISOString(),
  };
}
