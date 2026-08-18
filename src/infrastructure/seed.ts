import type {
  Product,
  Sale,
  NewSale,
  AccountingPeriod,
  NewProduct,
  NewRep,
  NewCommissionScheme,
} from "@/domain";
import { CommissionCalculator, defaultCommissionSchemeParams, makeCostBreakdown } from "@/domain";
import {
  productRepository,
  saleRepository,
  periodRepository,
  settingsRepository,
  repRepository,
  commissionSchemeRepository,
  commissionAssignmentRepository,
  settlementRepository,
  DEFAULT_SETTINGS,
} from "./persistence/local-storage/repositories";
import { uuidGenerator } from "./system";

const CURRENCY = "IQD";

/** Demo catalog — Arabic names, realistic Iraqi Dinar pricing. */
const SEED_PRODUCTS: Array<NewProduct & { id: string }> = [
  {
    id: "seed-tote",
    name: "حقيبة كتان كروس",
    sku: "BAG-LIN-01",
    category: "حقائب",
    sellingPrice: 85000,
    currency: CURRENCY,
    status: "active",
    costs: makeCostBreakdown({
      purchase: { fixed: 28000, percent: 0 },
      shipping: { fixed: 7000, percent: 0 },
      packaging: { fixed: 1500, percent: 0 },
      marketplaceFees: { fixed: 0, percent: 8 },
      paymentFees: { fixed: 0, percent: 2.9 },
    }),
  },
  {
    id: "seed-matcha",
    name: "طقم ماتشا (مضرب وزبدية)",
    sku: "KIT-MAT-02",
    category: "مطبخ",
    sellingPrice: 50000,
    currency: CURRENCY,
    status: "active",
    costs: makeCostBreakdown({
      purchase: { fixed: 19000, percent: 0 },
      shipping: { fixed: 5500, percent: 0 },
      packaging: { fixed: 1200, percent: 0 },
      marketplaceFees: { fixed: 0, percent: 8 },
      paymentFees: { fixed: 0, percent: 2.9 },
    }),
  },
  {
    id: "seed-scarf",
    name: "وشاح صوف ميرينو",
    sku: "APP-SCF-03",
    category: "أزياء",
    sellingPrice: 95000,
    currency: CURRENCY,
    status: "active",
    costs: makeCostBreakdown({
      purchase: { fixed: 34000, percent: 0 },
      shipping: { fixed: 8000, percent: 0 },
      packaging: { fixed: 2000, percent: 0 },
      marketplaceFees: { fixed: 0, percent: 10 },
      paymentFees: { fixed: 0, percent: 2.9 },
    }),
  },
  {
    id: "seed-candle",
    name: "شمعة أرز ومريمية",
    sku: "HOM-CND-04",
    category: "منزل",
    sellingPrice: 37000,
    currency: CURRENCY,
    status: "active",
    costs: makeCostBreakdown({
      purchase: { fixed: 13000, percent: 0 },
      shipping: { fixed: 6000, percent: 0 },
      packaging: { fixed: 1500, percent: 0 },
      marketplaceFees: { fixed: 0, percent: 8 },
      paymentFees: { fixed: 0, percent: 2.9 },
      taxes: { fixed: 0, percent: 5 },
    }),
  },
  {
    id: "seed-mug",
    name: "كوب حجري للقهوة المقطّرة",
    sku: "KIT-MUG-05",
    category: "مطبخ",
    sellingPrice: 32000,
    currency: CURRENCY,
    status: "active",
    costs: makeCostBreakdown({
      // هامش رفيع عمدًا لإظهار حالات الربح المنخفض/الخسارة.
      purchase: { fixed: 18000, percent: 0 },
      shipping: { fixed: 8500, percent: 0 },
      packaging: { fixed: 1800, percent: 0 },
      marketplaceFees: { fixed: 0, percent: 8 },
      paymentFees: { fixed: 0, percent: 2.9 },
    }),
  },
  {
    id: "seed-journal",
    name: "دفتر جلدي قابل لإعادة التعبئة",
    sku: "STA-JRN-06",
    category: "قرطاسية",
    sellingPrice: 60000,
    currency: CURRENCY,
    status: "active",
    costs: makeCostBreakdown({
      purchase: { fixed: 20000, percent: 0 },
      shipping: { fixed: 6000, percent: 0 },
      packaging: { fixed: 1300, percent: 0 },
      marketplaceFees: { fixed: 0, percent: 8 },
      paymentFees: { fixed: 0, percent: 2.9 },
    }),
  },
];

