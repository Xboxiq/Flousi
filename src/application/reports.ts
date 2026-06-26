import type { ExportableTable, Product, Sale } from "@/domain";
import { COST_LINES, ProfitCalculator } from "@/domain";
import { profitForSale } from "./analytics";

export type ReportType = "monthly" | "yearly" | "product" | "profit" | "expense";

export const REPORT_META: Record<ReportType, { title: string; description: string }> = {
  monthly: { title: "Monthly report", description: "Revenue, cost and net profit per month." },
  yearly: { title: "Yearly report", description: "Annual revenue, cost and net profit." },
  product: { title: "Product report", description: "Units, revenue and profit by product." },
  profit: { title: "Profit report", description: "Net profit and margin trend per month." },
  expense: { title: "Expense report", description: "Total costs broken down by category." },
};

/** How a column's raw value should be rendered/exported. */
export type CellKind = "text" | "number" | "money" | "percent" | "profit";

export interface ReportColumn {
  label: string;
  kind: CellKind;
}

export interface Report {
  type: ReportType;
  title: string;
  columns: ReportColumn[];
  /** Raw values; presentation formats by column kind. Percent values are ratios. */
  rows: (string | number)[][];
}

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const COST_LABELS: Record<string, string> = {
  purchase: "Purchase cost",
  shipping: "Shipping",
  packaging: "Packaging",
  marketplaceFees: "Marketplace fees",
  paymentFees: "Payment fees",
  taxes: "Taxes",
  other: "Other",
};

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

interface Bucket {
  revenue: number;
  totalCost: number;
  netProfit: number;
}
const emptyBucket = (): Bucket => ({ revenue: 0, totalCost: 0, netProfit: 0 });
const margin = (b: Bucket) => (b.revenue ? b.netProfit / b.revenue : 0);

export function buildReport(type: ReportType, products: Product[], sales: Sale[]): Report {
  const productById = new Map(products.map((p) => [p.id, p]));
  const enriched = sales.map((s) => profitForSale(s, productById.get(s.productId)));

  if (type === "product") {
    const agg = new Map<string, Bucket & { units: number; name: string; sku: string }>();
    for (const sp of enriched) {
      if (!sp.product) continue;
      const cur = agg.get(sp.product.id) ?? {
        ...emptyBucket(),
        units: 0,
        name: sp.product.name,
        sku: sp.product.sku ?? "",
      };
      cur.revenue += sp.revenue;
      cur.totalCost += sp.totalCost;
      cur.netProfit += sp.netProfit;
      cur.units += sp.sale.quantity;
      agg.set(sp.product.id, cur);
    }
    return {
      type,
      title: REPORT_META.product.title,
      columns: [
        { label: "Product", kind: "text" },
        { label: "SKU", kind: "text" },
        { label: "Units", kind: "number" },
        { label: "Revenue", kind: "money" },
        { label: "Total cost", kind: "money" },
        { label: "Net profit", kind: "profit" },
        { label: "Margin", kind: "percent" },
      ],
      rows: [...agg.values()]
        .sort((a, b) => b.netProfit - a.netProfit)
        .map((r) => [
          r.name,
          r.sku || "—",
          r.units,
          round2(r.revenue),
          round2(r.totalCost),
          round2(r.netProfit),
          margin(r),
        ]),
    };
  }

  if (type === "expense") {
    const totals: Record<string, number> = {};
    let grand = 0;
    for (const sale of sales) {
      const product = productById.get(sale.productId);
      if (!product) continue;
      const res = ProfitCalculator.calculate({
        sellingPrice: sale.unitPrice,
        costs: product.costs,
        currency: sale.currency,
        quantity: sale.quantity,
      });
      for (const [line, amount] of Object.entries(res.costByLine)) {
        totals[line] = (totals[line] ?? 0) + amount;
        grand += amount;
      }
    }
    return {
      type,
      title: REPORT_META.expense.title,
      columns: [
        { label: "Cost line", kind: "text" },
        { label: "Amount", kind: "money" },
        { label: "Share", kind: "percent" },
      ],
      rows: COST_LINES.filter((l) => (totals[l] ?? 0) > 0).map((line) => [
        COST_LABELS[line],
        round2(totals[line] ?? 0),
        grand ? (totals[line] ?? 0) / grand : 0,
      ]),
    };
  }

  // Time-bucketed: monthly / yearly / profit
  const buckets = new Map<string, Bucket & { label: string; sort: number }>();
  for (const sp of enriched) {
    const d = new Date(sp.sale.soldAt);
    const isYear = type === "yearly";
    const key = isYear ? String(d.getFullYear()) : `${d.getFullYear()}-${d.getMonth()}`;
    const label = isYear ? key : `${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}`;
    const sort = isYear ? d.getFullYear() : d.getFullYear() * 12 + d.getMonth();
    const cur = buckets.get(key) ?? { ...emptyBucket(), label, sort };
    cur.revenue += sp.revenue;
    cur.totalCost += sp.totalCost;
    cur.netProfit += sp.netProfit;
    buckets.set(key, cur);
  }
  const ordered = [...buckets.values()].sort((a, b) => a.sort - b.sort);

  if (type === "profit") {
    return {
      type,
      title: REPORT_META.profit.title,
      columns: [
        { label: "Period", kind: "text" },
        { label: "Net profit", kind: "profit" },
        { label: "Margin", kind: "percent" },
      ],
      rows: ordered.map((b) => [b.label, round2(b.netProfit), margin(b)]),
    };
  }

  return {
    type,
    title: type === "yearly" ? REPORT_META.yearly.title : REPORT_META.monthly.title,
    columns: [
      { label: type === "yearly" ? "Year" : "Month", kind: "text" },
      { label: "Revenue", kind: "money" },
      { label: "Total cost", kind: "money" },
      { label: "Net profit", kind: "profit" },
      { label: "Margin", kind: "percent" },
    ],
    rows: ordered.map((b) => [
      b.label,
      round2(b.revenue),
      round2(b.totalCost),
      round2(b.netProfit),
      margin(b),
    ]),
  };
}

/** Map a Report to the export-friendly table (raw values; percents as ratios). */
export function toExportableTable(report: Report): ExportableTable {
  return {
    title: report.title,
    columns: report.columns.map((c) => c.label),
    rows: report.rows,
  };
}
