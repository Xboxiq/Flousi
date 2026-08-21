import {
  calculateOrder,
  costsByProduct,
  deliveryMargin,
  type Order,
  type OrderLineInput,
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
      return {
        order,
        lines,
        names: lines.map((l) => nameById.get(l.productId) ?? "منتج محذوف"),
        result: calculateOrder({ order, lines: inputs, costsByProduct: costs }),
        repName: order.repId ? repById.get(order.repId) : undefined,
        lineCount: lines.length,
        units: lines.reduce((s, l) => s + Math.max(0, l.quantity), 0),
      };
    })
    .sort((a, b) => (b.order.placedAt ?? "").localeCompare(a.order.placedAt ?? ""));

  return {
    rows: input.limit ? rows.slice(0, input.limit) : rows,
    total: rows.length,
    subsidised: rows.filter((r) => r.result.deliveryMargin < 0).length,
    deliveryMarginTotal: rows.reduce((s, r) => s + r.result.deliveryMargin, 0),
    looseSales,
  };
}

/**
 * The delivery reading for a window: what was charged, what was paid, and the gap.
 *
 * This is the figure the app was blind to before P4. A merchant who charges a fixed
 * fee «on the customer» can be losing money on every trip without a line anywhere
 * telling him.
 */
export interface DeliveryReading {
  charged: number;
  paid: number;
  margin: number;
  trips: number;
  /** Trips that lost money on delivery. */
  subsidised: number;
  /** margin / charged, or 0 when nothing was charged. */
  rate: number;
}

export function computeDelivery(orders: readonly Order[]): DeliveryReading {
  let charged = 0;
  let paid = 0;
  let subsidised = 0;
  for (const order of orders) {
    const c = Number.isFinite(order.deliveryCharged) ? order.deliveryCharged : 0;
    const p = Number.isFinite(order.deliveryPaid) ? order.deliveryPaid : 0;
    charged += c;
    paid += p;
    if (deliveryMargin(order) < 0) subsidised += 1;
  }
  const margin = charged - paid;
  return {
    charged,
    paid,
    margin,
    trips: orders.length,
    subsidised,
    rate: charged === 0 ? 0 : margin / charged,
  };
}

/** Kept for the loose-sales path: a sale with no trip still has its own profit. */
export function looseSaleProfit(sale: Sale, products: readonly Product[]) {
  return profitForSale(
    sale,
    products.find((p) => p.id === sale.productId),
  );
}