/** The demo team. Order is load-bearing: `seededRepSlot` indexes into it. */
const SEED_REPS: NewRep[] = [
  {
    name: "سعد الجبوري",
    phone: "0770 148 2260",
    status: "active",
    notes: "يغطي الكرادة والجادرية.",
  },
  {
    name: "ليث العبيدي",
    phone: "0781 905 3374",
    status: "active",
    notes: "على اتفاق الربح الأولي — الشحن والرسوم على التاجر.",
  },
  {
    name: "نور الحسن",
    phone: "0751 622 8815",
    // Archived, not deleted: نور توقّفت عن العمل ولها رصيد ما زال مستحقاً.
    status: "archived",
    notes: "متوقّفة مؤقتاً — الرصيد المتبقّي يبقى مستحقاً.",
  },
];

/** Keys are internal handles for wiring the overrides; only `name` reaches storage. */
const SCHEME_KEYS = {
  half: "المناصفة الافتراضية",
  thinMargin: "نسبة الهامش الرفيع",
  grossProfit: "مناصفة الربح الأولي",
} as const;

/** The product whose thin margin cannot honour the house rate. */
const THIN_MARGIN_SKU = "KIT-MUG-05";
/** The rep on a negotiated deal. Index into SEED_REPS. */
const SENIOR_REP_INDEX = 1;

const SEED_SCHEMES: NewCommissionScheme[] = [
  // The house default — the client's verbatim 50/50 of net profit, rep shielded
  // from losses. Becomes `AppSettings.defaultCommissionSchemeId`.
  { ...defaultCommissionSchemeParams(), name: SCHEME_KEYS.half, status: "active" },
  // Product tier: a deliberately thin-margin item cannot carry the house rate.
  {
    ...defaultCommissionSchemeParams(),
    name: SCHEME_KEYS.thinMargin,
    repRatio: 0.3,
    status: "active",
  },
  // Rep tier: the senior rep splits the profit BEFORE logistics, so shipping,
  // packaging and fees stay the owner's risk alone. The ratio is lower than the
  // house 0.5 precisely because the basis is larger — which is what makes the
  // gap between the owner's contracted share and what the owner actually keeps
  // visible on the very first screen.
  {
    ...defaultCommissionSchemeParams(),
    name: SCHEME_KEYS.grossProfit,
    repRatio: 0.4,
    profitBasis: "afterPurchaseCost",
    status: "active",
  },
];

/** A merchant hands over a round sum: 5,000 IQD, in minor units. */
const SETTLEMENT_ROUNDING_MINOR = 500_000;
/** Four fifths of what was earned, so a real remainder carries forward. */
const SETTLEMENT_NUMERATOR = 4;
const SETTLEMENT_DENOMINATOR = 5;

/**
 * What the merchant would already have handed over: four fifths of the earlier
 * months' earnings, rounded down to a round 5,000 IQD. Integer throughout, and
 * the result is an exact multiple of the rounding step.
 */
function seededSettlementMinor(earnedMinor: number): number {
  const step = SETTLEMENT_DENOMINATOR * SETTLEMENT_ROUNDING_MINOR;
  return Math.floor((earnedMinor * SETTLEMENT_NUMERATOR) / step) * SETTLEMENT_ROUNDING_MINOR;
}

// Deterministic pseudo-random for reproducible seed volumes per month.
function seededCount(monthIndex: number, productIndex: number): number {
  const base = ((monthIndex * 7 + productIndex * 13) % 9) + 2; // 2..10
  return base;
}

