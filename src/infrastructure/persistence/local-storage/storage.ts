/**
 * SSR-safe JSON localStorage helper. All keys are namespaced under "flousi:".
 * This is the low-level primitive the localStorage repositories build on.
 */
const PREFIX = "flousi:";

export const storage = {
  get<T>(key: string, fallback: T): T {
    if (typeof window === "undefined") return fallback;
    try {
      const raw = window.localStorage.getItem(PREFIX + key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  },

  set<T>(key: string, value: T): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      /* quota or serialization error — ignore in local-first mode */
    }
  },

  remove(key: string): void {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(PREFIX + key);
  },
};

export const STORAGE_KEYS = {
  products: "products",
  sales: "sales",
  periods: "periods",
  settings: "settings",
  reps: "reps",
  commissionSchemes: "commission-schemes",
  commissionAssignments: "commission-assignments",
  settlements: "settlements",
  targets: "targets",
  roles: "roles",
  accessSession: "access-session",
  accessPin: "access-pin",
  /**
   * The schema generation this store has been brought up to.
   *
   * Migrations used to be driven by inspecting the data ("does this look already
   * lifted?"), which meant every lift re-read and re-tested the store on every
   * single boot, forever. A stamp makes each one run once
   * (vercel-react-best-practices: `client-localstorage-schema`).
   *
   * The KEYS are deliberately NOT versioned: renaming `flousi:products` to
   * `flousi:products:v3` would orphan every store already in the field, and the
   * rule's purpose — evolving the schema safely — is served by this stamp plus the
   * migration list, without a rename that has to be right on the first try.
   */
  schemaVersion: "schema-version",
} as const;
