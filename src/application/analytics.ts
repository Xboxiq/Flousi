import { COST_LINES, Money, ProfitCalculator, type CostLine, type Product, type Sale } from "@/domain";

export interface SaleProfit {
  sale: Sale;
  product: Product | undefined;
  revenue: number;
  totalCost: number;
  netProfit: number;
  margin: number;
  /** Per-cost-line totals for this sale (major units). */
  costByLine: Record<string, number>;
}

/** One part of «وين راح المال»: a cost line's total and its share of revenue. */
export interface CostLineTotal {
  line: CostLine;
  amount: number;
  /** Share of the period's revenue, 0..1. */
  share: number;
}

/** One day of the trailing week — the capsule strip on the dashboard. */
export interface DayPoint {
  /** ISO date (yyyy-mm-dd) of the day. */
  key: string;
  /** Single-letter Arabic weekday mark. */
  mark: string;
  netProfit: number;
}

export interface MonthlyPoint {
  /** Sort key, e.g. "2026-06". */
  key: string;
  /** Display label, e.g. "Jun". */
  label: string;
  revenue: number;
  netProfit: number;
}

export interface TopProduct {
  productId: string;
  name: string;
  units: number;
  revenue: number;
  netProfit: number;
  margin: number;
}

export interface RecentSale {
  id: string;
  productName: string;
  soldAt: string;
  quantity: number;
  revenue: number;
  netProfit: number;
}

export interface DashboardMetrics {
  currency: string;
  revenue: number;
  totalCost: number;
  netProfit: number;
  margin: number;
  monthProfit: number;
  monthRevenue: number;
  monthTotalCost: number;
  /**
   * This month's revenue taken apart: every cost line that actually spent
   * something, largest first. Together with `monthProfit` these sum to
   * `monthRevenue` — that identity is what makes the distribution bar honest.
   */
  monthCostLines: CostLineTotal[];
  /** Mean net profit across the monthly window — the chart's fallback threshold. */
  averageMonthProfit: number;
  todayProfit: number;
  saleCount: number;
  monthly: MonthlyPoint[];
  /** Trailing 7 days, oldest first. */
  week: DayPoint[];
  topProducts: TopProduct[];
  recentSales: RecentSale[];
}

/** Arabic single-letter weekday marks, Sunday-first to match Intl's getDay(). */
const DAY_MARKS = ["ح", "ن", "ث", "ر", "خ", "ج", "س"];

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Compute profit for a single sale using the product's cost structure. */
export function profitForSale(sale: Sale, product: Product | undefined): SaleProfit {
  if (!product) {
    return { sale, product, revenue: 0, totalCost: 0, netProfit: 0, margin: 0, costByLine: {} };
  }
  const r = ProfitCalculator.calculate({
    sellingPrice: sale.unitPrice,
    costs: product.costs,
    currency: sale.currency,
    quantity: sale.quantity,
  });
  // The sale's share of its order's offer. Revenue is what the customer actually
  // paid, so the discount comes off HERE — once, at the boundary every reader goes
  // through — and never screen by screen (gate P6/G1). Costs are untouched: an 8%
  // marketplace fee is charged on what was invoiced.
  const discount = Money.fromMajor(
    Number.isFinite(sale.discount) ? Math.max(0, sale.discount as number) : 0,
    sale.currency,
  );
  if (discount.isZero()) {
    return {
      sale,
      product,
      revenue: r.revenue,
      totalCost: r.totalCost,
      netProfit: r.netProfit,
      margin: r.margin,
      costByLine: r.costByLine,
    };
  }
  const revenue = Money.fromMajor(r.revenue, sale.currency).subtract(discount);
  const netProfit = revenue.subtract(Money.fromMajor(r.totalCost, sale.currency));
  return {
    sale,
    product,
    revenue: revenue.amount,
    totalCost: r.totalCost,
    netProfit: netProfit.amount,
    margin: revenue.isZero() ? 0 : netProfit.amount / revenue.amount,
    costByLine: r.costByLine,
  };
}

const MONTH_LABELS = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

/**
 * Per-product trailing net-profit series — the sparkline on each product row.
 * Months with no sales stay 0 so every product spans the same window and the
 * sparklines are comparable across rows. Oldest first.
 */
export function computeProductTrends(
  products: Product[],
  sales: Sale[],
  options: { months?: number; now?: Date } = {},
): Map<string, number[]> {
  const months = options.months ?? 6;
  const now = options.now ?? new Date();
  const productById = new Map(products.map((p) => [p.id, p]));

  // Month-key → index into each product's series.
  const slot = new Map<string, number>();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    slot.set(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, months - 1 - i);
  }

  const series = new Map<string, number[]>(products.map((p) => [p.id, new Array(months).fill(0)]));
  for (const sale of sales) {
    const d = new Date(sale.soldAt);
    const idx = slot.get(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    if (idx === undefined) continue;
    const row = series.get(sale.productId);
    if (!row) continue;
    const sp = profitForSale(sale, productById.get(sale.productId));
    row[idx] = round2(row[idx] + sp.netProfit);
  }
  return series;
}

