import { describe, expect, it } from "vitest";
import { buildReport, toExportableTable } from "./reports";
import { makeCostBreakdown, type Product, type Sale } from "@/domain";

const products: Product[] = [
  {
    id: "p1",
    name: "Alpha",
    sku: "A-1",
    sellingPrice: 100,
    currency: "USD",
    status: "active",
    costs: makeCostBreakdown({ purchase: { fixed: 40, percent: 0 }, marketplaceFees: { fixed: 0, percent: 10 } }),
    createdAt: "",
    updatedAt: "",
  },
];

const sales: Sale[] = [
  { id: "s1", productId: "p1", quantity: 1, unitPrice: 100, currency: "USD", soldAt: "2026-06-10T12:00:00Z" },
  { id: "s2", productId: "p1", quantity: 1, unitPrice: 100, currency: "USD", soldAt: "2026-05-10T12:00:00Z" },
];

describe("buildReport", () => {
  it("builds a product report sorted by net profit", () => {
    const r = buildReport("product", products, sales);
    expect(r.columns[0].label).toBe("Product");
    expect(r.rows[0][0]).toBe("Alpha");
    // 2 sales x (100 - 40 - 10) = 100 net profit
    const netProfitCol = r.columns.findIndex((c) => c.kind === "profit");
    expect(r.rows[0][netProfitCol]).toBe(100);
  });

  it("buckets monthly report by month", () => {
    const r = buildReport("monthly", products, sales);
    expect(r.rows).toHaveLength(2); // May + June
  });

  it("aggregates expense report by cost line with shares", () => {
    const r = buildReport("expense", products, sales);
    const labels = r.rows.map((row) => row[0]);
    expect(labels).toContain("Purchase cost");
    expect(labels).toContain("Marketplace fees");
    // shares sum to ~1
    const shareCol = r.columns.findIndex((c) => c.kind === "percent");
    const sum = r.rows.reduce((acc, row) => acc + Number(row[shareCol]), 0);
    expect(sum).toBeCloseTo(1, 5);
  });
});

describe("toExportableTable", () => {
  it("flattens to columns + raw rows", () => {
    const table = toExportableTable(buildReport("yearly", products, sales));
    expect(table.columns[0]).toBe("Year");
    expect(table.rows[0][0]).toBe("2026");
  });
});
