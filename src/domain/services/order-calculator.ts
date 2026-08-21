import { Money } from "../value-objects/money";
import type { CostBreakdown } from "../entities/cost-breakdown";
import type { Product } from "../entities/product";
import {
  deliveryMargin,
  type DeliveryAllocation,
  type DeliveryShare,
  type Order,
  type OrderLineInput,
} from "../entities/order";
import type {
  CommissionSchemeParams,
  RoundingBeneficiary,
} from "../entities/commission-scheme";
import { ProfitCalculator } from "./profit-calculator";
import { payableStepMinor } from "./commission-calculator";

/** A line, priced and costed, with its allocated share of the delivery fee. */
export interface OrderLineResult {
  lineId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  /** unitPrice × quantity. */
  revenue: number;
  /** The product's own costs at this price and quantity, delivery NOT included. */
  productCost: number;
  /** This line's share of `deliveryPaid`. Zero under `orderOnly`. */
  deliveryShare: number;
  /**
   * revenue − productCost − deliveryShare.
   *
   * An ALLOCATED figure, not a measured one: it depends on the allocation method, so
   * a surface printing it must say so. The order's own profit does not.
   */
  netProfit: number;
}

export interface OrderResult {
  currency: string;
  /** Sum of the lines' revenue. Delivery is NOT in here. */
  goodsRevenue: number;
  /** What the customer paid for delivery. */
  deliveryCharged: number;
  /** goodsRevenue + deliveryCharged — everything the customer handed over. */
  collected: number;
  /** Sum of the lines' product costs. Delivery is NOT in here. */
  goodsCost: number;
  /** What the courier was paid. */
  deliveryPaid: number;
  /** goodsCost + deliveryPaid. */
  totalCost: number;
  /** deliveryCharged − deliveryPaid. Negative when the trip was subsidised. */
  deliveryMargin: number;
  /** goodsRevenue − goodsCost. The margin on the goods alone. */
  goodsProfit: number;
  /**
   * The order's real bottom line: collected − totalCost, which is identically
   * `goodsProfit + deliveryMargin`. EXACT under every allocation method, because the
   * allocation only moves the delivery cost between lines and never changes its total.
   */
  netProfit: number;
  margin: number;
  lines: OrderLineResult[];
}

/**
 * Spreads one delivery fee across lines so the parts sum EXACTLY to the fee.
 *
 * The naive `round(fee × weight)` per line loses or invents a unit whenever the split
 * does not divide evenly. The remainder is handed out one payable unit at a time, and
 * who gets it first is decided by `beneficiary` — the SAME setting the commission
 * engine already uses for its own rounding, rather than a second rule nobody would
 * remember (gate P4/G3).
 *
 * The unit is the currency's PAYABLE unit, not the minor unit. IQD is stored at a ×100
 * minor scale but printed and handed over in whole dinars, so splitting 5,000 three
 * ways in minor units gives 1,666.67 / 1,666.67 / 1,666.66 — three parts that each
 * PRINT as 1,667 and visibly add to 5,001 on screen. Allocating in payable units
 * instead gives 1,667 / 1,667 / 1,666, which sums both in the arithmetic and to the
 * eye. (The same lesson as the settlement amount in P1: a figure a merchant cannot
 * hand over is a figure this app should not compute.)
 */