/**
 * Aggregate products + sales into the full dashboard metric set.
 * Pure and deterministic given `now` (defaults to current date).
 */
export function computeDashboard(
  products: Product[],
  sales: Sale[],
  options: { currency?: string; now?: Date; months?: number } = {},
): DashboardMetrics {
  const currency = options.currency ?? products[0]?.currency ?? "USD";
  const now = options.now ?? new Date();
  const monthsWindow = options.months ?? 6;
  const productById = new Map(products.map((p) => [p.id, p]));

  let revenue = 0;
  let totalCost = 0;
  let netProfit = 0;
  let monthProfit = 0;
  let monthRevenue = 0;
  let monthTotalCost = 0;
  let todayProfit = 0;
  const monthCostMap = new Map<CostLine, number>();

  const monthlyMap = new Map<string, MonthlyPoint>();
  const productAgg = new Map<string, TopProduct>();

  // Seed the trailing month buckets so the chart has continuous x-axis.
  for (let i = monthsWindow - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyMap.set(key, { key, label: MONTH_LABELS[d.getMonth()], revenue: 0, netProfit: 0 });
  }

  // Seed the trailing week so an empty day still shows its track.
  const weekMap = new Map<string, DayPoint>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    weekMap.set(dayKey(d), { key: dayKey(d), mark: DAY_MARKS[d.getDay()], netProfit: 0 });
  }

  const todayKey = now.toDateString();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const enriched: SaleProfit[] = sales.map((s) => profitForSale(s, productById.get(s.productId)));

  for (const sp of enriched) {
    revenue += sp.revenue;
    totalCost += sp.totalCost;
    netProfit += sp.netProfit;

    const d = new Date(sp.sale.soldAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const bucket = monthlyMap.get(key);
    if (bucket) {
      bucket.revenue = round2(bucket.revenue + sp.revenue);
      bucket.netProfit = round2(bucket.netProfit + sp.netProfit);
    }

    if (d.getMonth() === thisMonth && d.getFullYear() === thisYear) {
      monthProfit += sp.netProfit;
      monthRevenue += sp.revenue;
      monthTotalCost += sp.totalCost;
      for (const line of COST_LINES) {
        const amount = sp.costByLine[line] ?? 0;
        if (amount) monthCostMap.set(line, (monthCostMap.get(line) ?? 0) + amount);
      }
    }
    const wk = weekMap.get(dayKey(d));
    if (wk) wk.netProfit = round2(wk.netProfit + sp.netProfit);

    if (d.toDateString() === todayKey) todayProfit += sp.netProfit;

    if (sp.product) {
      const existing =
        productAgg.get(sp.product.id) ??
        ({
          productId: sp.product.id,
          name: sp.product.name,
          units: 0,
          revenue: 0,
          netProfit: 0,
          margin: 0,
        } satisfies TopProduct);
      existing.units += sp.sale.quantity;
      existing.revenue = round2(existing.revenue + sp.revenue);
      existing.netProfit = round2(existing.netProfit + sp.netProfit);
      existing.margin = existing.revenue ? existing.netProfit / existing.revenue : 0;
      productAgg.set(sp.product.id, existing);
    }
  }

  const recentSales: RecentSale[] = [...enriched]
    .sort((a, b) => new Date(b.sale.soldAt).getTime() - new Date(a.sale.soldAt).getTime())
    .slice(0, 6)
    .map((sp) => ({
      id: sp.sale.id,
      productName: sp.product?.name ?? "Unknown product",
      soldAt: sp.sale.soldAt,
      quantity: sp.sale.quantity,
      revenue: sp.revenue,
      netProfit: sp.netProfit,
    }));

  const topProducts = [...productAgg.values()]
    .sort((a, b) => b.netProfit - a.netProfit)
    .slice(0, 5);

  // Largest spend first: the merchant reads down until the answer to «وين راح
  // المال» stops being interesting.
  const monthCostLines: CostLineTotal[] = [...monthCostMap.entries()]
    .map(([line, amount]) => ({
      line,
      amount: round2(amount),
      share: monthRevenue ? amount / monthRevenue : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const monthlyPoints = [...monthlyMap.values()];
  const averageMonthProfit = monthlyPoints.length
    ? round2(monthlyPoints.reduce((sum, p) => sum + p.netProfit, 0) / monthlyPoints.length)
    : 0;

  return {
    currency,
    revenue: round2(revenue),
    totalCost: round2(totalCost),
    netProfit: round2(netProfit),
    margin: revenue ? netProfit / revenue : 0,
    monthProfit: round2(monthProfit),
    monthRevenue: round2(monthRevenue),
    monthTotalCost: round2(monthTotalCost),
    monthCostLines,
    averageMonthProfit,
    todayProfit: round2(todayProfit),
    saleCount: sales.length,
    monthly: monthlyPoints,
    week: [...weekMap.values()],
    topProducts,
    recentSales,
  };
}
