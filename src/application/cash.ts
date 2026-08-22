import {
  calculateOrder,
  costsByProduct,
  orderCollection,
  orderOutcome,
  orderStatus,
  type Order,
  type OrderLineInput,
  type OrderStatus,
  type Product,
  type Sale,
} from "@/domain";
import { profitForSale } from "./analytics";

/**
 * One state money can be in. Four of these, never one total.
 *
 * `collected` and `netProfit` are REALISED — what actually changed hands. `expected`
 * is what the trips in this bucket would collect if they all completed, and it is a
 * separate field precisely so the two can never be confused: a bucket where the two
 * differ is a bucket where the money has not arrived.
 */
export interface CashBucket {
  /** How many trips are in this state. */
  trips: number;
  /** Realised cash: goods plus delivery, actually handed over. Major units. */
  collected: number;
  /** Realised profit on that cash. Negative for a void trip: the delivery is spent. */
  netProfit: number;
  /** What these trips WOULD collect if they completed. Equals `collected` once they do. */
  expected: number;
}

/**
 * «كم ربحت» and «كم عندي» are different numbers.
 *
 * COD money in this market sits with the courier for days or weeks, so an app that
 * reports one figure is answering a question the merchant did not ask. This reports
 * four states separately and never adds them into a single «رصيدك» (gate P5/G3).
 */
export interface CashReading {
  currency: string;
  /** بيدك — delivered AND collected. The only figure that is actually spendable. */
  inHand: CashBucket;
  /** عند التوصيل — delivered, the cash still with the courier. Earned, not in hand. */
  withCourier: CashBucket;
  /** في الطريق — out; nothing realised yet. `expected` is the whole story here. */
  inFlight: CashBucket;
  /** راجعة / ملغاة — nothing collected, and the delivery paid is a real loss. */
  lost: CashBucket;
  /**
   * Sales with no trip: every sale recorded before P4, and every one recorded from a
   * product page. They are counted INSIDE `inHand` — that is what they were — and
   * reported here so the figure can be explained rather than just trusted (P5/G6).
   */
  looseSales: number;
  looseCollected: number;
  /**
   * inHand.netProfit + withCourier.netProfit + lost.netProfit — what the window
   * actually earned, including what the returns took back out. Excludes in-flight,
   * because an order still on the road has earned nothing.
   */
  earned: number;
  /** inHand.collected. What can be spent today, and nothing else. */
  spendable: number;
  /** withCourier.collected. Earned and real, but not yours to spend yet. */
  awaiting: number;
}

function bucket(): CashBucket {
  return { trips: 0, collected: 0, netProfit: 0, expected: 0 };
}

/**
 * Where the money is, by state.
 *
 * Orders are the unit, because delivery is charged and paid per trip. A sale with no
 * `orderId` is added to `inHand` rather than invented into a trip — pretending it had
 * one would create a delivery fee of zero and flatter the delivery margin (P4).
 */
export function computeCash(input: {
  orders: readonly Order[];
  sales: readonly Sale[];
  products: readonly Product[];
  currency: string;
  /** Restricts to one rep's own trips and their own loose sales. */
  scope?: { repId: string } | "none";
}): CashReading {
  const { orders, sales, products, currency, scope } = input;
  const allows = (subject: { repId?: string }) =>
    scope === undefined ? true : scope === "none" ? false : subject.repId === scope.repId;

  const costs = costsByProduct(products);
  const productById = new Map(products.map((p) => [p.id, p]));

  const linesByOrder = new Map<string, Sale[]>();
  const reading: CashReading = {
    currency,
    inHand: bucket(),
    withCourier: bucket(),
    inFlight: bucket(),
    lost: bucket(),
    looseSales: 0,
    looseCollected: 0,
    earned: 0,
    spendable: 0,
    awaiting: 0,
  };

  for (const sale of sales) {
    if (!allows(sale)) continue;
    if (!sale.orderId) {
      // No trip ever existed for this row, so it has no state to be in. It is money
      // the merchant already has, which is exactly what it was before P4.
      const p = profitForSale(sale, productById.get(sale.productId));
      reading.looseSales += 1;
      reading.looseCollected += p.revenue;
      reading.inHand.collected += p.revenue;
      reading.inHand.expected += p.revenue;
      reading.inHand.netProfit += p.netProfit;
      continue;
    }
    const found = linesByOrder.get(sale.orderId);
    if (found) found.push(sale);
    else linesByOrder.set(sale.orderId, [sale]);
  }

  for (const order of orders) {
    if (!allows(order)) continue;
    const lines: OrderLineInput[] = (linesByOrder.get(order.id) ?? []).map((l) => ({
      id: l.id,
      productId: l.productId,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
    }));
    const result = calculateOrder({ order, lines, costsByProduct: costs });
    const outcome = orderOutcome({ order, result });
    const status: OrderStatus = orderStatus(order);

    const target =
      status === "returned" || status === "cancelled"
        ? reading.lost
        : status === "pending"
          ? reading.inFlight
          : orderCollection(order) === "collected"
            ? reading.inHand
            : reading.withCourier;

    target.trips += 1;
    target.collected += outcome.collected;
    target.netProfit += outcome.netProfit;
    // A cancelled trip never went out, so there is nothing to expect from it.
    target.expected += status === "cancelled" ? 0 : result.collected;
  }

  reading.earned = reading.inHand.netProfit + reading.withCourier.netProfit + reading.lost.netProfit;
  reading.spendable = reading.inHand.collected;
  reading.awaiting = reading.withCourier.collected;
  return reading;
}

/**
 * How much of what went out came back, as a ratio of trips.
 *
 * A DISPLAY ratio, not money. `null` when no trip has settled: a store with three
 * orders still on the road has no return rate yet, and printing 0% would claim a
 * result it has not earned.
 */
export function returnRate(reading: CashReading): number | null {
  const settled = reading.inHand.trips + reading.withCourier.trips + reading.lost.trips;
  if (settled === 0) return null;
  return reading.lost.trips / settled;
}
