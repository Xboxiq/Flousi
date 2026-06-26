export type PeriodStatus = "open" | "closed";

/**
 * Snapshot of a period's financials, frozen when the period is closed so that
 * historical reports never drift as live data changes.
 */
export interface PeriodSummary {
  revenue: number;
  totalCost: number;
  netProfit: number;
  /** Profit margin as a ratio (0.42 === 42%). */
  margin: number;
  productCount: number;
  saleCount: number;
  currency: string;
}

/**
 * An accounting period (typically a month). Closing a period locks it: it
 * becomes read-only and its summary is snapshotted.
 */
export interface AccountingPeriod {
  id: string;
  /** Human label, e.g. "June 2026". */
  label: string;
  /** ISO date. */
  startDate: string;
  /** ISO date; open periods may omit this until closed. */
  endDate?: string;
  status: PeriodStatus;
  /** ISO timestamp set when closed. */
  closedAt?: string;
  /** Frozen totals, present once closed. */
  summary?: PeriodSummary;
}

export function isLocked(period: AccountingPeriod): boolean {
  return period.status === "closed";
}
