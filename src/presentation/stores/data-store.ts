"use client";

import { create } from "zustand";
import type {
  Product,
  NewProduct,
  Sale,
  NewSale,
  AccountingPeriod,
  AppSettings,
  Rep,
  NewRep,
  CommissionScheme,
  NewCommissionScheme,
  CommissionAssignment,
  NewCommissionAssignment,
  Settlement,
  NewSettlement,
  Target,
  NewTarget,
} from "@/domain";
import {
  productRepository,
  saleRepository,
  periodRepository,
  settingsRepository,
  repRepository,
  commissionSchemeRepository,
  commissionAssignmentRepository,
  settlementRepository,
  targetRepository,
  DEFAULT_SETTINGS,
} from "@/infrastructure/persistence/local-storage/repositories";
import { seedIfEmpty } from "@/infrastructure/seed";
import { runMigrations } from "@/infrastructure/migrations";

interface DataState {
  loaded: boolean;
  products: Product[];
  sales: Sale[];
  periods: AccountingPeriod[];
  settings: AppSettings;
  reps: Rep[];
  commissionSchemes: CommissionScheme[];
  commissionAssignments: CommissionAssignment[];
  settlements: Settlement[];
  targets: Target[];

  init: () => Promise<void>;
  reload: () => Promise<void>;

  createProduct: (input: NewProduct) => Promise<Product>;
  updateProduct: (id: string, patch: Partial<NewProduct>) => Promise<Product>;
  deleteProduct: (id: string) => Promise<void>;

  createSale: (input: NewSale) => Promise<Sale>;
  deleteSale: (id: string) => Promise<void>;

  closePeriod: (id: string, patch: Partial<AccountingPeriod>) => Promise<void>;
  openPeriod: (period: Omit<AccountingPeriod, "id">) => Promise<AccountingPeriod>;

  saveSettings: (settings: AppSettings) => Promise<void>;

  createRep: (input: NewRep) => Promise<Rep>;
  updateRep: (id: string, patch: Partial<NewRep>) => Promise<Rep>;
  /** Retiring a rep is an archive: they stay payable and stay in history. */
  archiveRep: (id: string) => Promise<Rep>;
  restoreRep: (id: string) => Promise<Rep>;

  createCommissionScheme: (input: NewCommissionScheme) => Promise<CommissionScheme>;
  /** Edits bind NEW sales only — every frozen snapshot is left untouched. */
  updateCommissionScheme: (
    id: string,
    patch: Partial<NewCommissionScheme>,
  ) => Promise<CommissionScheme>;
  /** Deleting a scheme is an archive: it stays readable for the history it froze. */
  archiveCommissionScheme: (id: string) => Promise<CommissionScheme>;

  createTarget: (input: NewTarget) => Promise<Target>;
  updateTarget: (id: string, patch: Partial<NewTarget>) => Promise<Target>;
  deleteTarget: (id: string) => Promise<void>;

  createCommissionAssignment: (input: NewCommissionAssignment) => Promise<CommissionAssignment>;
  updateCommissionAssignment: (
    id: string,
    patch: Partial<NewCommissionAssignment>,
  ) => Promise<CommissionAssignment>;
  deleteCommissionAssignment: (id: string) => Promise<void>;

  createSettlement: (input: NewSettlement) => Promise<Settlement>;
  updateSettlement: (id: string, patch: Partial<NewSettlement>) => Promise<Settlement>;
  deleteSettlement: (id: string) => Promise<void>;
}

async function loadAll() {
  const [
    products,
    sales,
    periods,
    settings,
    reps,
    commissionSchemes,
    commissionAssignments,
    settlements,
    targets,
  ] = await Promise.all([
    productRepository.list(),
    saleRepository.list(),
    periodRepository.list(),
    settingsRepository.get(),
    repRepository.list(),
    commissionSchemeRepository.list(),
    commissionAssignmentRepository.list(),
    settlementRepository.list(),
    targetRepository.list(),
  ]);
  return {
    products,
    sales,
    periods,
    settings,
    reps,
    commissionSchemes,
    commissionAssignments,
    settlements,
    targets,
  };
}

