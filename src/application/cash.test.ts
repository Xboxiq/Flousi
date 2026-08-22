import { describe, expect, it } from "vitest";
import { computeCash, returnRate } from "./cash";
import { makeCostBreakdown, type Order, type Product, type Sale } from "@/domain";

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
const products = [product("P1", 60_000, 40_000), product("P2", 30_000, 18_000)];

function order(id: string, o: Partial<Order> = {}): Order {
  return {
    id,
    currency: IQD,
    placedAt: "2026-08-10T00:00:00.000Z",
    deliveryCharged: 5_000,
    deliveryPaid: 4_000,
    deliveryAllocation: "byValue",
    createdAt: "2026-08-10T00:00:00.000Z",
    updatedAt: "2026-08-10T00:00:00.000Z",
    ...o,
  };
}
function sale(id: string, o: Partial<Sale> = {}): Sale {
  return {
    id,
    productId: "P1",
    quantity: 1,
    unitPrice: 60_000,
    currency: IQD,
    soldAt: "2026-08-10T00:00:00.000Z",
    ...o,
  };
}

/** One trip carrying one 60,000 product bought for 40,000, delivery 5,000 / 4,000. */
function oneTrip(id: string, o: Partial<Order> = {}) {
  return {
    orders: [order(id, o)],
    sales: [sale(`${id}-a`, { orderId: id })],
    products,
    currency: IQD,
  };
}

describe("computeCash — four states, never one total (gate P5/G3)", () => {
  it("an empty store reads as zeros with no NaN anywhere", () => {
    const c = computeCash({ orders: [], sales: [], products, currency: IQD });
    for (const b of [c.inHand, c.withCourier, c.inFlight, c.lost]) {
      expect(b).toEqual({ trips: 0, collected: 0, netProfit: 0, expected: 0 });
    }
    expect(c.earned).toBe(0);
    expect(c.spendable).toBe(0);
    expect(c.awaiting).toBe(0);
    expect(returnRate(c)).toBeNull();
  });

  it("بيدك: delivered and collected is the only spendable figure", () => {
    const c = computeCash(oneTrip("O1", { status: "delivered", collection: "collected" }));
    expect(c.inHand).toEqual({ trips: 1, collected: 65_000, netProfit: 21_000, expected: 65_000 });
    expect(c.spendable).toBe(65_000);
    expect(c.awaiting).toBe(0);
    expect(c.withCourier.trips).toBe(0);
  });

  it("عند التوصيل: earned, but not a dinar of it is in hand", () => {
    const c = computeCash(oneTrip("O1", { status: "delivered", collection: "withCourier" }));
    expect(c.withCourier.collected).toBe(65_000);
    expect(c.withCourier.netProfit).toBe(21_000);
    // Earned the same 21,000 as the collected trip — and spendable is still zero.
    expect(c.earned).toBe(21_000);
    expect(c.spendable).toBe(0);
    expect(c.awaiting).toBe(65_000);
  });

  it("في الطريق: nothing realised, and the expected figure carries the story", () => {
    const c = computeCash(oneTrip("O1", { status: "pending" }));
    expect(c.inFlight.trips).toBe(1);
    expect(c.inFlight.collected).toBe(0);
    expect(c.inFlight.netProfit).toBe(0);
    expect(c.inFlight.expected).toBe(65_000);
    // An order on the road has earned nothing, so it is absent from `earned`.
    expect(c.earned).toBe(0);
    expect(c.spendable).toBe(0);
  });

  it("راجعة: nothing collected, and the delivery out and back is a real loss", () => {
    const c = computeCash(oneTrip("O1", { status: "returned", returnCost: 4_000 }));
    expect(c.lost.trips).toBe(1);
    expect(c.lost.collected).toBe(0);
    expect(c.lost.netProfit).toBe(-8_000);
    expect(c.lost.expected).toBe(65_000);
    // The month is 8,000 worse off, not 21,000 better off.
    expect(c.earned).toBe(-8_000);
  });

  it("ملغاة: never went out, so there is nothing to expect either", () => {
    const c = computeCash(oneTrip("O1", { status: "cancelled" }));
    expect(c.lost).toEqual({ trips: 1, collected: 0, netProfit: 0, expected: 0 });
    expect(c.earned).toBe(0);
  });

  it("four trips, one in each state, stay four separate figures", () => {
    const states: Array<Partial<Order>> = [
      { status: "delivered", collection: "collected" },
      { status: "delivered", collection: "withCourier" },
      { status: "pending" },
      { status: "returned", returnCost: 4_000 },
    ];
    const c = computeCash({
      orders: states.map((s, i) => order(`O${i}`, s)),
      sales: states.map((_, i) => sale(`S${i}`, { orderId: `O${i}` })),
      products,
      currency: IQD,
    });
    expect(c.inHand.trips).toBe(1);
    expect(c.withCourier.trips).toBe(1);
    expect(c.inFlight.trips).toBe(1);
    expect(c.lost.trips).toBe(1);
    expect(c.spendable).toBe(65_000);
    expect(c.awaiting).toBe(65_000);
    expect(c.inFlight.expected).toBe(65_000);
    // 21,000 in hand + 21,000 with the courier − 8,000 returned.
    expect(c.earned).toBe(34_000);
    // One of the three settled trips came back.
    expect(returnRate(c)).toBeCloseTo(1 / 3, 10);
  });
});

