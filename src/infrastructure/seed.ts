import type { Product, Sale, AccountingPeriod, NewProduct } from "@/domain";
import { makeCostBreakdown } from "@/domain";
import {
  productRepository,
  saleRepository,
  periodRepository,
  settingsRepository,
  DEFAULT_SETTINGS,
} from "./persistence/local-storage/repositories";
import { uuidGenerator } from "./system";

const CURRENCY = "USD";

/** Demo catalog with realistic names and cost structures (not generic placeholders). */
const SEED_PRODUCTS: Array<NewProduct & { id: string }> = [
  {
    id: "seed-tote",
    name: "Linen Crossbody Tote",
    sku: "BAG-LIN-01",
    category: "Bags",
    sellingPrice: 64,
    currency: CURRENCY,
    status: "active",
    costs: makeCostBreakdown({
      purchase: { fixed: 21, percent: 0 },
      shipping: { fixed: 5.4, percent: 0 },
      packaging: { fixed: 1.2, percent: 0 },
      marketplaceFees: { fixed: 0, percent: 8 },
      paymentFees: { fixed: 0.3, percent: 2.9 },
    }),
  },
  {
    id: "seed-matcha",
    name: "Matcha Whisk & Bowl Set",
    sku: "KIT-MAT-02",
    category: "Kitchen",
    sellingPrice: 38,
    currency: CURRENCY,
    status: "active",
    costs: makeCostBreakdown({
      purchase: { fixed: 14.5, percent: 0 },
      shipping: { fixed: 4.2, percent: 0 },
      packaging: { fixed: 0.9, percent: 0 },
      marketplaceFees: { fixed: 0, percent: 8 },
      paymentFees: { fixed: 0.3, percent: 2.9 },
    }),
  },
  {
    id: "seed-scarf",
    name: "Merino Wool Scarf",
    sku: "APP-SCF-03",
    category: "Apparel",
    sellingPrice: 72,
    currency: CURRENCY,
    status: "active",
    costs: makeCostBreakdown({
      purchase: { fixed: 26, percent: 0 },
      shipping: { fixed: 6, percent: 0 },
      packaging: { fixed: 1.5, percent: 0 },
      marketplaceFees: { fixed: 0, percent: 10 },
      paymentFees: { fixed: 0.3, percent: 2.9 },
    }),
  },
  {
    id: "seed-candle",
    name: "Cedar & Sage Soy Candle",
    sku: "HOM-CND-04",
    category: "Home",
    sellingPrice: 28,
    currency: CURRENCY,
    status: "active",
    costs: makeCostBreakdown({
      purchase: { fixed: 9.8, percent: 0 },
      shipping: { fixed: 4.8, percent: 0 },
      packaging: { fixed: 1.1, percent: 0 },
      marketplaceFees: { fixed: 0, percent: 8 },
      paymentFees: { fixed: 0.3, percent: 2.9 },
      taxes: { fixed: 0, percent: 5 },
    }),
  },
  {
    id: "seed-mug",
    name: "Stoneware Pour-Over Mug",
    sku: "KIT-MUG-05",
    category: "Kitchen",
    sellingPrice: 24,
    currency: CURRENCY,
    status: "active",
    costs: makeCostBreakdown({
      // Intentionally thin margin to demonstrate loss/low-profit states.
      purchase: { fixed: 13.5, percent: 0 },
      shipping: { fixed: 6.5, percent: 0 },
      packaging: { fixed: 1.4, percent: 0 },
      marketplaceFees: { fixed: 0, percent: 8 },
      paymentFees: { fixed: 0.3, percent: 2.9 },
    }),
  },
  {
    id: "seed-journal",
    name: "Refillable Leather Journal",
    sku: "STA-JRN-06",
    category: "Stationery",
    sellingPrice: 45,
    currency: CURRENCY,
    status: "active",
    costs: makeCostBreakdown({
      purchase: { fixed: 15, percent: 0 },
      shipping: { fixed: 4.5, percent: 0 },
      packaging: { fixed: 1, percent: 0 },
      marketplaceFees: { fixed: 0, percent: 8 },
      paymentFees: { fixed: 0.3, percent: 2.9 },
    }),
  },
];

// Deterministic pseudo-random for reproducible seed volumes per month.
function seededCount(monthIndex: number, productIndex: number): number {
  const base = ((monthIndex * 7 + productIndex * 13) % 9) + 2; // 2..10
  return base;
}

function buildSeed(): { products: Product[]; sales: Sale[]; period: AccountingPeriod } {
  const now = new Date();
  const year = now.getFullYear();
  const currentMonth = now.getMonth();

  const products: Product[] = SEED_PRODUCTS.map((p) => ({
    ...p,
    createdAt: new Date(year, currentMonth - 5, 1).toISOString(),
    updatedAt: now.toISOString(),
  }));

  const sales: Sale[] = [];
  // Last 6 months of sales (including current month).
  for (let m = 5; m >= 0; m--) {
    const monthDate = new Date(year, currentMonth - m, 1);
    products.forEach((product, pi) => {
      const count = seededCount(m, pi);
      for (let i = 0; i < count; i++) {
        const day = Math.min(((i * 3 + pi * 2) % 27) + 1, 27);
        const soldAt = new Date(
          monthDate.getFullYear(),
          monthDate.getMonth(),
          day,
          12,
        ).toISOString();
        sales.push({
          id: uuidGenerator.generate(),
          productId: product.id,
          quantity: 1 + ((i + pi) % 3),
          unitPrice: product.sellingPrice,
          currency: CURRENCY,
          soldAt,
        });
      }
    });
  }

  const period: AccountingPeriod = {
    id: "seed-period-current",
    label: new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(now),
    startDate: new Date(year, currentMonth, 1).toISOString(),
    status: "open",
  };

  // Tag current-month sales with the open period.
  for (const sale of sales) {
    const d = new Date(sale.soldAt);
    if (d.getFullYear() === year && d.getMonth() === currentMonth) {
      sale.periodId = period.id;
    }
  }

  return { products, sales, period };
}

/**
 * Populate demo data on first run only. Idempotent: does nothing if products
 * already exist. Always ensures settings exist.
 */
export async function seedIfEmpty(): Promise<void> {
  const existing = await productRepository.list();
  await settingsRepository.save(await settingsRepository.get().catch(() => DEFAULT_SETTINGS));
  if (existing.length > 0) return;

  const { products, sales, period } = buildSeed();
  for (const product of products) {
    // Write directly to preserve seed ids/timestamps.
    await productRepository.create({
      name: product.name,
      sku: product.sku,
      category: product.category,
      sellingPrice: product.sellingPrice,
      currency: product.currency,
      costs: product.costs,
      status: product.status,
      notes: product.notes,
      images: product.images,
    });
  }
  // Re-map seed product ids to the generated ids by name.
  const created = await productRepository.list();
  const byName = new Map(created.map((p) => [p.name, p.id]));
  const nameById = new Map(products.map((p) => [p.id, p.name]));

  await periodRepository.create({
    label: period.label,
    startDate: period.startDate,
    status: period.status,
  });
  const activePeriod = await periodRepository.getActive();

  for (const sale of sales) {
    const productName = nameById.get(sale.productId);
    const realProductId = productName ? byName.get(productName) : undefined;
    if (!realProductId) continue;
    await saleRepository.create({
      productId: realProductId,
      quantity: sale.quantity,
      unitPrice: sale.unitPrice,
      currency: sale.currency,
      soldAt: sale.soldAt,
      periodId: sale.periodId ? activePeriod?.id : undefined,
    });
  }
}
