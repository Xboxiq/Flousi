import { describe, expect, it } from "vitest";
import {
  allocateDelivery,
  calculateOrder,
  costsByProduct,
  splitDeliveryMargin,
} from "./order-calculator";
import { makeCostBreakdown } from "../entities/cost-breakdown";
import { deliveryMargin, type DeliveryAllocation, type OrderLineInput } from "../entities/order";
import type { Product } from "../entities/product";
import { ProfitCalculator } from "./profit-calculator";

const IQD = "IQD";

function product(id: string, price: number, purchase: number): Product {
  return {
    id,
    name: id,
    sellingPrice: price,
    currency: IQD,
    status: "active",
    costs: makeCostBreakdown({ purchase: { fixed: purchase, percent: 0 } }),
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}
function line(id: string, productId: string, quantity: number, unitPrice: number): OrderLineInput {
  return { id, productId, quantity, unitPrice };
}
function order(o: Partial<Parameters<typeof calculateOrder>[0]["order"]> = {}) {
  return {
    currency: IQD,
    deliveryCharged: 5_000,
    deliveryPaid: 5_000,
    deliveryAllocation: "byValue" as DeliveryAllocation,
    ...o,
  };
}

describe("allocateDelivery — the parts must sum to the whole (gate P4/G3)", () => {
  const three = [line("a", "P1", 1, 60_000), line("b", "P2", 1, 30_000), line("c", "P3", 1, 10_000)];

  it("byValue splits in proportion to line value", () => {
    const parts = allocateDelivery({
      lines: three,
      deliveryPaid: 5_000,
      method: "byValue",
      currency: IQD,
    });
    expect(parts.map((p) => p.amount)).toEqual([3_000, 1_500, 500]);
    expect(parts.reduce((s, p) => s + p.amount, 0)).toBe(5_000);
  });

  it("byQuantity splits equally per unit, ignoring price", () => {
    const parts = allocateDelivery({
      lines: [line("a", "P1", 1, 90_000), line("b", "P2", 3, 1_000)],
      deliveryPaid: 4_000,
      method: "byQuantity",
      currency: IQD,
    });
    // 4 units total: one unit on line a, three on line b
    expect(parts.map((p) => p.amount)).toEqual([1_000, 3_000]);
  });

  it("orderOnly puts nothing on any line", () => {
    const parts = allocateDelivery({
      lines: three,
      deliveryPaid: 5_000,
      method: "orderOnly",
      currency: IQD,
    });
    expect(parts.every((p) => p.amount === 0)).toBe(true);
  });

  it("an amount that does not divide evenly still sums EXACTLY", () => {
    // 1,000 over three equal lines: 333.33… each
    const parts = allocateDelivery({
      lines: [line("a", "P", 1, 10), line("b", "P", 1, 10), line("c", "P", 1, 10)],
      deliveryPaid: 1_000,
      method: "byValue",
      currency: IQD,
    });
    const total = parts.reduce((s, p) => s + p.amount, 0);
    expect(total).toBeCloseTo(1_000, 10);
    // and no part is negative or absurd
    expect(parts.every((p) => p.amount > 0)).toBe(true);
  });

  it("sums exactly across a wide sweep of amounts, counts and methods", () => {
    const methods: DeliveryAllocation[] = ["byValue", "byQuantity"];
    for (const method of methods) {
      for (let n = 1; n <= 7; n += 1) {
        for (const paid of [1, 7, 99, 250, 1_000, 3_333, 5_000, 7_777, 10_000]) {
          const lines = Array.from({ length: n }, (_, i) =>
            line(`l${i}`, `P${i}`, (i % 3) + 1, 1_000 * (i + 1) + i * 7),
          );
          const parts = allocateDelivery({ lines, deliveryPaid: paid, method, currency: IQD });
          const total = parts.reduce((s, p) => s + p.amount, 0);
          expect(total, `${method} n=${n} paid=${paid}`).toBeCloseTo(paid, 10);
          expect(parts.every((p) => p.amount >= 0)).toBe(true);
          expect(parts).toHaveLength(n);
        }
      }
    }
  });

  it("a single line takes the whole fee", () => {
    const parts = allocateDelivery({
      lines: [line("a", "P", 2, 25_000)],
      deliveryPaid: 5_000,
      method: "byValue",
      currency: IQD,
    });
    expect(parts).toEqual([{ lineId: "a", amount: 5_000 }]);
  });

  it("no lines allocates nothing rather than throwing", () => {
    expect(
      allocateDelivery({ lines: [], deliveryPaid: 5_000, method: "byValue", currency: IQD }),
    ).toEqual([]);
  });

  it("a zero fee puts zero on every line", () => {
    const parts = allocateDelivery({
      lines: three,
      deliveryPaid: 0,
      method: "byValue",
      currency: IQD,
    });
    expect(parts.every((p) => p.amount === 0)).toBe(true);
  });

  it("a giveaway order (every line worth nothing) still spreads the fee, not drops it", () => {
    const parts = allocateDelivery({
      lines: [line("a", "P", 1, 0), line("b", "P", 1, 0)],
      deliveryPaid: 5_000,
      method: "byValue",
      currency: IQD,
    });
    expect(parts.reduce((s, p) => s + p.amount, 0)).toBeCloseTo(5_000, 10);
  });

  it("zero quantities under byQuantity do not divide by zero", () => {
    const parts = allocateDelivery({
      lines: [line("a", "P", 0, 10_000), line("b", "P", 0, 10_000)],
      deliveryPaid: 3_000,
      method: "byQuantity",
      currency: IQD,
    });
    expect(parts.reduce((s, p) => s + p.amount, 0)).toBeCloseTo(3_000, 10);
    expect(parts.every((p) => Number.isFinite(p.amount))).toBe(true);
  });

  it("a non-finite or negative fee is read as zero, never as NaN shares", () => {
    for (const paid of [Number.NaN, Number.POSITIVE_INFINITY, -5_000]) {
      const parts = allocateDelivery({
        lines: three,
        deliveryPaid: paid,
        method: "byValue",
        currency: IQD,
      });
      expect(parts.every((p) => p.amount === 0), String(paid)).toBe(true);
    }
  });

  it("the beneficiary decides who absorbs the remainder, and both still sum", () => {
    const lines = [line("big", "P1", 1, 10_000), line("small", "P2", 1, 1)];
    const toOwner = allocateDelivery({
      lines,
      deliveryPaid: 1_000,
      method: "byValue",
      currency: IQD,
      beneficiary: "owner",
    });
    const toRep = allocateDelivery({
      lines,
      deliveryPaid: 1_000,
      method: "byValue",
      currency: IQD,
      beneficiary: "rep",
    });
    expect(toOwner.reduce((s, p) => s + p.amount, 0)).toBeCloseTo(1_000, 10);
    expect(toRep.reduce((s, p) => s + p.amount, 0)).toBeCloseTo(1_000, 10);
  });
});

describe("calculateOrder — one delivery per order (gate P4/G2)", () => {
  const products = [product("P1", 60_000, 40_000), product("P2", 30_000, 18_000), product("P3", 10_000, 6_000)];
  const map = costsByProduct(products);
  const three = [line("a", "P1", 1, 60_000), line("b", "P2", 1, 30_000), line("c", "P3", 1, 10_000)];

  it("G2 the documented bug: three lines, ONE fee of 5,000 — not 15,000", () => {
    const r = calculateOrder({ order: order(), lines: three, costsByProduct: map });
    expect(r.deliveryPaid).toBe(5_000);
    expect(r.goodsRevenue).toBe(100_000);
    expect(r.goodsCost).toBe(64_000);
    expect(r.totalCost).toBe(69_000);

    // and the three lines' shares add up to exactly the one fee
    expect(r.lines.reduce((s, l) => s + l.deliveryShare, 0)).toBeCloseTo(5_000, 10);

    // the OLD way: three separate sales each carrying a 5,000 shipping cost
    const separately = three.reduce((sum, l) => {
      const p = products.find((x) => x.id === l.productId)!;
      return (
        sum +
        ProfitCalculator.calculate({
          sellingPrice: l.unitPrice,
          costs: makeCostBreakdown({
            purchase: p.costs.purchase,
            shipping: { fixed: 5_000, percent: 0 },
          }),
          currency: IQD,
          quantity: l.quantity,
        }).totalCost
      );
    }, 0);
    expect(separately).toBe(79_000); // 64,000 of goods + 15,000 of delivery
    // 10,000 IQD of invented cost, exactly as docs/PLAN-ORDERS.md states
    expect(separately - r.totalCost).toBe(10_000);
  });

  it("quantity does not multiply the fee either", () => {
    const r = calculateOrder({
      order: order(),
      lines: [line("a", "P1", 5, 60_000)],
      costsByProduct: map,
    });
    expect(r.deliveryPaid).toBe(5_000);
    expect(r.lines[0].deliveryShare).toBe(5_000);
  });

  it("the order's profit is EXACT under every allocation method", () => {
    const byValue = calculateOrder({ order: order(), lines: three, costsByProduct: map });
    const byQty = calculateOrder({
      order: order({ deliveryAllocation: "byQuantity" }),
      lines: three,
      costsByProduct: map,
    });
    const none = calculateOrder({
      order: order({ deliveryAllocation: "orderOnly" }),
      lines: three,
      costsByProduct: map,
    });
    expect(byValue.netProfit).toBe(byQty.netProfit);
    expect(byQty.netProfit).toBe(none.netProfit);
    // the allocation moves cost BETWEEN lines and never changes the total
    expect(byValue.totalCost).toBe(none.totalCost);
  });

  it("net profit is identically goodsProfit + deliveryMargin", () => {
    const r = calculateOrder({
      order: order({ deliveryCharged: 8_000, deliveryPaid: 5_000 }),
      lines: three,
      costsByProduct: map,
    });
    expect(r.netProfit).toBe(r.goodsProfit + r.deliveryMargin);
    expect(r.collected).toBe(r.goodsRevenue + r.deliveryCharged);
    expect(r.netProfit).toBe(r.collected - r.totalCost);
  });

  it("a line's profit carries its allocated share, and the lines sum to the order", () => {
    const r = calculateOrder({ order: order(), lines: three, costsByProduct: map });
    const sumLines = r.lines.reduce((s, l) => s + l.netProfit, 0);
    // the lines account for the goods and the delivery COST, but not the delivery
    // charged, which belongs to the trip rather than to any product
    expect(sumLines).toBeCloseTo(r.netProfit - r.deliveryCharged, 10);
  });

  it("a line whose product is gone contributes revenue and no cost, without throwing", () => {
    const r = calculateOrder({
      order: order(),
      lines: [line("a", "GONE", 2, 10_000)],
      costsByProduct: map,
    });
    expect(r.goodsRevenue).toBe(20_000);
    expect(r.goodsCost).toBe(0);
    expect(r.lines[0].productCost).toBe(0);
  });

  it("an empty order is zeros, not NaN", () => {
    const r = calculateOrder({
      order: order({ deliveryCharged: 0, deliveryPaid: 0 }),
      lines: [],
      costsByProduct: map,
    });
    expect(r).toMatchObject({ goodsRevenue: 0, totalCost: 0, netProfit: 0, margin: 0 });
    expect(Number.isNaN(r.margin)).toBe(false);
  });
});

describe("the delivery margin — the figure that was invisible (gate P4/G1)", () => {
  const map = costsByProduct([product("P1", 50_000, 30_000)]);
  const one = [line("a", "P1", 1, 50_000)];

  it("charged equals paid: delivery is neutral", () => {
    const r = calculateOrder({
      order: order({ deliveryCharged: 5_000, deliveryPaid: 5_000 }),
      lines: one,
      costsByProduct: map,
    });
    expect(r.deliveryMargin).toBe(0);
    expect(r.netProfit).toBe(r.goodsProfit);
  });

  it("paid MORE than charged: the merchant is subsidising every trip", () => {
    const r = calculateOrder({
      order: order({ deliveryCharged: 5_000, deliveryPaid: 6_000 }),
      lines: one,
      costsByProduct: map,
    });
    expect(r.deliveryMargin).toBe(-1_000);
    expect(r.netProfit).toBe(r.goodsProfit - 1_000);
  });

  it("charged MORE than paid: delivery is its own profit line", () => {
    const r = calculateOrder({
      order: order({ deliveryCharged: 10_000, deliveryPaid: 6_000 }),
      lines: one,
      costsByProduct: map,
    });
    expect(r.deliveryMargin).toBe(4_000);
    expect(r.netProfit).toBe(r.goodsProfit + 4_000);
  });

  it("free delivery is charged 0 with a real cost — a cost absorbed, not a price cut", () => {
    const r = calculateOrder({
      order: order({ deliveryCharged: 0, deliveryPaid: 5_000 }),
      lines: one,
      costsByProduct: map,
    });
    expect(r.deliveryMargin).toBe(-5_000);
    // the GOODS margin is untouched: the offer did not discount the product
    expect(r.goodsProfit).toBe(20_000);
    expect(r.netProfit).toBe(15_000);
  });

  it("deliveryMargin on the entity agrees with the calculator, and guards junk", () => {
    expect(deliveryMargin({ deliveryCharged: 10_000, deliveryPaid: 4_000 })).toBe(6_000);
    expect(deliveryMargin({ deliveryCharged: Number.NaN, deliveryPaid: 4_000 })).toBe(-4_000);
    expect(deliveryMargin({ deliveryCharged: 5_000, deliveryPaid: Number.NaN })).toBe(5_000);
  });
});

describe("splitDeliveryMargin — a per-scheme option (gate P4/G5)", () => {
  const half = {
    kind: "profitShare" as const,
    repRatio: 0.5,
    lossPolicy: "ownerOnly" as const,
    roundingBeneficiary: "owner" as const,
  };
  const trip = (charged: number, paid: number) => ({
    currency: IQD,
    deliveryCharged: charged,
    deliveryPaid: paid,
  });

  it("default (unset) keeps the whole margin with the owner", () => {
    const r = splitDeliveryMargin({ order: trip(10_000, 6_000), params: half });
    expect(r.shared).toBe(false);
    expect(r.margin).toBe(4_000);
    expect(r.repShare).toBe(0);
    expect(r.ownerShare).toBe(4_000);
  });

  it("shared: the rep takes their ratio of a POSITIVE margin", () => {
    const r = splitDeliveryMargin({
      order: trip(10_000, 6_000),
      params: { ...half, deliveryProfitShared: true },
    });
    expect(r.shared).toBe(true);
    expect(r.repShare).toBe(2_000);
    expect(r.ownerShare).toBe(2_000);
    expect(r.repShare + r.ownerShare).toBe(r.margin);
  });

  it("shared + ownerOnly: a NEGATIVE margin is withheld from the rep and said so", () => {
    const r = splitDeliveryMargin({
      order: trip(5_000, 6_000),
      params: { ...half, deliveryProfitShared: true },
    });
    expect(r.margin).toBe(-1_000);
    expect(r.repShare).toBe(0);
    expect(r.ownerShare).toBe(-1_000);
    expect(r.lossWithheld).toBe(true);
  });

  it("shared + shared-loss: the rep carries their part of a subsidised trip", () => {
    const r = splitDeliveryMargin({
      order: trip(5_000, 7_000),
      params: { ...half, lossPolicy: "shared", deliveryProfitShared: true },
    });
    expect(r.margin).toBe(-2_000);
    expect(r.repShare).toBe(-1_000);
    expect(r.ownerShare).toBe(-1_000);
    expect(r.lossWithheld).toBe(false);
  });

  it("a fee-per-unit scheme cannot share a delivery margin, and reports that", () => {
    const r = splitDeliveryMargin({
      order: trip(10_000, 6_000),
      params: {
        kind: "fixedPerUnit",
        lossPolicy: "ownerOnly",
        roundingBeneficiary: "owner",
        deliveryProfitShared: true,
      },
    });
    // ticked, but there is no ratio to apply — so it is left whole with the owner and
    // `shared` says false rather than pretending the option did something
    expect(r.shared).toBe(false);
    expect(r.repShare).toBe(0);
    expect(r.ownerShare).toBe(4_000);
  });

  it("the two shares always reconstruct the margin exactly, across a sweep", () => {
    for (const ratio of [0, 0.25, 0.3333, 0.5, 0.75, 1]) {
      for (const [c, p] of [[5_000, 5_000], [10_000, 6_000], [7_777, 3_333], [0, 5_000], [5_000, 0]]) {
        const r = splitDeliveryMargin({
          order: trip(c, p),
          params: { ...half, repRatio: ratio, lossPolicy: "shared", deliveryProfitShared: true },
        });
        expect(r.repShare + r.ownerShare, `${ratio} ${c}/${p}`).toBeCloseTo(r.margin, 10);
      }
    }
  });

  it("a zero margin splits to nothing on both sides", () => {
    const r = splitDeliveryMargin({
      order: trip(5_000, 5_000),
      params: { ...half, deliveryProfitShared: true },
    });
    expect(r.margin).toBe(0);
    expect(r.repShare).toBe(0);
    expect(r.ownerShare).toBe(0);
  });

  it("free delivery under a shared scheme: the rep shares the absorbed cost only if the policy says so", () => {
    const withheld = splitDeliveryMargin({
      order: trip(0, 5_000),
      params: { ...half, deliveryProfitShared: true },
    });
    expect(withheld.repShare).toBe(0);
    expect(withheld.lossWithheld).toBe(true);

    const shared = splitDeliveryMargin({
      order: trip(0, 5_000),
      params: { ...half, lossPolicy: "shared", deliveryProfitShared: true },
    });
    expect(shared.repShare).toBe(-2_500);
  });
});

describe("legacy sales are not touched by any of this (gate P4/G0)", () => {
  it("a sale with no orderId is still a valid Sale, and its snapshot is untouched", () => {
    // The exact shape a pre-P4 store holds, byte for byte.
    const legacy = {
      id: "S-old",
      productId: "P1",
      quantity: 2,
      unitPrice: 50_000,
      currency: IQD,
      soldAt: "2026-05-01T00:00:00.000Z",
      repId: "R1",
      commissionSnapshot: {
        schemeId: "half",
        repId: "R1",
        currency: IQD,
        revenueMinor: 10_000_000,
        totalCostMinor: 6_000_000,
        netProfitMinor: 4_000_000,
        basisMinor: 4_000_000,
        repShareMinor: 2_000_000,
        ownerShareMinor: 2_000_000,
        kind: "profitShare",
        profitBasis: "netProfit",
        lossPolicy: "ownerOnly",
        roundingBeneficiary: "owner",
        schemeTier: "accountDefault",
        calculatedAt: "2026-05-01T00:00:00.000Z",
      },
    };
    // `orderId` is optional, so this object still satisfies the type…
    const asSale: import("../entities/sale").Sale = legacy as never;
    expect(asSale.orderId).toBeUndefined();
    // …and every frozen figure is exactly as stored, unmigrated and unrecomputed
    expect(asSale.commissionSnapshot?.repShareMinor).toBe(2_000_000);
    expect(asSale.commissionSnapshot?.calculatedAt).toBe("2026-05-01T00:00:00.000Z");
  });

  it("a one-line order reports what a single sale always reported, plus the trip", () => {
    const map = costsByProduct([product("P1", 50_000, 30_000)]);
    const asSale = ProfitCalculator.calculate({
      sellingPrice: 50_000,
      costs: makeCostBreakdown({ purchase: { fixed: 30_000, percent: 0 } }),
      currency: IQD,
      quantity: 2,
    });
    const asOrder = calculateOrder({
      order: order({ deliveryCharged: 0, deliveryPaid: 0 }),
      lines: [line("a", "P1", 2, 50_000)],
      costsByProduct: map,
    });
    // with no delivery on either side, the order IS the sale
    expect(asOrder.goodsRevenue).toBe(asSale.revenue);
    expect(asOrder.goodsCost).toBe(asSale.totalCost);
    expect(asOrder.netProfit).toBe(asSale.netProfit);
  });
});
