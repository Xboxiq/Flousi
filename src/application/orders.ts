import {
  calculateOrder,
  costsByProduct,
  isFreeDelivery,
  isVoidOrder,
  orderOutcome,
  orderStatus,
  type Order,
  type OrderLineInput,
  type OrderOutcome,
  type OrderResult,
  type Product,
  type Rep,
  type Sale,
} from "@/domain";
import { profitForSale } from "./analytics";

/** One row on `/orders`: the trip, its goods, and what it actually made. */
export interface OrderRow {
  order: Order;
  /** The sales that are lines of this order, oldest first within the order. */
  lines: Sale[];
  /** Product name per line, for display without a second join. */
  names: string[];
  result: OrderResult;
  /**
   * What the trip actually DID, given its state. `result` is what it would make if
   * it completed; these two are the same figure only for a delivered trip, and the
   * screen must never print one while meaning the other (gate P5/G3).
   */
  outcome: OrderOutcome;
  repName?: string;
  /** How many distinct products the trip carried. */
  lineCount: number;
  /** Total units across the lines. */
  units: number;
}

export interface OrdersView {
  rows: OrderRow[];
  /** Everything before the window, so a screen can say «12 من 88». */
  total: number;
  /** Trips whose delivery LOST money. The count a merchant should act on. */
  subsidised: number;
  /** Sum of the delivery margins, in the account currency. */
  deliveryMarginTotal: number;
  /** How many trips are still on the road. */
  pending: number;
  /** Delivered trips whose cash is still with the courier. */
  withCourier: number;
  /** Trips that came back or were cancelled. */
  voided: number;
  /**
   * Sales that are NOT lines of any order — every sale recorded before P4, and every
   * one recorded straight from a product page. Reported rather than hidden, because
   * they are real money that simply has no trip attached.
   */
  looseSales: number;
}

/**
 * «الطلبيات» — sales grouped into the trips that carried them.
 *
 * Sales remain the line item, so this joins rather than replaces: an order row is its
 * `Order` plus the sales pointing at it. A sale with no `orderId` is not invented into
 * a one-line order here — it is counted as loose, because pretending a trip happened
 * would invent a delivery fee of zero and quietly flatter the delivery margin.
 */
export function computeOrders(input: {
  orders: readonly Order[];
  sales: readonly Sale[];
  products: readonly Product[];
  reps: readonly Rep[];
  /** How many rows to return, newest first. Omit for all. */
  limit?: number;
  /** Restricts to one rep's own trips. */
  scope?: { repId: string } | "none";
}): OrdersView {
  const { orders, sales, products, reps, scope } = input;
  const allows = (subject: { repId?: string }) =>
    scope === undefined ? true : scope === "none" ? false : subject.repId === scope.repId;

  const costs = costsByProduct(products);
  const nameById = new Map(products.map((p) => [p.id, p.name]));
  const repById = new Map(reps.map((r) => [r.id, r.name]));

  const linesByOrder = new Map<string, Sale[]>();
  let looseSales = 0;
  for (const sale of sales) {
    if (!allows(sale)) continue;
    if (!sale.orderId) {
      looseSales += 1;
      continue;
    }
    const bucket = linesByOrder.get(sale.orderId);
    if (bucket) bucket.push(sale);
    else linesByOrder.set(sale.orderId, [sale]);
  }

  const rows: OrderRow[] = orders
    .filter(allows)
    .map((order) => {
      const lines = (linesByOrder.get(order.id) ?? [])
        .slice()
        .sort((a, b) => (a.soldAt ?? "").localeCompare(b.soldAt ?? "") || a.id.localeCompare(b.id));
      const inputs: OrderLineInput[] = lines.map((l) => ({
        id: l.id,
        productId: l.productId,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
      }));
      const result = calculateOrder({ order, lines: inputs, costsByProduct: costs });
      return {
        order,
        lines,
        names: lines.map((l) => nameById.get(l.productId) ?? "منتج محذوف"),
        result,
        outcome: orderOutcome({ order, result }),
        repName: order.repId ? repById.get(order.repId) : undefined,
        lineCount: lines.length,
        units: lines.reduce((s, l) => s + Math.max(0, l.quantity), 0),
      };
    })
    .sort((a, b) => (b.order.placedAt ?? "").localeCompare(a.order.placedAt ?? ""));

  // A trip that never arrived did not lose money on its delivery MARGIN — it lost
  // the delivery outright, which the cash reading reports. Counting it here too
  // would double-count the same loss under two different names.
  const settled = rows.filter((r) => !isVoidOrder(orderStatus(r.order)));
  return {
    rows: input.limit ? rows.slice(0, input.limit) : rows,
    total: rows.length,
    subsidised: settled.filter((r) => r.result.deliveryMargin < 0).length,
    deliveryMarginTotal: settled.reduce((s, r) => s + r.result.deliveryMargin, 0),
    pending: rows.filter((r) => orderStatus(r.order) === "pending").length,
    withCourier: rows.filter((r) => r.outcome.cash === "withCourier").length,
    voided: rows.filter((r) => isVoidOrder(orderStatus(r.order))).length,
    looseSales,
  };
}