export function allocateDelivery(input: {
  lines: readonly OrderLineInput[];
  deliveryPaid: number;
  method: DeliveryAllocation;
  currency: string;
  /** "owner" gives the remainder to the largest line; "rep" to the smallest. */
  beneficiary?: RoundingBeneficiary;
}): DeliveryShare[] {
  const { lines, method, currency } = input;
  const paid = Number.isFinite(input.deliveryPaid) ? Math.max(0, input.deliveryPaid) : 0;

  if (lines.length === 0) return [];
  if (method === "orderOnly" || paid === 0) {
    return lines.map((l) => ({ lineId: l.id, amount: 0 }));
  }

  // Work in whole payable units so the printed parts sum to the printed whole.
  const step = payableStepMinor(currency);
  const totalUnits = Math.round(Money.fromMajor(paid, currency).minorUnits / step);
  const weight = (l: OrderLineInput) =>
    method === "byQuantity"
      ? Math.max(0, l.quantity)
      : Money.fromMajor(l.unitPrice, currency).minorUnits * Math.max(0, l.quantity);

  const weights = lines.map(weight);
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  // Every weight zero (a giveaway order, or zero quantities): there is no ratio to
  // divide by, so the fee is spread as evenly as whole minor units allow rather than
  // dropped or dumped on line one.
  const shares =
    totalWeight === 0
      ? lines.map(() => Math.trunc(totalUnits / lines.length))
      : weights.map((w) => Math.trunc((totalUnits * w) / totalWeight));

  const assigned = shares.reduce((a, b) => a + b, 0);
  let remainder = totalUnits - assigned;

  // The remainder is at most (lines.length - 1) payable units, and it is handed out
  // one unit at a time so no single line absorbs a visible lump.
  const order = lines
    .map((l, i) => ({ i, w: weights[i] }))
    .sort((a, b) => (input.beneficiary === "rep" ? a.w - b.w : b.w - a.w));
  for (let k = 0; remainder > 0 && k < order.length * 2; k += 1) {
    shares[order[k % order.length].i] += 1;
    remainder -= 1;
  }

  return lines.map((l, i) => ({
    lineId: l.id,
    amount: Money.fromMinor(shares[i] * step, currency).amount,
  }));
}

/**
 * The whole order: goods, delivery on both sides, and each line with its share.
 *
 * Delivery is counted ONCE here regardless of line count or quantity. That is the fix
 * for the live bug recorded in `docs/PLAN-ORDERS.md`: `ProfitCalculator` multiplies
 * every cost line by quantity, shipping included, so three items in one trip were
 * being reported as three delivery fees (gate P4/G2).
 *
 * A product's own `shipping` cost line is deliberately left alone — a merchant who
 * puts a per-unit shipping cost on a product means something by it (inbound freight,
 * say). What this function stops is the ORDER's fee being multiplied.
 */
export function calculateOrder(input: {
  order: Pick<
    Order,
    "currency" | "deliveryCharged" | "deliveryPaid" | "deliveryAllocation"
  >;
  lines: readonly OrderLineInput[];
  /** Cost breakdown per product id. A missing product contributes revenue only. */
  costsByProduct: ReadonlyMap<string, CostBreakdown>;
  beneficiary?: RoundingBeneficiary;
}): OrderResult {
  const { order, lines, costsByProduct } = input;
  const currency = order.currency;

  const shares = allocateDelivery({
    lines,
    deliveryPaid: order.deliveryPaid,
    method: order.deliveryAllocation,
    currency,
    beneficiary: input.beneficiary,
  });
  const shareById = new Map(shares.map((s) => [s.lineId, s.amount]));

  let goodsRevenue = Money.zero(currency);
  let goodsCost = Money.zero(currency);
  const results: OrderLineResult[] = [];

  for (const line of lines) {
    const costs = costsByProduct.get(line.productId);
    const priced = costs
      ? ProfitCalculator.calculate({
          sellingPrice: line.unitPrice,
          costs,
          currency,
          quantity: line.quantity,
        })
      : null;
    const revenue = Money.fromMajor(line.unitPrice, currency).multiply(
      Math.max(0, line.quantity),
    );
    const productCost = Money.fromMajor(priced?.totalCost ?? 0, currency);
    const deliveryShare = Money.fromMajor(shareById.get(line.id) ?? 0, currency);

    goodsRevenue = goodsRevenue.add(revenue);
    goodsCost = goodsCost.add(productCost);

    results.push({
      lineId: line.id,
      productId: line.productId,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      revenue: revenue.amount,
      productCost: productCost.amount,
      deliveryShare: deliveryShare.amount,
      netProfit: revenue.subtract(productCost).subtract(deliveryShare).amount,
    });
  }

  const charged = Money.fromMajor(
    Number.isFinite(order.deliveryCharged) ? order.deliveryCharged : 0,
    currency,
  );
  const paid = Money.fromMajor(
    Number.isFinite(order.deliveryPaid) ? order.deliveryPaid : 0,
    currency,
  );
  const collected = goodsRevenue.add(charged);
  const totalCost = goodsCost.add(paid);
  const netProfit = collected.subtract(totalCost);

  return {
    currency,
    goodsRevenue: goodsRevenue.amount,
    deliveryCharged: charged.amount,
    collected: collected.amount,
    goodsCost: goodsCost.amount,
    deliveryPaid: paid.amount,
    totalCost: totalCost.amount,
    deliveryMargin: deliveryMargin(order),
    goodsProfit: goodsRevenue.subtract(goodsCost).amount,
    netProfit: netProfit.amount,
    margin: collected.isZero() ? 0 : netProfit.ratioTo(collected),
    lines: results,
  };
}

