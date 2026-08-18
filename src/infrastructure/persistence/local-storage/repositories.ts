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
  Rep,
  NewRep,
  RepStatus,
  RepRepository,
  CommissionScheme,
  NewCommissionScheme,
  CommissionSchemeRepository,
  CommissionAssignment,
  NewCommissionAssignment,
  CommissionAssignmentRepository,
  Settlement,
  NewSettlement,
  SettlementRepository,
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
  monthlyProfitTarget: 2_500_000,
  defaultCosts: {
    marketplaceFeePercent: 0,
    paymentFeePercent: 2.9,
    paymentFeeFixed: 0,
    taxPercent: 0,
  },
};

export class LocalSettingsRepository implements SettingsRepository {
  async get(): Promise<AppSettings> {
    // Merged over the defaults so a browser holding an older settings object
    // gains new keys instead of returning them undefined.
    const stored = storage.get<Partial<AppSettings>>(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
    return {
      ...DEFAULT_SETTINGS,
      ...stored,
      defaultCosts: { ...DEFAULT_SETTINGS.defaultCosts, ...stored.defaultCosts },
    };
  }
  async save(settings: AppSettings): Promise<AppSettings> {
    storage.set(STORAGE_KEYS.settings, settings);
    return settings;
  }
}

export class LocalRepRepository implements RepRepository {
  async list(filter?: { status?: RepStatus }): Promise<Rep[]> {
    const all = storage.get<Rep[]>(STORAGE_KEYS.reps, []);
    return filter?.status ? all.filter((r) => r.status === filter.status) : all;
  }
  async getById(id: string): Promise<Rep | null> {
    return (await this.list()).find((r) => r.id === id) ?? null;
  }
  async create(rep: NewRep): Promise<Rep> {
    const all = await this.list();
    const created: Rep = {
      ...rep,
      id: uuidGenerator.generate(),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    storage.set(STORAGE_KEYS.reps, [created, ...all]);
    return created;
  }
  async update(id: string, patch: Partial<NewRep>): Promise<Rep> {
    const all = await this.list();
    let updated: Rep | undefined;
    const next = all.map((r) => {
      if (r.id !== id) return r;
      updated = { ...r, ...patch, updatedAt: nowIso() };
      return updated;
    });
    if (!updated) throw new Error(`Rep ${id} not found`);
    storage.set(STORAGE_KEYS.reps, next);
    return updated;
  }
  // No remove(): a rep is archived instead, because history references them
  // forever and an archived rep stays payable.
}

export class LocalCommissionSchemeRepository implements CommissionSchemeRepository {
  async list(): Promise<CommissionScheme[]> {
    // Archived schemes included: the resolver decides what is eligible, and an
    // archived one stays readable for the history it already froze.
    return storage.get<CommissionScheme[]>(STORAGE_KEYS.commissionSchemes, []);
  }
  async getById(id: string): Promise<CommissionScheme | null> {
    return (await this.list()).find((s) => s.id === id) ?? null;
  }
  async create(scheme: NewCommissionScheme): Promise<CommissionScheme> {
    const all = await this.list();
    const created: CommissionScheme = {
      ...scheme,
      id: uuidGenerator.generate(),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    storage.set(STORAGE_KEYS.commissionSchemes, [created, ...all]);
    return created;
  }
  async update(id: string, patch: Partial<NewCommissionScheme>): Promise<CommissionScheme> {
    const all = await this.list();
    let updated: CommissionScheme | undefined;
    const next = all.map((s) => {
      if (s.id !== id) return s;
      updated = { ...s, ...patch, updatedAt: nowIso() };
      return updated;
    });
    if (!updated) throw new Error(`Commission scheme ${id} not found`);
    storage.set(STORAGE_KEYS.commissionSchemes, next);
    // Sales already recorded keep their frozen snapshot — an edit binds new sales only.
    return updated;
  }
  // No remove(): archive instead.
}

export class LocalCommissionAssignmentRepository implements CommissionAssignmentRepository {
  async list(): Promise<CommissionAssignment[]> {
    return storage.get<CommissionAssignment[]>(STORAGE_KEYS.commissionAssignments, []);
  }
  async create(assignment: NewCommissionAssignment): Promise<CommissionAssignment> {
    const all = await this.list();
    const created: CommissionAssignment = {
      ...assignment,
      id: uuidGenerator.generate(),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    storage.set(STORAGE_KEYS.commissionAssignments, [created, ...all]);
    return created;
  }
  async update(
    id: string,
    patch: Partial<NewCommissionAssignment>,
  ): Promise<CommissionAssignment> {
    const all = await this.list();
    let updated: CommissionAssignment | undefined;
    const next = all.map((a) => {
      if (a.id !== id) return a;
      updated = { ...a, ...patch, updatedAt: nowIso() };
      return updated;
    });
    if (!updated) throw new Error(`Commission assignment ${id} not found`);
    storage.set(STORAGE_KEYS.commissionAssignments, next);
    return updated;
  }
  /** A binding holds no history of its own, so removing one is safe. */
  async remove(id: string): Promise<void> {
    const all = await this.list();
    storage.set(
      STORAGE_KEYS.commissionAssignments,
      all.filter((a) => a.id !== id),
    );
  }
}

export class LocalSettlementRepository implements SettlementRepository {
  async list(filter?: { repId?: string; periodId?: string }): Promise<Settlement[]> {
    let all = storage.get<Settlement[]>(STORAGE_KEYS.settlements, []);
    if (filter?.repId) all = all.filter((s) => s.repId === filter.repId);
    if (filter?.periodId) all = all.filter((s) => s.periodId === filter.periodId);
    return all;
  }
  async getById(id: string): Promise<Settlement | null> {
    return (await this.list()).find((s) => s.id === id) ?? null;
  }
  async create(settlement: NewSettlement): Promise<Settlement> {
    const all = await this.list();
    const created: Settlement = { ...settlement, id: uuidGenerator.generate() };
    storage.set(STORAGE_KEYS.settlements, [created, ...all]);
    return created;
  }
  /** Amount and currency are both editable — a mistyped payment is corrected, not voided. */
  async update(id: string, patch: Partial<NewSettlement>): Promise<Settlement> {
    const all = await this.list();
    let updated: Settlement | undefined;
    const next = all.map((s) => {
      if (s.id !== id) return s;
      updated = { ...s, ...patch };
      return updated;
    });
    if (!updated) throw new Error(`Settlement ${id} not found`);
    storage.set(STORAGE_KEYS.settlements, next);
    return updated;
  }
  async remove(id: string): Promise<void> {
    const all = await this.list();
    storage.set(
      STORAGE_KEYS.settlements,
      all.filter((s) => s.id !== id),
    );
  }
}

// Singletons used across the app (swap these for cloud adapters later).
export const productRepository = new LocalProductRepository();
export const saleRepository = new LocalSaleRepository();
export const periodRepository = new LocalPeriodRepository();
export const settingsRepository = new LocalSettingsRepository();
export const repRepository = new LocalRepRepository();
export const commissionSchemeRepository = new LocalCommissionSchemeRepository();
export const commissionAssignmentRepository = new LocalCommissionAssignmentRepository();
export const settlementRepository = new LocalSettlementRepository();
