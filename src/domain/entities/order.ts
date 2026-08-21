import type { RoundingBeneficiary } from "./commission-scheme";

/**
 * How one delivery fee is spread across the lines of an order, for the sake of
 * per-product profit.
 *
 * The ORDER's profit is exact under every method — the fee is a fact about the
 * order. Only a LINE's profit depends on this choice, and it is therefore always
 * labelled on screen as carrying an allocated share rather than a measured cost.
 */
export type DeliveryAllocation =
  /** Proportional to line value. The ERP default for goods of similar nature. */
  | "byValue"
  /** Equal per unit. Right when the items are alike and the fee tracks pieces. */
  | "byQuantity"
  /** No spread at all: the fee stays a fact about the order and never enters a line. */
  | "orderOnly";

export const DELIVERY_ALLOCATIONS: DeliveryAllocation[] = [
  "byValue",
  "byQuantity",
  "orderOnly",
];

export const DELIVERY_ALLOCATION_LABELS: Record<DeliveryAllocation, string> = {
  byValue: "بالقيمة",
  byQuantity: "بالكمية",
  orderOnly: "على الطلبية فقط",
};

/**
 * A delivery order: one trip to one customer, carrying one or more sales.
 *
 * `Sale` remains the line item and is NOT rewritten by this feature — it gains an
 * `orderId` and nothing else. Existing sales are orders of one with no `orderId`, and
 * every frozen `commissionSnapshot` already stored is left byte for byte alone
 * (gate P4/G0). Rewriting 219 stored sales to make the model tidier would put every
 * frozen split at risk for no gain to the merchant.
 *
 * What lives HERE is what belongs to the trip rather than to a product: the delivery
 * fee on both sides, the customer, and how the fee is spread for per-line reporting.
 */
export interface Order {
  id: string;
  /**
   * A short human reference the merchant can say on the phone («ط-1043»).
   * Generated, but editable, because the number a merchant already writes on the box
   * beats one we invented for him.
   */
  code?: string;
  currency: string;
  /** ISO timestamp the order was taken. */
  placedAt: string;
  periodId?: string;
  /** The rep credited with the whole trip. Lines inherit it. */
  repId?: string;

  /**
   * Delivery **charged to the customer** — in major units.
   *
   * This is REVENUE, not a negative cost. In this market the fee is a fixed amount
   * on the customer (commonly 5,000 to 10,000 IQD) and it is never netted against
   * what the courier is paid: netting the two hides whether delivery makes or loses
   * money, which is the one figure about delivery a merchant cannot otherwise see
   * (gate P4/G1). Zero is a real value and means free delivery.
   */
  deliveryCharged: number;
  /**
   * Delivery **paid to the courier** — in major units. This is the COST side.
   * Charged minus paid is the order's delivery margin, and it can be negative.
   */
  deliveryPaid: number;
  /** How `deliveryPaid` is spread over the lines for per-product profit. */
  deliveryAllocation: DeliveryAllocation;

  customerName?: string;
  customerPhone?: string;
  /** Where it went. Free text: governorates and districts are not a fixed list here. */
  customerArea?: string;
  notes?: string;

  /** ISO timestamps. */
  createdAt: string;
  updatedAt: string;
}

export type NewOrder = Omit<Order, "id" | "createdAt" | "updatedAt">;

/** One line of an order, as the caller hands it to the calculator. */
export interface OrderLineInput {
  /** Matches the `Sale.id` once recorded; any stable key before that. */
  id: string;
  productId: string;
  quantity: number;
  /** Actual price per unit, major units. */
  unitPrice: number;
}

/** What one line was allocated, and why. */
export interface DeliveryShare {
  lineId: string;
  /** Major units. Sums exactly to the order's `deliveryPaid` across all lines. */
  amount: number;
}

/**
 * The delivery margin: what the customer paid for delivery, minus what it cost.
 *
 * Positive = delivery earned money. Negative = the merchant subsidised the trip,
 * which is the case he is most likely to be blind to.
 */
export function deliveryMargin(order: Pick<Order, "deliveryCharged" | "deliveryPaid">): number {
  const charged = Number.isFinite(order.deliveryCharged) ? order.deliveryCharged : 0;
  const paid = Number.isFinite(order.deliveryPaid) ? order.deliveryPaid : 0;
  return charged - paid;
}

/** The default a new order opens with, so the merchant types the amount and nothing else. */
export function defaultAllocation(): DeliveryAllocation {
  return "byValue";
}

/** Re-exported so callers of the allocator do not need two imports. */
export type { RoundingBeneficiary };
