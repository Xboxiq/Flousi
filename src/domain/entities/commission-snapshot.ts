import type { CommissionSchemeParams } from "./commission-scheme";
import type { SchemeTier } from "./commission-assignment";

/**
 * The frozen split, stored inside the Sale.
 *
 * Self-sufficient BY VALUE: it must render correctly after the scheme is
 * deleted, the rep is archived and the account currency is changed — so it
 * holds no foreign-key-only fields and reading it performs no lookup and no
 * recompute. Scheme edits therefore bind new sales only.
 *
 * `revenueMinor` and `netProfitMinor` are frozen alongside `basisMinor` because
 * an `afterPurchaseCost` sale has TWO owner figures to show: `ownerShareMinor`
 * (what the split contract says) and net profit minus the rep's share (what the
 * owner actually pocketed). Collapsing them would either understate the rep's
 * entitlement or credit the owner with money they never saw.
 */
export interface CommissionSnapshot {
  /** Copies for audit and labels, never used for a lookup. */
  schemeId: string;
  schemeName: string;
  /** Which tier of the chain won, for the audit trail. */
  schemeTier: SchemeTier;
  /** The scheme's calculation parameters, frozen as values. */
  params: CommissionSchemeParams;
  repId: string;
  /** Name copy: the label must outlive the rep record. */
  repName: string;
  /** The sale's currency at record time. */
  currency: string;
  revenueMinor: number;
  netProfitMinor: number;
  /** The amount that was split, per `params.profitBasis`. May be negative. */
  basisMinor: number;
  repShareMinor: number;
  ownerShareMinor: number;
  /** ISO timestamp from the Clock port at record time. */
  calculatedAt: string;
}

/**
 * Did lossPolicy zero the rep on this sale? Derived, never stored — a stored
 * copy could contradict the figures beside it.
 */
export function lossPolicyApplied(s: CommissionSnapshot): boolean {
  return s.basisMinor < 0 && s.params.lossPolicy === "ownerOnly";
}

/**
 * What the owner really keeps: net profit minus the rep's share. Differs from
 * `ownerShareMinor` whenever the basis excluded costs the owner still paid.
 * `norm0` guard: a -0 here would render as "−0.00".
 */
export function ownerKeepsMinor(s: CommissionSnapshot): number {
  const v = s.netProfitMinor - s.repShareMinor;
  return v === 0 ? 0 : v;
}
