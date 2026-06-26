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
}

export type NewSale = Omit<Sale, "id">;