/** Products keyed by id, for `calculateOrder`. */
export function costsByProduct(products: readonly Product[]): Map<string, CostBreakdown> {
  return new Map(products.map((p) => [p.id, p.costs]));
}

/* ─────────────── the delivery margin's share, when the scheme shares it ─────────────── */

export interface DeliverySplitResult {
  /** deliveryCharged − deliveryPaid, major units. Negative when subsidised. */
  margin: number;
  /** The rep's share of that margin, major units. Zero when not shared. */
  repShare: number;
  /** margin − repShare. */
  ownerShare: number;
  /** True when the scheme shares the delivery outcome at all. */
  shared: boolean;
  /** True when a NEGATIVE margin was withheld from the rep by the loss policy. */
  lossWithheld: boolean;
}

/**
 * Splits the ORDER's delivery margin, if the scheme says to (gate P4/G5).
 *
 * Deliberately computed at the order level and NOT smeared into the lines. Two
 * reasons, and both matter:
 *
 * 1. The delivery margin is a fact about the TRIP. Allocating it into line profits
 *    would make a product's reported margin depend on how far the customer lived.
 * 2. Every per-line `commissionSnapshot` the P1 engine froze stays exactly what it
 *    was. A change that rewrites frozen splits to add a feature is the kind this
 *    codebase does not make.
 *
 * Only `profitShare` can share a margin: a fee per unit or a percentage of price has
 * no ratio to apply to a delivery outcome, so those schemes leave it whole with the
 * owner even when `deliveryProfitShared` is set. That is stated rather than silently
 * ratio'd, because a merchant who ticked the box deserves to know it did nothing here.
 */
export function splitDeliveryMargin(input: {
  order: Pick<Order, "currency" | "deliveryCharged" | "deliveryPaid">;
  params: Pick<
    CommissionSchemeParams,
    "kind" | "repRatio" | "lossPolicy" | "roundingBeneficiary" | "deliveryProfitShared"
  >;
}): DeliverySplitResult {
  const { order, params } = input;
  const currency = order.currency;
  const marginMoney = Money.fromMajor(deliveryMargin(order), currency);
  const margin = marginMoney.amount;

  const shareable = params.deliveryProfitShared === true && params.kind === "profitShare";
  if (!shareable) {
    return { margin, repShare: 0, ownerShare: margin, shared: false, lossWithheld: false };
  }

  const negative = marginMoney.minorUnits < 0;
  const withheld = negative && params.lossPolicy === "ownerOnly";
  if (withheld) {
    return { margin, repShare: 0, ownerShare: margin, shared: true, lossWithheld: true };
  }

  // Integer basis points and a single truncation toward zero, the same shape the
  // commission engine uses, so a rep can check it on a pocket calculator.
  const bps = Math.round(Math.min(1, Math.max(0, params.repRatio ?? 0)) * 10_000);
  const rawMinor = Math.trunc((marginMoney.minorUnits * bps) / 10_000);
  const repMinor = params.roundingBeneficiary === "rep" && marginMoney.minorUnits !== 0
    ? // the rep absorbs the residual in both signs, mirroring the engine's option
      marginMoney.minorUnits - Math.trunc((marginMoney.minorUnits * (10_000 - bps)) / 10_000)
    : rawMinor;

  const repShare = Money.fromMinor(repMinor, currency);
  return {
    margin,
    repShare: repShare.amount,
    ownerShare: marginMoney.subtract(repShare).amount,
    shared: true,
    lossWithheld: false,
  };
}
