/**
 * A single cost line. Every cost can be expressed as a fixed amount, a
 * percentage of the selling price, or both (e.g. a payment fee of 2.9% + $0.30).
 */
export interface CostComponent {
  /** Fixed amount in major currency units. */
  fixed: number;
  /** Percentage of selling price, as a percent value (10 === 10%). */
  percent: number;
}

/**
 * The full set of costs that erode a product's profit. Each named line maps to
 * the real-world cost categories sellers track.
 */
export interface CostBreakdown {
  /** What it cost you to acquire/produce the item. */
  purchase: CostComponent;
  /** Shipping / fulfilment cost. */
  shipping: CostComponent;
  /** Packaging / materials. */
  packaging: CostComponent;
  /** Marketplace commission (often a percentage). */
  marketplaceFees: CostComponent;
  /** Payment processor fees (often percent + fixed). */
  paymentFees: CostComponent;
  /** Sales tax / VAT applied to the sale. */
  taxes: CostComponent;
  /** Any other costs. */
  other: CostComponent;
}

export const COST_LINES = [
  "purchase",
  "shipping",
  "packaging",
  "marketplaceFees",
  "paymentFees",
  "taxes",
  "other",
] as const;

export type CostLine = (typeof COST_LINES)[number];

export function emptyCostComponent(): CostComponent {
  return { fixed: 0, percent: 0 };
}

export function emptyCostBreakdown(): CostBreakdown {
  return {
    purchase: emptyCostComponent(),
    shipping: emptyCostComponent(),
    packaging: emptyCostComponent(),
    marketplaceFees: emptyCostComponent(),
    paymentFees: emptyCostComponent(),
    taxes: emptyCostComponent(),
    other: emptyCostComponent(),
  };
}

/** Merge a partial breakdown over an empty one (useful for forms/defaults). */
export function makeCostBreakdown(partial: Partial<CostBreakdown> = {}): CostBreakdown {
  const base = emptyCostBreakdown();
  for (const line of COST_LINES) {
    if (partial[line]) base[line] = { ...base[line], ...partial[line] };
  }
  return base;
}
