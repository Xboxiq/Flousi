import { ProfitCalculator, type Product, type Sale } from "@/domain";

export interface SaleProfit {
  sale: Sale;
  product: Product | undefined;
  revenue: number;
  totalCost: number;
  netProfit: number;
  margin: number;
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
  todayProfit: number;
  saleCount: number;
  monthly: MonthlyPoint[];
  topProducts: TopProduct[];
  recentSales: RecentSale[];
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Compute profit for a single sale using the product's cost structure. */
export function profitForSale(sale: Sale, product: Product | undefined): SaleProfit {
  if (!product) {
    return { sale, product, revenue: 0, totalCost: 0, netProfit: 0, margin: 0 };
  }
  const r = ProfitCalculator.calculate({
    sellingPrice: sale.unitPrice,
    costs: product.costs,
    currency: sale.currency,
    quantity: sale.quantity,
  });
  return {
    sale,
    product,
    revenue: r.revenue,
    totalCost: r.totalCost,
    netProfit: r.netProfit,
    margin: r.margin,
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
  let todayProfit = 0;

  const monthlyMap = new Map<string, MonthlyPoint>();
  const productAgg = new Map<string, TopProduct>();

  // Seed the trailing month buckets so the chart has continuous x-axis.
  for (let i = monthsWindow - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyMap.set(key, { key, label: MONTH_LABELS[d.getMonth()], revenue: 0, netProfit: 0 });
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
    }
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

  return {
    currency,
    revenue: round2(revenue),
    totalCost: round2(totalCost),
    netProfit: round2(netProfit),
    margin: revenue ? netProfit / revenue : 0,
    monthProfit: round2(monthProfit),
    monthRevenue: round2(monthRevenue),
    todayProfit: round2(todayProfit),
    saleCount: sales.length,
    monthly: [...monthlyMap.values()],
    topProducts,
    recentSales,
  };
}