export const useDataStore = create<DataState>((set, get) => ({
  loaded: false,
  products: [],
  sales: [],
  periods: [],
  settings: DEFAULT_SETTINGS,
  reps: [],
  commissionSchemes: [],
  commissionAssignments: [],
  settlements: [],
  targets: [],

  init: async () => {
    if (get().loaded) return;
    await seedIfEmpty();
    // Lifts run AFTER the seed and BEFORE the first read, so a store restored
    // from a pre-P2 backup is already migrated by the time a screen reads it.
    await runMigrations();
    set({ ...(await loadAll()), loaded: true });
  },

  reload: async () => {
    set({ ...(await loadAll()) });
  },

  createProduct: async (input) => {
    const created = await productRepository.create(input);
    set({ products: await productRepository.list() });
    return created;
  },
  updateProduct: async (id, patch) => {
    const updated = await productRepository.update(id, patch);
    set({ products: await productRepository.list() });
    return updated;
  },
  deleteProduct: async (id) => {
    await productRepository.remove(id);
    set({ products: await productRepository.list() });
  },

  createSale: async (input) => {
    const created = await saleRepository.create(input);
    set({ sales: await saleRepository.list() });
    return created;
  },
  deleteSale: async (id) => {
    await saleRepository.remove(id);
    set({ sales: await saleRepository.list() });
  },

  closePeriod: async (id, patch) => {
    await periodRepository.update(id, patch);
    set({ periods: await periodRepository.list() });
  },
  openPeriod: async (period) => {
    const created = await periodRepository.create(period);
    set({ periods: await periodRepository.list() });
    return created;
  },

  saveSettings: async (settings) => {
    await settingsRepository.save(settings);
    set({ settings });
  },

  createRep: async (input) => {
    const created = await repRepository.create(input);
    set({ reps: await repRepository.list() });
    return created;
  },
  updateRep: async (id, patch) => {
    const updated = await repRepository.update(id, patch);
    set({ reps: await repRepository.list() });
    return updated;
  },
  archiveRep: async (id) => {
    const updated = await repRepository.update(id, { status: "archived" });
    set({ reps: await repRepository.list() });
    return updated;
  },
  restoreRep: async (id) => {
    const updated = await repRepository.update(id, { status: "active" });
    set({ reps: await repRepository.list() });
    return updated;
  },

  createCommissionScheme: async (input) => {
    const created = await commissionSchemeRepository.create(input);
    set({ commissionSchemes: await commissionSchemeRepository.list() });
    return created;
  },
  updateCommissionScheme: async (id, patch) => {
    const updated = await commissionSchemeRepository.update(id, patch);
    // Sales keep their frozen snapshots, so `sales` deliberately is not reloaded.
    set({ commissionSchemes: await commissionSchemeRepository.list() });
    return updated;
  },
  archiveCommissionScheme: async (id) => {
    const updated = await commissionSchemeRepository.update(id, { status: "archived" });
    set({ commissionSchemes: await commissionSchemeRepository.list() });
    return updated;
  },

  createTarget: async (input) => {
    const created = await targetRepository.create(input);
    set({ targets: await targetRepository.list() });
    return created;
  },
  updateTarget: async (id, patch) => {
    const updated = await targetRepository.update(id, patch);
    set({ targets: await targetRepository.list() });
    return updated;
  },
  deleteTarget: async (id) => {
    await targetRepository.remove(id);
    set({ targets: await targetRepository.list() });
  },

  createCommissionAssignment: async (input) => {
    const created = await commissionAssignmentRepository.create(input);
    set({ commissionAssignments: await commissionAssignmentRepository.list() });
    return created;
  },
  updateCommissionAssignment: async (id, patch) => {
    const updated = await commissionAssignmentRepository.update(id, patch);
    set({ commissionAssignments: await commissionAssignmentRepository.list() });
    return updated;
  },
  deleteCommissionAssignment: async (id) => {
    await commissionAssignmentRepository.remove(id);
    set({ commissionAssignments: await commissionAssignmentRepository.list() });
  },

  createSettlement: async (input) => {
    const created = await settlementRepository.create(input);
    set({ settlements: await settlementRepository.list() });
    return created;
  },
  updateSettlement: async (id, patch) => {
    const updated = await settlementRepository.update(id, patch);
    set({ settlements: await settlementRepository.list() });
    return updated;
  },
  deleteSettlement: async (id) => {
    await settlementRepository.remove(id);
    set({ settlements: await settlementRepository.list() });
  },
}));
