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
  Target,
  NewTarget,
  TargetMetric,
  TargetRepository,
  Role,
  NewRole,
  RoleRepository,
  AccessSession,
  AccessStore,
  PinRecord,
  Order,
  NewOrder,
  OrderRepository,
} from "@/domain";
import { systemClock, uuidGenerator } from "@/infrastructure/system";
import { isOwnerRole, ownerRole } from "@/domain";
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
  // Legacy field, kept only so a pre-P2 backup still imports. Targets live in
  // their own store from P2 on, and `runMigrations` zeroes whatever is here.
  monthlyProfitTarget: 0,
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

export class LocalTargetRepository implements TargetRepository {
  async list(filter?: {
    metric?: TargetMetric;
    repId?: string;
    productId?: string;
  }): Promise<Target[]> {
    let all = storage.get<Target[]>(STORAGE_KEYS.targets, []);
    if (filter?.metric) all = all.filter((t) => t.metric === filter.metric);
    if (filter?.repId) all = all.filter((t) => t.repId === filter.repId);
    if (filter?.productId) all = all.filter((t) => t.productId === filter.productId);
    return all;
  }
  async getById(id: string): Promise<Target | null> {
    return (await this.list()).find((t) => t.id === id) ?? null;
  }
  async create(target: NewTarget): Promise<Target> {
    const all = await this.list();
    const created: Target = {
      ...target,
      id: uuidGenerator.generate(),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    storage.set(STORAGE_KEYS.targets, [created, ...all]);
    return created;
  }
  async update(id: string, patch: Partial<NewTarget>): Promise<Target> {
    const all = await this.list();
    let updated: Target | undefined;
    const next = all.map((t) => {
      if (t.id !== id) return t;
      updated = { ...t, ...patch, updatedAt: nowIso() };
      return updated;
    });
    if (!updated) throw new Error(`Target ${id} not found`);
    storage.set(STORAGE_KEYS.targets, next);
    return updated;
  }
  async remove(id: string): Promise<void> {
    const all = await this.list();
    storage.set(
      STORAGE_KEYS.targets,
      all.filter((t) => t.id !== id),
    );
  }
}

export class LocalRoleRepository implements RoleRepository {
  /**
   * The owner is always first and always present, even on a store that has never
   * seen this feature: it is not a seeded row that could be missing, it is a fact
   * about the product (gate P3/G2).
   */
  async list(): Promise<Role[]> {
    const stored = storage.get<Role[]>(STORAGE_KEYS.roles, []);
    const custom = stored.filter((r) => !isOwnerRole(r));
    return [ownerRole(), ...custom];
  }
  async getById(id: string): Promise<Role | null> {
    return (await this.list()).find((r) => r.id === id) ?? null;
  }
  async create(role: NewRole): Promise<Role> {
    const stored = storage.get<Role[]>(STORAGE_KEYS.roles, []).filter((r) => !isOwnerRole(r));
    const created: Role = {
      ...role,
      builtIn: false,
      id: uuidGenerator.generate(),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    storage.set(STORAGE_KEYS.roles, [...stored, created]);
    return created;
  }
  async update(id: string, patch: Partial<NewRole>): Promise<Role> {
    if (id === ownerRole().id) throw new Error("دور المالك غير قابل للتعديل.");
    const stored = storage.get<Role[]>(STORAGE_KEYS.roles, []).filter((r) => !isOwnerRole(r));
    let updated: Role | undefined;
    const next = stored.map((r) => {
      if (r.id !== id) return r;
      // `builtIn` and `id` are never patchable: a custom role must not be able to
      // promote itself into the un-editable one.
      updated = { ...r, ...patch, id: r.id, builtIn: false, updatedAt: nowIso() };
      return updated;
    });
    if (!updated) throw new Error(`Role ${id} not found`);
    storage.set(STORAGE_KEYS.roles, next);
    return updated;
  }
  async remove(id: string): Promise<void> {
    if (id === ownerRole().id) throw new Error("دور المالك غير قابل للحذف.");
    const stored = storage.get<Role[]>(STORAGE_KEYS.roles, []).filter((r) => !isOwnerRole(r));
    storage.set(
      STORAGE_KEYS.roles,
      stored.filter((r) => r.id !== id),
    );
  }
}

export class LocalAccessStore implements AccessStore {
  async getSession(): Promise<AccessSession | null> {
    return storage.get<AccessSession | null>(STORAGE_KEYS.accessSession, null);
  }
  async setSession(session: AccessSession): Promise<void> {
    storage.set(STORAGE_KEYS.accessSession, session);
  }
  async getPin(): Promise<PinRecord | null> {
    return storage.get<PinRecord | null>(STORAGE_KEYS.accessPin, null);
  }
  async setPin(record: PinRecord | null): Promise<void> {
    if (record === null) storage.remove(STORAGE_KEYS.accessPin);
    else storage.set(STORAGE_KEYS.accessPin, record);
  }
}

export class LocalOrderRepository implements OrderRepository {
  async list(filter?: { repId?: string; periodId?: string }): Promise<Order[]> {
    let all = storage.get<Order[]>(STORAGE_KEYS.orders, []);
    if (filter?.repId) all = all.filter((o) => o.repId === filter.repId);
    if (filter?.periodId) all = all.filter((o) => o.periodId === filter.periodId);
    return all;
  }
  async getById(id: string): Promise<Order | null> {
    return (await this.list()).find((o) => o.id === id) ?? null;
  }
  async create(order: NewOrder): Promise<Order> {
    const all = await this.list();
    const created: Order = {
      ...order,
      id: uuidGenerator.generate(),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    storage.set(STORAGE_KEYS.orders, [created, ...all]);
    return created;
  }
  async update(id: string, patch: Partial<NewOrder>): Promise<Order> {
    const all = await this.list();
    let updated: Order | undefined;
    const next = all.map((o) => {
      if (o.id !== id) return o;
      updated = { ...o, ...patch, updatedAt: nowIso() };
      return updated;
    });
    if (!updated) throw new Error(`Order ${id} not found`);
    storage.set(STORAGE_KEYS.orders, next);
    return updated;
  }
  async remove(id: string): Promise<void> {
    const all = await this.list();
    storage.set(
      STORAGE_KEYS.orders,
      all.filter((o) => o.id !== id),
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
export const targetRepository = new LocalTargetRepository();
export const orderRepository = new LocalOrderRepository();
export const roleRepository = new LocalRoleRepository();
export const accessStore = new LocalAccessStore();
