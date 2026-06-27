import type {
  Product,
  NewProduct,
  Sale,
  NewSale,
  AccountingPeriod,
  ProductRepository,
  SaleRepository,
  PeriodRepository,
  SettingsRepository,
  AppSettings,
} from "@/domain";
import { systemClock, uuidGenerator } from "@/infrastructure/system";
import { storage, STORAGE_KEYS } from "./storage";

const nowIso = () => systemClock.now().toISOString();

export class LocalProductRepository implements ProductRepository {
  async list(): Promise<Product[]> {
    return storage.get<Product[]>(STORAGE_KEYS.products, []);
  }
  async getById(id: string): Promise<Product | null> {
    return (await this.list()).find((p) => p.id === id) ?? null;
  }
  async create(product: NewProduct): Promise<Product> {
    const all = await this.list();
    const created: Product = {
      ...product,
      id: uuidGenerator.generate(),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    storage.set(STORAGE_KEYS.products, [created, ...all]);
    return created;
  }
  async update(id: string, patch: Partial<NewProduct>): Promise<Product> {
    const all = await this.list();
    let updated: Product | undefined;
    const next = all.map((p) => {
      if (p.id !== id) return p;
      updated = { ...p, ...patch, updatedAt: nowIso() };
      return updated;
    });
    if (!updated) throw new Error(`Product ${id} not found`);
    storage.set(STORAGE_KEYS.products, next);
    return updated;
  }
  async remove(id: string): Promise<void> {
    const all = await this.list();
    storage.set(
      STORAGE_KEYS.products,
      all.filter((p) => p.id !== id),
    );
  }
}

export class LocalSaleRepository implements SaleRepository {
  async list(filter?: { periodId?: string; productId?: string }): Promise<Sale[]> {
    let all = storage.get<Sale[]>(STORAGE_KEYS.sales, []);
    if (filter?.periodId) all = all.filter((s) => s.periodId === filter.periodId);
    if (filter?.productId) all = all.filter((s) => s.productId === filter.productId);
    return all;
  }
  async getById(id: string): Promise<Sale | null> {
    return (await this.list()).find((s) => s.id === id) ?? null;
  }
  async create(sale: NewSale): Promise<Sale> {
    const all = await this.list();
    const created: Sale = { ...sale, id: uuidGenerator.generate() };
    storage.set(STORAGE_KEYS.sales, [created, ...all]);
    return created;
  }
  async remove(id: string): Promise<void> {
    const all = await this.list();
    storage.set(
      STORAGE_KEYS.sales,
      all.filter((s) => s.id !== id),
    );
  }
}

export class LocalPeriodRepository implements PeriodRepository {
  async list(): Promise<AccountingPeriod[]> {
    return storage.get<AccountingPeriod[]>(STORAGE_KEYS.periods, []);
  }
  async getById(id: string): Promise<AccountingPeriod | null> {
    return (await this.list()).find((p) => p.id === id) ?? null;
  }
  async getActive(): Promise<AccountingPeriod | null> {
    return (await this.list()).find((p) => p.status === "open") ?? null;
  }
  async create(period: Omit<AccountingPeriod, "id">): Promise<AccountingPeriod> {
    const all = await this.list();
    const created: AccountingPeriod = { ...period, id: uuidGenerator.generate() };
    storage.set(STORAGE_KEYS.periods, [...all, created]);
    return created;
  }
  async update(id: string, patch: Partial<AccountingPeriod>): Promise<AccountingPeriod> {
    const all = await this.list();
    let updated: AccountingPeriod | undefined;
    const next = all.map((p) => {
      if (p.id !== id) return p;
      updated = { ...p, ...patch };
      return updated;
    });
    if (!updated) throw new Error(`Period ${id} not found`);
    storage.set(STORAGE_KEYS.periods, next);
    return updated;
  }
}

export const DEFAULT_SETTINGS: AppSettings = {
  currency: "IQD",
  locale: "ar-IQ",
  language: "ar",
  defaultCosts: {
    marketplaceFeePercent: 0,
    paymentFeePercent: 2.9,
    paymentFeeFixed: 0,
    taxPercent: 0,
  },
};

export class LocalSettingsRepository implements SettingsRepository {
  async get(): Promise<AppSettings> {
    return storage.get<AppSettings>(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
  }
  async save(settings: AppSettings): Promise<AppSettings> {
    storage.set(STORAGE_KEYS.settings, settings);
    return settings;
  }
}

// Singletons used across the app (swap these for cloud adapters later).
export const productRepository = new LocalProductRepository();
export const saleRepository = new LocalSaleRepository();
export const periodRepository = new LocalPeriodRepository();
export const settingsRepository = new LocalSettingsRepository();