describe("computeCash — a pre-P4 sale is money in hand (gate P5/G6)", () => {
  it("a sale with no trip counts toward بيدك in full", () => {
    const c = computeCash({
      orders: [],
      sales: [sale("legacy")],
      products,
      currency: IQD,
    });
    expect(c.looseSales).toBe(1);
    expect(c.looseCollected).toBe(60_000);
    // No delivery was ever charged or paid on it, so its profit is the goods margin.
    expect(c.inHand).toEqual({ trips: 0, collected: 60_000, netProfit: 20_000, expected: 60_000 });
    expect(c.spendable).toBe(60_000);
  });

  it("loose sales and trips add up without either being double-counted", () => {
    const c = computeCash({
      orders: [order("O1", { status: "delivered", collection: "collected" })],
      sales: [sale("O1-a", { orderId: "O1" }), sale("legacy")],
      products,
      currency: IQD,
    });
    expect(c.looseSales).toBe(1);
    // 65,000 from the trip + 60,000 loose. The trip's own line is NOT counted twice.
    expect(c.inHand.collected).toBe(125_000);
    expect(c.inHand.netProfit).toBe(41_000);
    expect(c.inHand.trips).toBe(1);
  });

  it("an order with no status and no collection reads as delivered and in hand", () => {
    const c = computeCash(oneTrip("O1"));
    expect(c.inHand.trips).toBe(1);
    expect(c.spendable).toBe(65_000);
  });
});

describe("computeCash — scope (gate P3/G3 still holds)", () => {
  const shared = {
    orders: [
      order("O1", { repId: "R1", status: "delivered", collection: "collected" }),
      order("O2", { repId: "R2", status: "delivered", collection: "collected" }),
    ],
    sales: [
      sale("a", { orderId: "O1", repId: "R1" }),
      sale("b", { orderId: "O2", repId: "R2" }),
      sale("loose", { repId: "R2" }),
    ],
    products,
    currency: IQD,
  };

  it("a scoped session sees its own trips only", () => {
    const c = computeCash({ ...shared, scope: { repId: "R1" } });
    expect(c.inHand.trips).toBe(1);
    expect(c.inHand.collected).toBe(65_000);
    expect(c.looseSales).toBe(0);
  });

  it("«none» sees nothing rather than everything", () => {
    const c = computeCash({ ...shared, scope: "none" });
    expect(c.inHand.trips).toBe(0);
    expect(c.spendable).toBe(0);
  });

  it("no scope is the whole store", () => {
    const c = computeCash(shared);
    expect(c.inHand.trips).toBe(2);
    expect(c.looseSales).toBe(1);
    expect(c.inHand.collected).toBe(65_000 + 65_000 + 60_000);
  });
});

describe("returnRate", () => {
  it("counts only settled trips — one still on the road is not a success yet", () => {
    const c = computeCash({
      orders: [order("O1", { status: "pending" }), order("O2", { status: "pending" })],
      sales: [sale("a", { orderId: "O1" }), sale("b", { orderId: "O2" })],
      products,
      currency: IQD,
    });
    expect(returnRate(c)).toBeNull();
  });

  it("every trip coming back is 100%, not a divide by zero", () => {
    const c = computeCash({
      orders: [order("O1", { status: "returned" }), order("O2", { status: "cancelled" })],
      sales: [sale("a", { orderId: "O1" }), sale("b", { orderId: "O2" })],
      products,
      currency: IQD,
    });
    expect(returnRate(c)).toBe(1);
  });
});
