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
} as const;
