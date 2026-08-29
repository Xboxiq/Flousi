import type {
  Product,
  Sale,
  AccountingPeriod,
  AppSettings,
  Rep,
  CommissionScheme,
  CommissionAssignment,
  Settlement,
  Target,
  Role,
  Order,
} from "@/domain";
import { storage, STORAGE_KEYS } from "./storage";
import { DEFAULT_SETTINGS } from "./repositories";

export interface BackupFile {
  /* Files exported before the rename carry "flousi". Both are accepted on import. */
  app: "ritm" | "flousi";
  version: 1;
  exportedAt: string;
  products: Product[];
  sales: Sale[];
  periods: AccountingPeriod[];
  settings: AppSettings;
  /**
   * Commission collections. Optional on the type so a version-1 file written
   * before the commission feature still imports — the arrays fall back to empty
   * rather than failing validation. Frozen snapshots travel inside `sales`.
   */
  reps?: Rep[];
  commissionSchemes?: CommissionScheme[];
  commissionAssignments?: CommissionAssignment[];
  settlements?: Settlement[];
  targets?: Target[];
  /** Roles travel with a backup; the session and the PIN stay on the device. */
  roles?: Role[];
  orders?: Order[];
}

export function exportAll(): BackupFile {
  return {
    app: "ritm",
    version: 1,
    exportedAt: new Date().toISOString(),
    products: storage.get<Product[]>(STORAGE_KEYS.products, []),
    sales: storage.get<Sale[]>(STORAGE_KEYS.sales, []),
    periods: storage.get<AccountingPeriod[]>(STORAGE_KEYS.periods, []),
    settings: storage.get<AppSettings>(STORAGE_KEYS.settings, DEFAULT_SETTINGS),
    reps: storage.get<Rep[]>(STORAGE_KEYS.reps, []),
    commissionSchemes: storage.get<CommissionScheme[]>(STORAGE_KEYS.commissionSchemes, []),
    commissionAssignments: storage.get<CommissionAssignment[]>(
      STORAGE_KEYS.commissionAssignments,
      [],
    ),
    settlements: storage.get<Settlement[]>(STORAGE_KEYS.settlements, []),
    targets: storage.get<Target[]>(STORAGE_KEYS.targets, []),
    roles: storage.get<Role[]>(STORAGE_KEYS.roles, []),
    orders: storage.get<Order[]>(STORAGE_KEYS.orders, []),
  };
}

export function downloadBackup(): void {
  const blob = new Blob([JSON.stringify(exportAll(), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ritm-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Validate and restore a backup. Throws on an invalid file. */
export function importAll(raw: unknown): void {
  const data = raw as Partial<BackupFile>;
  if (!data || (data.app !== "ritm" && data.app !== "flousi") || !Array.isArray(data.products)) {
    throw new Error("This file is not a valid RITM backup.");
  }
  storage.set(STORAGE_KEYS.products, data.products ?? []);
  storage.set(STORAGE_KEYS.sales, data.sales ?? []);
  storage.set(STORAGE_KEYS.periods, data.periods ?? []);
  storage.set(STORAGE_KEYS.reps, data.reps ?? []);
  storage.set(STORAGE_KEYS.commissionSchemes, data.commissionSchemes ?? []);
  storage.set(STORAGE_KEYS.commissionAssignments, data.commissionAssignments ?? []);
  storage.set(STORAGE_KEYS.settlements, data.settlements ?? []);
  storage.set(STORAGE_KEYS.targets, data.targets ?? []);
  storage.set(STORAGE_KEYS.roles, data.roles ?? []);
  storage.set(STORAGE_KEYS.orders, data.orders ?? []);
  // A restored backup must never carry someone else's session into this device: the
  // store reopens as the owner, which is the only session that cannot lock anyone out.
  storage.remove(STORAGE_KEYS.accessSession);
  if (data.settings) storage.set(STORAGE_KEYS.settings, data.settings);
}

/** Wipe all RITM data (used by "reset" — reseeds on next load). */
export function clearAll(): void {
  storage.remove(STORAGE_KEYS.products);
  storage.remove(STORAGE_KEYS.sales);
  storage.remove(STORAGE_KEYS.periods);
  storage.remove(STORAGE_KEYS.settings);
  storage.remove(STORAGE_KEYS.reps);
  storage.remove(STORAGE_KEYS.commissionSchemes);
  storage.remove(STORAGE_KEYS.commissionAssignments);
  storage.remove(STORAGE_KEYS.settlements);
  storage.remove(STORAGE_KEYS.targets);
  storage.remove(STORAGE_KEYS.roles);
  storage.remove(STORAGE_KEYS.orders);
  storage.remove(STORAGE_KEYS.accessSession);
  storage.remove(STORAGE_KEYS.accessPin);
}
