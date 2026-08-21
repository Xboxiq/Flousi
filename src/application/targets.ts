import {
  TargetCalculator,
  targetScope,
  type Product,
  type Rep,
  type Sale,
  type Target,
  type TargetMetric,
  type TargetProgress,
  type TargetScope,
} from "@/domain";
import { profitForSale } from "./analytics";

/** One row on `/targets`: who or what is aimed at, and how the month is going. */
export interface TargetRow {
  /** Stable key for the row (the resolved target's id, or a synthetic scope key). */
  key: string;
  scope: TargetScope;
  /** «الحساب» · a rep's name · a product's name. */
  name: string;
  /** Set for a rep row. */
  repId?: string;
  /** Set for a product row. */
  productId?: string;
  metric: TargetMetric;
  /** The row the resolver picked, or null when nothing is set for this subject. */
  target: Target | null;
  /** True when a month-specific override answered rather than a standing row. */
  fromOverride: boolean;
  progress: TargetProgress;
}

export interface TargetsView {
  month: string;
  /** The account's own row, always present even with no target set. */
  account: TargetRow;
  /** Rep rows: every active rep, plus any archived rep that still has a target. */
  reps: TargetRow[];
  /** Product rows: only products that actually have a target — never all of them. */
  products: TargetRow[];
  /** How many of the rows above have a target at all. */
  withTarget: number;
  /** Rows that have a target and are behind pace. */
  behind: number;
}

function monthOf(iso: string): string {
  return iso.slice(0, 7);
}

/** Actuals for one month, from the sales themselves. */
interface Actuals {
  netProfit: number;
  revenue: number;
  units: number;
  byRep: Map<string, { netProfit: number; revenue: number; units: number }>;
  byProduct: Map<string, { netProfit: number; revenue: number; units: number }>;
}

function emptyBucket() {
  return { netProfit: 0, revenue: 0, units: 0 };
}

function collectActuals(sales: readonly Sale[], products: readonly Product[], month: string): Actuals {
  const productById = new Map(products.map((p) => [p.id, p]));
  const out: Actuals = {
    ...emptyBucket(),
    byRep: new Map(),
    byProduct: new Map(),
  };
  for (const sale of sales) {
    if (monthOf(sale.soldAt) !== month) continue;
    const p = profitForSale(sale, productById.get(sale.productId));
    out.netProfit += p.netProfit;
    out.revenue += p.revenue;
    out.units += sale.quantity;

    if (sale.repId) {
      const bucket = out.byRep.get(sale.repId) ?? emptyBucket();
      bucket.netProfit += p.netProfit;
      bucket.revenue += p.revenue;
      bucket.units += sale.quantity;
      out.byRep.set(sale.repId, bucket);
    }
    const pb = out.byProduct.get(sale.productId) ?? emptyBucket();
    pb.netProfit += p.netProfit;
    pb.revenue += p.revenue;
    pb.units += sale.quantity;
    out.byProduct.set(sale.productId, pb);
  }
  return out;
}

function pick(bucket: { netProfit: number; revenue: number; units: number }, metric: TargetMetric) {
  return metric === "revenue" ? bucket.revenue : metric === "units" ? bucket.units : bucket.netProfit;
}

/**
 * «كم استهدف» for one month, across all three scopes.
 *
 * A rep with no target still gets a row: the screen's job is to show that the
 * target is MISSING, which is a state a merchant needs to see and act on — not a
 * row to hide. Products are the exception, because a store can hold hundreds and
 * a row per product with no target set is noise, not information.
 */
export function computeTargets(input: {
  targets: readonly Target[];
  sales: readonly Sale[];
  products: readonly Product[];
  reps: readonly Rep[];
  month: string;
  /** ISO timestamp the pace is measured at. Always injected. */
  asOf: string;
  /** Which metric the screen is reading. */
  metric?: TargetMetric;
  /**
   * Restricts the view to one rep: their own row, measured against their own sales,
   * and NO account row — the store's target is not theirs to read (gate P3/G3).
   */
  scope?: { repId: string } | "none";
}): TargetsView {
  const { targets, products, month, asOf, scope } = input;
  const metric = input.metric ?? "netProfit";
  const list = targets.slice();
  // Filtered at the source: a scoped session's account figure must not be computed
  // from sales it may not read, because that figure is printed on the screen.
  const sales =
    scope === undefined
      ? input.sales
      : scope === "none"
        ? []
        : input.sales.filter((sale) => sale.repId === scope.repId);
  const reps =
    scope === undefined || scope === "none"
      ? scope === "none"
        ? []
        : input.reps
      : input.reps.filter((r) => r.id === scope.repId);
  const actuals = collectActuals(sales, products, month);

  const row = (
    args: { scope: TargetScope; name: string; repId?: string; productId?: string; actual: number },
  ): TargetRow => {
    const res = TargetCalculator.resolve(list, {
      metric,
      month,
      repId: args.repId,
      productId: args.productId,
    });
    // A rep or product read falls back to the account's target by design (the
    // resolver's last rung). On a per-subject row that inheritance would be a
    // lie — «هدف سارة» is not the account's whole target — so a row only counts
    // a target that was set at ITS OWN scope.
    const own = args.scope === "account" ? res : res.scope === args.scope ? res : null;
    return {
      key: own?.target?.id ?? `${args.scope}:${args.repId ?? args.productId ?? "account"}`,
      scope: args.scope,
      name: args.name,
      repId: args.repId,
      productId: args.productId,
      metric,
      target: own?.target ?? null,
      fromOverride: own?.fromOverride ?? false,
      progress: TargetCalculator.progress({
        target: own?.target ?? null,
        actual: args.actual,
        month,
        asOf,
      }),
    };
  };

  const account = row({
    scope: "account",
    name: "الحساب",
    actual: pick(actuals, metric),
  });

  const repRows = reps
    .filter(
      (r) =>
        r.status === "active" ||
        list.some((t) => t.repId === r.id && t.status === "active") ||
        actuals.byRep.has(r.id),
    )
    .map((r) =>
      row({
        scope: "rep",
        name: r.name,
        repId: r.id,
        actual: pick(actuals.byRep.get(r.id) ?? emptyBucket(), metric),
      }),
    );

  // A scoped session gets no product rows: a product's target is the store's number,
  // and it is not narrowed by who sold it.
  const targetedProductIds = new Set(
    list
      .filter((t) => t.status === "active" && targetScope(t) === "product" && t.productId)
      .map((t) => t.productId as string),
  );
  const productRows = (scope === undefined ? products : [])
    .filter((p) => targetedProductIds.has(p.id))
    .map((p) =>
      row({
        scope: "product",
        name: p.name,
        productId: p.id,
        actual: pick(actuals.byProduct.get(p.id) ?? emptyBucket(), metric),
      }),
    );

  const all = [account, ...repRows, ...productRows];
  return {
    month,
    account,
    reps: repRows,
    products: productRows,
    withTarget: all.filter((r) => r.progress.hasTarget).length,
    behind: all.filter((r) => r.progress.hasTarget && !r.progress.onPace).length,
  };
}
