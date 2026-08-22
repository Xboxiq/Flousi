import { describe, expect, it } from "vitest";
import { computeDelivery, computeOrders } from "./orders";
import { makeCostBreakdown, type Order, type Product, type Rep, type Sale } from "@/domain";

const IQD = "IQD";
function product(id: string, price: number, purchase: number): Product {
  return {
    id,
    name: `منتج ${id}`,
    sellingPrice: price,
    currency: IQD,
    status: "active",
    costs: makeCostBreakdown({ purchase: { fixed: purchase, percent: 0 } }),
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}
function rep(id = "R1", name = "سعد"): Rep {
  return {
    id,
    name,
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}
function order(o: Partial<Order> = {}): Order {
  return {
    id: "O1",
    currency: IQD,
    placedAt: "2026-08-10T00:00:00.000Z",
    deliveryCharged: 5_000,
    deliveryPaid: 5_000,
    deliveryAllocation: "byValue",
    createdAt: "2026-08-10T00:00:00.000Z",
    updatedAt: "2026-08-10T00:00:00.000Z",
    ...o,
  };
}
function sale(o: Partial<Sale> = {}): Sale {
  return {
    id: "S1",
    productId: "P1",
    quantity: 1,
    unitPrice: 60_000,
    currency: IQD,
    soldAt: "2026-08-10T00:00:00.000Z",
    ...o,
  };
}
const products = [product("P1", 60_000, 40_000), product("P2", 30_000, 18_000)];

describe("computeOrders", () => {
  it("an empty store reports nothing, with no NaN totals", () => {
    const v = computeOrders({ orders: [], sales: [], products, reps: [] });
    expect(v.rows).toEqual([]);
    expect(v.total).toBe(0);
    expect(v.subsidised).toBe(0);
    expect(v.deliveryMarginTotal).toBe(0);
    expect(v.looseSales).toBe(0);
  });

  it("joins the sales that are lines of a trip, and counts them", () => {
    const v = computeOrders({
      orders: [order()],
      sales: [
        sale({ id: "a", orderId: "O1", productId: "P1", quantity: 1 }),
        sale({ id: "b", orderId: "O1", productId: "P2", quantity: 2, unitPrice: 30_000 }),
      ],
      products,
      reps: [],
    });
    expect(v.rows).toHaveLength(1);
    expect(v.rows[0].lineCount).toBe(2);
    expect(v.rows[0].units).toBe(3);
    expect(v.rows[0].names).toEqual(["منتج P1", "منتج P2"]);
    // one trip, one fee — 120,000 of goods and 5,000 of delivery
    expect(v.rows[0].result.goodsRevenue).toBe(120_000);
    expect(v.rows[0].result.deliveryPaid).toBe(5_000);
  });

  it("a sale with NO orderId is counted as loose, never invented into a trip", () => {
    const v = computeOrders({
      orders: [order()],
      sales: [sale({ id: "a", orderId: "O1" }), sale({ id: "legacy" })],
      products,
      reps: [],
    });
    expect(v.looseSales).toBe(1);
    expect(v.rows[0].lineCount).toBe(1);
    // inventing a zero-fee trip for the legacy sale would flatter the delivery margin
    expect(v.deliveryMarginTotal).toBe(0);
  });

  it("an order with no lines yet is still a row, reporting only its trip", () => {
    const v = computeOrders({ orders: [order()], sales: [], products, reps: [] });
    expect(v.rows).toHaveLength(1);
    expect(v.rows[0].lineCount).toBe(0);
    expect(v.rows[0].result.goodsRevenue).toBe(0);
    expect(v.rows[0].result.deliveryCharged).toBe(5_000);
  });

  it("newest trip first", () => {
    const v = computeOrders({
      orders: [
        order({ id: "old", placedAt: "2026-08-01T00:00:00.000Z" }),
        order({ id: "new", placedAt: "2026-08-20T00:00:00.000Z" }),
      ],
      sales: [],
      products,
      reps: [],
    });
    expect(v.rows.map((r) => r.order.id)).toEqual(["new", "old"]);
  });

  it("counts the subsidised trips — the number to act on", () => {
    const v = computeOrders({
      orders: [
        order({ id: "ok", deliveryCharged: 5_000, deliveryPaid: 5_000 }),
        order({ id: "loss", deliveryCharged: 5_000, deliveryPaid: 7_000 }),
        order({ id: "gain", deliveryCharged: 10_000, deliveryPaid: 6_000 }),
      ],
      sales: [],
      products,
      reps: [],
    });
    expect(v.subsidised).toBe(1);
    expect(v.deliveryMarginTotal).toBe(2_000); // 0 − 2,000 + 4,000
  });

  it("joins the rep's name and windows with limit while total reports everything", () => {
    const orders = Array.from({ length: 5 }, (_, i) =>
      order({ id: `O${i}`, repId: "R1", placedAt: `2026-08-0${i + 1}T00:00:00.000Z` }),
    );
    const v = computeOrders({ orders, sales: [], products, reps: [rep()], limit: 2 });
    expect(v.rows).toHaveLength(2);
    expect(v.total).toBe(5);
    expect(v.rows[0].repName).toBe("سعد");
  });

  it("scoping keeps a rep to their own trips and their own loose sales", () => {
    const v = computeOrders({
      orders: [order({ id: "mine", repId: "R1" }), order({ id: "theirs", repId: "R2" })],
      sales: [
        sale({ id: "a", orderId: "mine", repId: "R1" }),
        sale({ id: "b", orderId: "theirs", repId: "R2" }),
        sale({ id: "loose-mine", repId: "R1" }),
        sale({ id: "loose-theirs", repId: "R2" }),
      ],
      products,
      reps: [rep(), rep("R2", "علي")],
      scope: { repId: "R1" },
    });
    expect(v.rows.map((r) => r.order.id)).toEqual(["mine"]);
    expect(v.looseSales).toBe(1);
  });

  it('scope "none" yields nothing', () => {
    const v = computeOrders({
      orders: [order({ repId: "R1" })],
      sales: [sale({ orderId: "O1", repId: "R1" })],
      products,
      reps: [rep()],
      scope: "none",
    });
    expect(v.rows).toHaveLength(0);
    expect(v.looseSales).toBe(0);
  });

  it("a line whose product is gone is named for what is missing", () => {
    const v = computeOrders({
      orders: [order()],
      sales: [sale({ id: "a", orderId: "O1", productId: "GONE" })],
      products,
      reps: [],
    });
    expect(v.rows[0].names).toEqual(["منتج محذوف"]);
    expect(v.rows[0].result.goodsCost).toBe(0);
  });

  it("does not mutate the arrays it is given", () => {
    const orders = [order({ id: "a", placedAt: "2026-08-01T00:00:00.000Z" }), order({ id: "b", placedAt: "2026-08-09T00:00:00.000Z" })];
    computeOrders({ orders, sales: [], products, reps: [] });
    expect(orders.map((o) => o.id)).toEqual(["a", "b"]);
  });
});

describe("computeDelivery — the reading that did not exist before P4", () => {
  it("an empty window is zeros with no division by zero", () => {
    const d = computeDelivery([]);
    expect(d).toEqual({
      charged: 0,
      paid: 0,
      margin: 0,
      trips: 0,
      subsidised: 0,
      rate: 0,
      inFlight: 0,
    });
    expect(Number.isFinite(d.rate)).toBe(true);
  });

  it("sums both sides and reports the gap and the rate", () => {
    const d = computeDelivery([
      order({ deliveryCharged: 5_000, deliveryPaid: 4_000 }),
      order({ deliveryCharged: 5_000, deliveryPaid: 6_000 }),
      order({ deliveryCharged: 10_000, deliveryPaid: 6_000 }),
    ]);
    expect(d.charged).toBe(20_000);
    expect(d.paid).toBe(16_000);
    expect(d.margin).toBe(4_000);
    expect(d.trips).toBe(3);
    expect(d.subsidised).toBe(1);
    expect(d.rate).toBeCloseTo(0.2, 10);
  });

  it("a fleet that loses money on delivery reports a NEGATIVE margin, not zero", () => {
    const d = computeDelivery([
      order({ deliveryCharged: 5_000, deliveryPaid: 6_000 }),
      order({ deliveryCharged: 5_000, deliveryPaid: 6_500 }),
    ]);
    expect(d.margin).toBe(-2_500);
    expect(d.subsidised).toBe(2);
    expect(d.rate).toBeCloseTo(-0.25, 10);
  });

  it("free delivery on every trip: charged 0, and the rate stays finite", () => {
    const d = computeDelivery([order({ deliveryCharged: 0, deliveryPaid: 5_000 })]);
    expect(d.charged).toBe(0);
    expect(d.margin).toBe(-5_000);
    expect(d.rate).toBe(0);
  });

  it("junk figures are read as zero rather than poisoning the totals", () => {
    const d = computeDelivery([
      order({ deliveryCharged: Number.NaN, deliveryPaid: 5_000 }),
      order({ deliveryCharged: 5_000, deliveryPaid: Number.POSITIVE_INFINITY }),
    ]);
    expect(Number.isFinite(d.charged)).toBe(true);
    expect(Number.isFinite(d.paid)).toBe(true);
    expect(d.charged).toBe(5_000);
    expect(d.paid).toBe(5_000);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// P5 — the state of a trip changes what its figures MEAN.
// ─────────────────────────────────────────────────────────────────────────────

describe("computeOrders carries the outcome, not just the arithmetic (gate P5/G3)", () => {
  const lines = [sale({ id: "a", orderId: "O1", productId: "P1" })];

  it("a delivered and collected trip reads as money in hand", () => {
    const v = computeOrders({
      orders: [order({ status: "delivered", collection: "collected" })],
      sales: lines,
      products,
      reps: [],
    });
    expect(v.rows[0].outcome.cash).toBe("inHand");
    expect(v.rows[0].outcome.commissionOwed).toBe(true);
    expect(v.pending).toBe(0);
    expect(v.withCourier).toBe(0);
    expect(v.voided).toBe(0);
  });

  it("a delivered trip whose cash is with the courier is counted apart", () => {
    const v = computeOrders({
      orders: [order({ status: "delivered", collection: "withCourier" })],
      sales: lines,
      products,
      reps: [],
    });
    expect(v.withCourier).toBe(1);
    expect(v.rows[0].outcome.cash).toBe("withCourier");
  });

  it("a returned trip is counted as void, and its result still says what it would have made", () => {
    const v = computeOrders({
      orders: [order({ status: "returned", returnCost: 5_000 })],
      sales: lines,
      products,
      reps: [],
    });
    expect(v.voided).toBe(1);
    expect(v.rows[0].outcome.netProfit).toBe(-10_000);
    // The arithmetic is untouched: it is the reading of it that changed.
    expect(v.rows[0].result.collected).toBe(65_000);
  });

  it("a void trip is absent from the delivery MARGIN total, which is a settled reading", () => {
    const v = computeOrders({
      orders: [
        order({ id: "O1", status: "delivered" }),
        order({ id: "O2", status: "returned", returnCost: 5_000 }),
      ],
      sales: [sale({ id: "a", orderId: "O1" }), sale({ id: "b", orderId: "O2" })],
      products,
      reps: [],
    });
    // O1 charged 5,000 and paid 5,000: margin 0. The return's loss belongs to the
    // cash reading, not to the margin, or the same money is counted twice.
    expect(v.deliveryMarginTotal).toBe(0);
    expect(v.subsidised).toBe(0);
    expect(v.voided).toBe(1);
  });
});

describe("computeDelivery is a REALISED reading (gate P5/G1)", () => {
  it("a returned trip collected no fee and paid for two legs", () => {
    const d = computeDelivery([
      order({ status: "returned", deliveryCharged: 5_000, deliveryPaid: 4_000, returnCost: 4_000 }),
    ]);
    expect(d.charged).toBe(0);
    expect(d.paid).toBe(8_000);
    expect(d.margin).toBe(-8_000);
    expect(d.trips).toBe(1);
    expect(d.subsidised).toBe(1);
  });

  it("a cancelled trip neither charged nor paid", () => {
    const d = computeDelivery([order({ status: "cancelled" })]);
    expect(d).toMatchObject({ charged: 0, paid: 0, margin: 0, trips: 1, subsidised: 0 });
  });

  it("a trip still on the road is in NO figure, and is reported on its own", () => {
    const d = computeDelivery([order({ status: "pending" })]);
    expect(d.charged).toBe(0);
    expect(d.paid).toBe(0);
    expect(d.trips).toBe(0);
    expect(d.inFlight).toBe(1);
  });

  it("a delivered trip reads exactly as it did before P5", () => {
    const d = computeDelivery([
      order({ status: "delivered", deliveryCharged: 5_000, deliveryPaid: 4_000 }),
    ]);
    expect(d).toMatchObject({ charged: 5_000, paid: 4_000, margin: 1_000, subsidised: 0 });
    expect(d.rate).toBeCloseTo(0.2, 10);
  });

  it("an order with no status is delivered, so a pre-P5 store reads unchanged", () => {
    const d = computeDelivery([order({ deliveryCharged: 5_000, deliveryPaid: 6_500 })]);
    expect(d.charged).toBe(5_000);
    expect(d.paid).toBe(6_500);
    expect(d.subsidised).toBe(1);
    expect(d.inFlight).toBe(0);
  });

  it("a mixed window keeps every state in its own column", () => {
    const d = computeDelivery([
      order({ id: "1", status: "delivered", deliveryCharged: 5_000, deliveryPaid: 4_000 }),
      order({ id: "2", status: "pending", deliveryCharged: 5_000, deliveryPaid: 4_000 }),
      order({ id: "3", status: "returned", deliveryCharged: 5_000, deliveryPaid: 4_000, returnCost: 0 }),
      order({ id: "4", status: "cancelled", deliveryCharged: 5_000, deliveryPaid: 4_000 }),
    ]);
    expect(d.charged).toBe(5_000);
    expect(d.paid).toBe(8_000);
    expect(d.margin).toBe(-3_000);
    expect(d.trips).toBe(3);
    expect(d.inFlight).toBe(1);
    expect(d.subsidised).toBe(1);
  });
});
