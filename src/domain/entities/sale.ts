import type { CommissionSnapshot } from "./commission-snapshot";

/**
 * A recorded sale of a product. The unit price at sale time is captured so
 * historical revenue is accurate even if the product's list price later changes.
 */
export interface Sale {
  id: string;
  productId: string;
  quantity: number;
  /** Actual price per unit at the time of sale, in major units. */
  unitPrice: number;
  currency: string;
  /** ISO timestamp. */
  soldAt: string;
  /** The accounting period this sale belongs to (assigned at record time). */
  periodId?: string;
  notes?: string;

  /** The rep credited with this sale. Absent = the owner sold it directly. */
  repId?: string;
  /**
   * The frozen split. Absent means either no rep, or no scheme was resolvable
   * at record time. Never recomputed, never migrated, never rewritten by a
   * later scheme edit — both fields are optional, so every already-stored sale
   * stays valid without a migration.
   */
  commissionSnapshot?: CommissionSnapshot;
}

export type NewSale = Omit<Sale, "id">;

/**
 * A rep was credited but no scheme could be frozen — the sale is real, recorded,
 * and surfaces in a fixable state rather than blocking the merchant.
 *
 * Derived rather than a stored flag: the moment the merchant adds the missing
 * rule and the sale is re-split, the condition clears itself.
 */
export function needsCommissionScheme(sale: Sale): boolean {
  return sale.repId !== undefined && sale.commissionSnapshot === undefined;
}
