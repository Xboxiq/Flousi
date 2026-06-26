import type { Product, Sale, AccountingPeriod, AppSettings } from "@/domain";
import { storage, STORAGE_KEYS } from "./storage";
import { DEFAULT_SETTINGS } from "./repositories";

export interface BackupFile {
  app: "flousi";
  version: 1;
  exportedAt: string;
  products: Product[];
  sales: Sale[];
  periods: AccountingPeriod[];
  settings: AppSettings;
}

export function exportAll(): BackupFile {
  return {
    app: "flousi",
    version: 1,
    exportedAt: new Date().toISOString(),
    products: storage.get<Product[]>(STORAGE_KEYS.products, []),
    sales: storage.get<Sale[]>(STORAGE_KEYS.sales, []),
    periods: storage.get<AccountingPeriod[]>(STORAGE_KEYS.periods, []),
    settings: storage.get<AppSettings>(STORAGE_KEYS.settings, DEFAULT_SETTINGS),
  };
}

export function downloadBackup(): void {
  const blob = new Blob([JSON.stringify(exportAll(), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `flousi-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Validate and restore a backup. Throws on an invalid file. */
export function importAll(raw: unknown): void {
  const data = raw as Partial<BackupFile>;
  if (!data || data.app !== "flousi" || !Array.isArray(data.products)) {
    throw new Error("This file is not a valid Flousi backup.");
  }
  storage.set(STORAGE_KEYS.products, data.products ?? []);
  storage.set(STORAGE_KEYS.sales, data.sales ?? []);
  storage.set(STORAGE_KEYS.periods, data.periods ?? []);
  if (data.settings) storage.set(STORAGE_KEYS.settings, data.settings);
}

/** Wipe all Flousi data (used by "reset" — reseeds on next load). */
export function clearAll(): void {
  storage.remove(STORAGE_KEYS.products);
  storage.remove(STORAGE_KEYS.sales);
  storage.remove(STORAGE_KEYS.periods);
  storage.remove(STORAGE_KEYS.settings);
}
