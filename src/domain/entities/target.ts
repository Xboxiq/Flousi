export type TargetMetric = "netProfit" | "revenue" | "units";
export type TargetStatus = "active" | "archived";

/**
 * A level a month is measured against.
 *
 * Two axes, deliberately separate:
 *
 *  - **Scope** — whose target it is: the account's, a rep's, or a product's.
 *  - **Month** — a standing target that applies to every month (`month`
 *    absent), or an override for one month only (`month` set).
 *
 * Both narrow independently, and the resolver walks them most-specific first.
 * That is the SAME precedence shape as `CommissionAssignment` (product×rep →
 * product → rep → account default) on purpose: a second, differently-shaped
 * precedence rule inside one product is a bug waiting to be reasoned about
 * wrongly.
 */
export interface Target {
  id: string;
  /** What is being measured. */
  metric: TargetMetric;
  /**
   * The level to reach, in **MAJOR units** for the money metrics (and a plain
   * count for `units`).
   *
   * Major, not the integer minor units the commission engine uses. A target is
   * compared against `application/analytics` output, which is major throughout,
   * and silently mixing the two scales by a factor of 100 is the most expensive
   * mistake available in this codebase. The scale is stated here so no caller
   * has to guess it (gate P2/G8).
   */
  amount: number;
  /** `yyyy-mm`. Absent = a standing target that applies to every month. */
  month?: string;
  /** Set = this rep's target. */
  repId?: string;
  /** Set = this product's target. */
  productId?: string;
  status: TargetStatus;
  /** ISO timestamps. */
  createdAt: string;
  updatedAt: string;
}

export type NewTarget = Omit<Target, "id" | "createdAt" | "updatedAt">;

export type TargetScope = "rep" | "product" | "account";

/**
 * Which scope a row belongs to. A row carrying both ids is not a valid
 * combination in this product — a target belongs to a person or to a thing, not
 * to a person's sales of one thing — so `repId` is read first and the extra id
 * is ignored rather than inventing a fourth rung nothing can set.
 */
export function targetScope(target: Pick<Target, "repId" | "productId">): TargetScope {
  if (target.repId) return "rep";
  if (target.productId) return "product";
  return "account";
}

/** Higher wins. Mirrors `SCHEME_TIER_RANK`. */
export const TARGET_SCOPE_RANK: Record<TargetScope, number> = {
  rep: 2,
  product: 2,
  account: 1,
};

/** `yyyy-mm` for the month an ISO timestamp falls in. */
export function targetMonthKey(iso: string): string {
  return iso.slice(0, 7);
}
