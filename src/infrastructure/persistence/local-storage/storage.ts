/**
 * SSR-safe JSON localStorage helper. All keys are namespaced under "flousi:".
 * This is the low-level primitive the localStorage repositories build on.
 */
const PREFIX = "flousi:";

/**
 * Does the stored value have the same SHAPE as the fallback the caller expects?
 *
 * `JSON.parse(...) as T` was a lie: it told the compiler the value is a `T` while
 * nothing had checked it, and every screen downstream trusted that. A value that
 * parsed but held the wrong shape — `null`, or an object where a list was expected —
 * reached the read models and crashed them with `x.filter is not a function`, which
 * in a local-first app with no server means a BLANK screen on every route, including
 * the one that would let the merchant export or reset. One bad value bricked the app
 * unrecoverably. Found by the P10 corruption sweep.
 *
 * The check is deliberately shallow: shape, not contents. A deep validator here
 * would be a second copy of the domain's own rules, drifting from them silently.
 */
function shapeMatches(value: unknown, fallback: unknown): boolean {
  /* A null/undefined fallback declares NO expectation — `get<number | null>(k, null)`
     is a caller saying "give me whatever is there and I will check it myself". Judging
     such a value against `typeof null` rejected every valid reading, which is how this
     guard first broke the schema-version stamp. */
  if (fallback === null || fallback === undefined) return true;
  if (Array.isArray(fallback)) return Array.isArray(value);
  if (fallback !== null && typeof fallback === "object") {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }
  // A primitive fallback (a version number, a flag): accept the same primitive type.
  return typeof value === typeof fallback;
}

export const storage = {
  get<T>(key: string, fallback: T): T {
    if (typeof window === "undefined") return fallback;
    try {
      const raw = window.localStorage.getItem(PREFIX + key);
      if (!raw) return fallback;
      const parsed: unknown = JSON.parse(raw);
      /* An unusable value reads as ABSENT rather than being handed on. It is left in
         storage untouched: a merchant's only copy of their data is not something this
         function gets to delete on a hunch, and a later version that understands the
         shape can still recover it. */
      return shapeMatches(parsed, fallback) ? (parsed as T) : fallback;
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
  orders: "orders",
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