/**
 * Deterministic rep attribution: which of SEED_REPS gets credited, or -1 when
 * the owner sold it directly. Roughly 70% of the demo line items run through a
 * rep, and نور only appears in the older half of the window because she has
 * since been archived — so the reps screen has both a live team and a retired
 * member who is still owed money.
 */
function seededRepSlot(monthIndex: number, productIndex: number, saleIndex: number): number {
  const k = (monthIndex * 5 + productIndex * 7 + saleIndex * 11) % 10;
  if (k <= 3) return 0;
  if (k <= 6) return SENIOR_REP_INDEX;
  if (k === 7) return monthIndex >= 3 ? 2 : -1;
  return -1;
}

/** A seeded sale plus the rep slot it will be attributed to at record time. */
type SeedSale = Sale & { repSlot: number };

function buildSeed(): { products: Product[]; sales: SeedSale[]; period: AccountingPeriod } {
  const now = new Date();
  const year = now.getFullYear();
  const currentMonth = now.getMonth();

  const products: Product[] = SEED_PRODUCTS.map((p) => ({
    ...p,
    createdAt: new Date(year, currentMonth - 5, 1).toISOString(),
    updatedAt: now.toISOString(),
  }));

  const sales: SeedSale[] = [];
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
          repSlot: seededRepSlot(m, pi, i),
        });
      }
    });
  }

  const period: AccountingPeriod = {
    id: "seed-period-current",
    label: new Intl.DateTimeFormat("ar", { month: "long", year: "numeric" }).format(now),
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
 * Ensure the commission team exists, and return the id of the account-default
 * scheme.
 *
 * Guarded independently of the product catalog so a browser that already holds
 * real data gains the commission screens fully configured — while its own sales
 * stay owner-sold, because attributing a real merchant's history to a demo rep
 * would fabricate money owed to a person.
 */
async function seedTeamIfEmpty(products: Product[]): Promise<string | undefined> {
  const existingReps = await repRepository.list();
  const existingSchemes = await commissionSchemeRepository.list();

  if (existingReps.length === 0 && existingSchemes.length === 0) {
    for (const scheme of SEED_SCHEMES) await commissionSchemeRepository.create(scheme);
    for (const rep of SEED_REPS) await repRepository.create(rep);

    const schemes = await commissionSchemeRepository.list();
    const reps = await repRepository.list();
    const schemeByName = new Map(schemes.map((s) => [s.name, s]));
    const repByName = new Map(reps.map((r) => [r.name, r]));

    // Product tier: the thin-margin item drops to the reduced rate. Beats the
    // rep tier, so even the senior rep gets 30% on this one item.
    const thinMarginProduct = products.find((p) => p.sku === THIN_MARGIN_SKU);
    const thinMarginScheme = schemeByName.get(SCHEME_KEYS.thinMargin);
    if (thinMarginProduct && thinMarginScheme) {
      await commissionAssignmentRepository.create({
        schemeId: thinMarginScheme.id,
        productId: thinMarginProduct.id,
        status: "active",
      });
    }

    // Rep tier: the senior rep's negotiated deal, expressed as an assignment row
    // rather than a field on the rep, so every tier has exactly one home.
    const seniorRep = repByName.get(SEED_REPS[SENIOR_REP_INDEX].name);
    const grossProfitScheme = schemeByName.get(SCHEME_KEYS.grossProfit);
    if (seniorRep && grossProfitScheme) {
      await commissionAssignmentRepository.create({
        schemeId: grossProfitScheme.id,
        repId: seniorRep.id,
        status: "active",
      });
    }
  }

  const schemes = await commissionSchemeRepository.list();
  return schemes.find((s) => s.name === SCHEME_KEYS.half)?.id ?? schemes[0]?.id;
}

/**
 * Populate demo data on first run only. Idempotent: does nothing if products
 * already exist. Always ensures settings exist, and always ensures the
 * commission team exists.
 */
export async function seedIfEmpty(): Promise<void> {
  const existing = await productRepository.list();
  const settings = await settingsRepository.get().catch(() => DEFAULT_SETTINGS);

  const { products, sales, period } = buildSeed();
  if (existing.length === 0) {
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
  }
  // Re-map seed product ids to the generated ids by name.
  const created = await productRepository.list();
  const byName = new Map(created.map((p) => [p.name, p]));
  const nameById = new Map(products.map((p) => [p.id, p.name]));

  // Demo data is FIRST RUN ONLY, the team included. Seeding a team into a store
  // that already holds real products (a restored backup, say) would invent three
  // people and a payable the merchant never agreed to — the empty state on /reps
  // is the honest answer there, and it already points at «إضافة مندوب».
  if (existing.length > 0) return;

  const defaultSchemeId = await seedTeamIfEmpty(created);
  await settingsRepository.save({
    ...settings,
    // Never overwrite a default the merchant chose themselves.
    defaultCommissionSchemeId: settings.defaultCommissionSchemeId ?? defaultSchemeId,
  });

  const reps = await repRepository.list();
  const repByName = new Map(reps.map((r) => [r.name, r]));
  const schemes = await commissionSchemeRepository.list();
  const assignments = await commissionAssignmentRepository.list();

  await periodRepository.create({
    label: period.label,
    startDate: period.startDate,
    status: period.status,
  });
  const activePeriod = await periodRepository.getActive();

  // Rep share earned in the months before this one — what the merchant would
  // already have settled. Accumulated from the frozen snapshots themselves, so
  // the seeded balance is derived from real figures rather than a typed guess.
  const currentMonthStart = new Date(period.startDate);
  const earnedBeforeThisMonth = new Map<string, number>();

  for (const sale of sales) {
    const productName = nameById.get(sale.productId);
    const realProduct = productName ? byName.get(productName) : undefined;
    if (!realProduct) continue;

    const rep = sale.repSlot >= 0 ? repByName.get(SEED_REPS[sale.repSlot].name) : undefined;
    const draft: NewSale = {
      productId: realProduct.id,
      quantity: sale.quantity,
      unitPrice: sale.unitPrice,
      currency: sale.currency,
      soldAt: sale.soldAt,
      periodId: sale.periodId ? activePeriod?.id : undefined,
      repId: rep?.id,
    };

    // Exactly what the app does at record time: resolve most-specific-wins, then
    // freeze the split by value. calculatedAt is the sale's own timestamp because
    // the seed is fabricating history, not recording it now.
    const resolution = CommissionCalculator.resolveScheme({
      productId: realProduct.id,
      repId: rep?.id,
      assignments,
      schemes,
      accountDefaultSchemeId: defaultSchemeId,
    });
    const commissionSnapshot = rep
      ? CommissionCalculator.snapshot({
          sale: draft,
          costs: realProduct.costs,
          rep,
          resolution,
          calculatedAt: sale.soldAt,
        })
      : undefined;

    await saleRepository.create({ ...draft, commissionSnapshot });

    if (commissionSnapshot && new Date(sale.soldAt) < currentMonthStart) {
      earnedBeforeThisMonth.set(
        commissionSnapshot.repId,
        (earnedBeforeThisMonth.get(commissionSnapshot.repId) ?? 0) +
          commissionSnapshot.repShareMinor,
      );
    }
  }

  // One round partial payment per rep. The remainder carries forward, so the
  // reps screen opens on a real derived balance instead of a settled zero.
  for (const [repId, earnedMinor] of earnedBeforeThisMonth) {
    const amountMinor = seededSettlementMinor(earnedMinor);
    if (amountMinor <= 0) continue;
    await settlementRepository.create({
      repId,
      amountMinor,
      currency: CURRENCY,
      paidAt: currentMonthStart.toISOString(),
      periodId: activePeriod?.id,
      method: "نقداً",
      notes: "تسوية عن الأشهر السابقة.",
    });
  }
}
