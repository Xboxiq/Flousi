"use client";

import { create } from "zustand";
import type { Product, NewProduct, Sale, NewSale, AccountingPeriod, AppSettings } from "@/domain";
import {
  productRepository,
  saleRepository,
  periodRepository,
  settingsRepository,
  DEFAULT_SETTINGS,
} from "@/infrastructure/persistence/local-storage/repositories";
import { seedIfEmpty } from "@/infrastructure/seed";

interface DataState {
  loaded: boolean;
  products: Product[];
  sales: Sale[];
  periods: AccountingPeriod[];
  settings: AppSettings;

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
}

async function loadAll() {
  const [products, sales, periods, settings] = await Promise.all([
    productRepository.list(),
    saleRepository.list(),
    periodRepository.list(),
    settingsRepository.get(),
  ]);
  return { products, sales, periods, settings };
}

export const useDataStore = create<DataState>((set, get) => ({
  loaded: false,
  products: [],
  sales: [],
  periods: [],
  settings: DEFAULT_SETTINGS,

  init: async () => {
    if (get().loaded) return;
    await seedIfEmpty();
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
}));