/**
 * The delivery reading for a window: what was charged, what was paid, and the gap.
 *
 * This is the figure the app was blind to before P4. A merchant who charges a fixed
 * fee «on the customer» can be losing money on every trip without a line anywhere
 * telling him.
 *
 * REALISED, not contracted (P5): a trip that came back collected no delivery fee and
 * paid for two legs, and a cancelled trip neither charged nor paid. Reading the
 * order's stored figures regardless of state would credit the merchant with fees he
 * never received.
 */
export interface DeliveryReading {
  /** Delivery money actually collected. A returned trip contributes nothing. */
  charged: number;
  /** Delivery actually paid out, including the return leg. */
  paid: number;
  margin: number;
  /** Trips that have settled — delivered, returned or cancelled. */
  trips: number;
  /** Settled trips that lost money on delivery. */
  subsidised: number;
  /** margin / charged, or 0 when nothing was charged. */
  rate: number;
  /**
   * Delivered trips whose fee was WAIVED while the courier was still paid — the
   * free-delivery offer. Their cost is in `paid` and `margin` like any other, but
   * they are not counted `subsidised`: the merchant chose this, and a warning that
   * scolds a deliberate offer as a mistake teaches him to ignore warnings (P6/G2).
   */
  freeTrips: number;
  /**
   * Trips still on the road, excluded from every figure above. A fee that has not
   * been collected is not a fee, and a courier not yet paid is not a cost.
   */
  inFlight: number;
}

export function computeDelivery(orders: readonly Order[]): DeliveryReading {
  let charged = 0;
  let paid = 0;
  let trips = 0;
  let subsidised = 0;
  let inFlight = 0;
  let freeTrips = 0;
  for (const order of orders) {
    const status = orderStatus(order);
    if (status === "pending") {
      inFlight += 1;
      continue;
    }
    trips += 1;
    if (status === "cancelled") continue;
    const c = Number.isFinite(order.deliveryCharged) ? order.deliveryCharged : 0;
    const p = Number.isFinite(order.deliveryPaid) ? order.deliveryPaid : 0;
    const back = Number.isFinite(order.returnCost) ? (order.returnCost as number) : 0;
    if (status === "returned") {
      // Nothing was collected on a trip that came back, and the courier was paid
      // for both legs. That is the whole cost of a return (gate P5/G1).
      paid += p + back;
      subsidised += 1;
      continue;
    }
    charged += c;
    paid += p;
    if (isFreeDelivery(order)) freeTrips += 1;
    else if (c - p < 0) subsidised += 1;
  }
  const margin = charged - paid;
  return {
    charged,
    paid,
    margin,
    trips,
    subsidised,
    rate: charged === 0 ? 0 : margin / charged,
    inFlight,
    freeTrips,
  };
}

/** Kept for the loose-sales path: a sale with no trip still has its own profit. */
export function looseSaleProfit(sale: Sale, products: readonly Product[]) {
  return profitForSale(
    sale,
    products.find((p) => p.id === sale.productId),
  );
}
