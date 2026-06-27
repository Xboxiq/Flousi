import type { ExportableTable, Product, Sale } from "@/domain";
import { COST_LINES, ProfitCalculator } from "@/domain";
import { profitForSale } from "./analytics";

export type ReportType = "monthly" | "yearly" | "product" | "profit" | "expense";

export const REPORT_META: Record<ReportType, { title: string; description: string }> = {
  monthly: { title: "تقرير شهري", description: "الإيراد والتكلفة وصافي الربح لكل شهر." },
  yearly: { title: "تقرير سنوي", description: "الإيراد والتكلفة وصافي الربح السنوي." },
  product: { title: "تقرير المنتجات", description: "الوحدات والإيراد والربح لكل منتج." },
  profit: { title: "تقرير الأرباح", description: "اتجاه صافي الربح والهامش شهريًا." },
  expense: { title: "تقرير المصاريف", description: "إجمالي التكاليف مصنّفة حسب الفئة." },
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
const COST_LABELS: Record<string, string> = {
  purchase: "تكلفة الشراء",
  shipping: "التوصيل",
  packaging: "التغليف",
  marketplaceFees: "رسوم المنصّة",
  paymentFees: "رسوم الدفع",
  taxes: "الضرائب",
  other: "أخرى",
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
        { label: "المنتج", kind: "text" },
        { label: "SKU", kind: "text" },
        { label: "الوحدات", kind: "number" },
        { label: "الإيراد", kind: "money" },
        { label: "إجمالي التكلفة", kind: "money" },
        { label: "صافي الربح", kind: "profit" },
        { label: "الهامش", kind: "percent" },
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
        { label: "بند التكلفة", kind: "text" },
        { label: "المبلغ", kind: "money" },
        { label: "النسبة", kind: "percent" },
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
        { label: "الفترة", kind: "text" },
        { label: "صافي الربح", kind: "profit" },
        { label: "الهامش", kind: "percent" },
      ],
      rows: ordered.map((b) => [b.label, round2(b.netProfit), margin(b)]),
    };
  }

  return {
    type,
    title: type === "yearly" ? REPORT_META.yearly.title : REPORT_META.monthly.title,
    columns: [
      { label: type === "yearly" ? "السنة" : "الشهر", kind: "text" },
      { label: "الإيراد", kind: "money" },
      { label: "إجمالي التكلفة", kind: "money" },
      { label: "صافي الربح", kind: "profit" },
      { label: "الهامش", kind: "percent" },
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

/**
 * Per-period net-profit report: every product sold within the period with its
 * units, revenue, total cost, net profit and margin, plus a TOTAL row.
 * This is the document exported when closing / archiving a month.
 */
export function buildPeriodReport(
  periodLabel: string,
  periodId: string,
  products: Product[],
  sales: Sale[],
): Report {
  const productById = new Map(products.map((p) => [p.id, p]));
  const periodSales = sales.filter((s) => s.periodId === periodId);

  const agg = new Map<string, Bucket & { units: number; name: string; sku: string }>();
  for (const sale of periodSales) {
    const product = productById.get(sale.productId);
    const sp = profitForSale(sale, product);
    const cur =
      agg.get(sale.productId) ??
      ({ ...emptyBucket(), units: 0, name: product?.name ?? "Unknown", sku: product?.sku ?? "" });
    cur.revenue += sp.revenue;
    cur.totalCost += sp.totalCost;
    cur.netProfit += sp.netProfit;
    cur.units += sale.quantity;
    agg.set(sale.productId, cur);
  }

  const rows: (string | number)[][] = [...agg.values()]
    .sort((a, b) => b.netProfit - a.netProfit)
    .map((r) => [r.name, r.sku || "—", r.units, round2(r.revenue), round2(r.totalCost), round2(r.netProfit), margin(r)]);

  // TOTAL row
  const totals = [...agg.values()].reduce(
    (acc, r) => {
      acc.revenue += r.revenue;
      acc.totalCost += r.totalCost;
      acc.netProfit += r.netProfit;
      acc.units += r.units;
      return acc;
    },
    { revenue: 0, totalCost: 0, netProfit: 0, units: 0 },
  );
  if (rows.length > 0) {
    rows.push([
      "الإجمالي",
      "",
      totals.units,
      round2(totals.revenue),
      round2(totals.totalCost),
      round2(totals.netProfit),
      totals.revenue ? totals.netProfit / totals.revenue : 0,
    ]);
  }

  return {
    type: "product",
    title: `${periodLabel} — صافي الربح`,
    columns: [
      { label: "المنتج", kind: "text" },
      { label: "SKU", kind: "text" },
      { label: "الوحدات", kind: "number" },
      { label: "الإيراد", kind: "money" },
      { label: "إجمالي التكلفة", kind: "money" },
      { label: "صافي الربح", kind: "profit" },
      { label: "الهامش", kind: "percent" },
    ],
    rows,
  };
}
