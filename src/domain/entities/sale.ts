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
  /**
   * The delivery order this sale is a line of.
   *
   * Absent = a sale of its own, which is every sale recorded before P4 and every
   * single-product sale after it. The `Order` row holds what belongs to the TRIP (the
   * delivery fee on both sides, the customer, the allocation method); the sale keeps
   * holding what belongs to the goods. Nothing about an existing sale is rewritten by
   * this — additively adding one optional field is the whole change (gate P4/G0).
   */
  orderId?: string;
  /**
   * This line's allocated share of its order's discount, in major units.
   *
   * DENORMALISED on purpose: the order holds the offer, but revenue is read per sale
   * everywhere (the ledger, the dashboard, the commission engine), and a reader that
   * had to re-run the order allocation to know what one sale brought in would be a
   * reader that sometimes forgets to. Written once at record time by the same
   * allocation that computed the order's own figures, so the two can never disagree
   * (gate P6/G1). Absent = no offer, which is every sale recorded before P6.
   */
  discount?: number;
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
