/**
 * SSR-safe JSON localStorage helper. All keys are namespaced under "ritm:".
 * This is the low-level primitive the localStorage repositories build on.
 */
const PREFIX = "ritm:";

/**
 * The namespace this app wrote under before it was renamed to رِتم.
 *
 * A rename is a cosmetic act everywhere except here: this app has no server, so a
 * merchant's ONLY copy of their data is these keys. Changing the prefix without a
 * lift would not corrupt anything, it would do something worse and quieter — every
 * screen would come up empty and correct-looking, as though the shop had never
 * traded. `migrateLegacyNamespace` below copies the old keys forward and leaves the
 * originals exactly where they are.
 */
export const LEGACY_PREFIX = "flousi:";

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

/**
 * Copies every key written under the old namespace to the new one, once.
 *
 * Copy, never move: the originals stay untouched, so a merchant who opens an older
 * build of the app after this one still finds their data, and a partial run of this
 * function can never be the reason a shop's history disappears. Keys already present
 * under the new prefix win, because they are by definition newer.
 *
 * Runs before anything reads. Safe to run any number of times.
 */
export function migrateLegacyNamespace(): number {
  if (typeof window === "undefined") return 0;
  let copied = 0;
  try {
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (!key || !key.startsWith(LEGACY_PREFIX)) continue;
      const target = PREFIX + key.slice(LEGACY_PREFIX.length);
      if (window.localStorage.getItem(target) !== null) continue;
      const value = window.localStorage.getItem(key);
      if (value !== null) {
        window.localStorage.setItem(target, value);
        copied += 1;
      }
    }
  } catch {
    /* A storage that throws (private mode, quota) leaves the old keys in place and
       the app starts empty rather than failing to boot. */
  }
  return copied;
}

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
   * The KEYS are deliberately NOT versioned: renaming `ritm:products` to
   * `ritm:products:v3` would orphan every store already in the field, and the
   * rule's purpose — evolving the schema safely — is served by this stamp plus the
   * migration list, without a rename that has to be right on the first try.
   */
  schemaVersion: "schema-version",
} as const;
