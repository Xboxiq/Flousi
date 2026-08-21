import type { Target } from "@/domain";
import { settingsRepository, targetRepository } from "./persistence/local-storage/repositories";
import { storage, STORAGE_KEYS } from "./persistence/local-storage/storage";

/**
 * The generation this build expects the store to be at.
 *
 * Bump it when a migration is added, and add the migration to `MIGRATIONS` at the
 * matching index.
 */
const SCHEMA_VERSION = 1;

/**
 * The lifts, in order. Index 0 brings a pre-P2 store to generation 1.
 *
 * Every one must still be SAFE to run twice: a stamp can be lost with a partial
 * write, and a restored backup arrives with whatever stamp it was exported at. The
 * stamp saves the work, it does not license carelessness.
 */
const MIGRATIONS: Array<() => Promise<void>> = [liftLegacyProfitTarget];

/**
 * Brings the store up to `SCHEMA_VERSION`, running only the lifts it has not had.
 *
 * Runs on boot, before anything reads. Previously each lift re-inspected the data on
 * every single boot to decide whether it had already happened; the stamp means a
 * migrated store does one integer read and stops.
 */
export async function runMigrations(): Promise<void> {
  const at = readVersion();
  if (at >= SCHEMA_VERSION) return;

  for (let i = at; i < MIGRATIONS.length; i += 1) {
    await MIGRATIONS[i]();
  }
  storage.set(STORAGE_KEYS.schemaVersion, SCHEMA_VERSION);
}

/**
 * A store with data but no stamp is a PRE-STAMP store and must start at 0 so its
 * lifts run. A genuinely empty store is already current — there is nothing to lift —
 * but it is stamped rather than left blank so the next boot does no work either.
 */
function readVersion(): number {
  const raw = storage.get<number | null>(STORAGE_KEYS.schemaVersion, null);
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  return 0;
}

/** Exported for the test: the generation this build expects. */
export const CURRENT_SCHEMA_VERSION = SCHEMA_VERSION;

/**
 * `AppSettings.monthlyProfitTarget` was the only place a target could live: one
 * number, for the whole account, for every month. P2 gave targets their own store
 * with a scope and a month, and two stores for one concept would mean two answers
 * to «ما هدف هذا الشهر؟» (gate P2/G1).
 *
 * So the old field is lifted into an account-scope standing target and then
 * ZEROED. Zeroing is what makes this idempotent and what makes the target store
 * the single truth: after the lift there is nothing left in settings to disagree
 * with it. The field itself stays on the type so a version-1 backup written
 * before P2 still imports and still gets lifted on the next boot.
 */
async function liftLegacyProfitTarget(): Promise<void> {
  const settings = await settingsRepository.get();
  const legacy = Number(settings.monthlyProfitTarget);
  if (!Number.isFinite(legacy) || legacy <= 0) return;

  const existing = await targetRepository.list({ metric: "netProfit" });
  const alreadyHasAccountStanding = existing.some(
    (t: Target) => !t.repId && !t.productId && !t.month && t.status === "active",
  );

  // A merchant who already set an account target on /targets keeps it: the lift
  // must never overwrite a newer, deliberate decision with an older leftover.
  if (!alreadyHasAccountStanding) {
    await targetRepository.create({
      metric: "netProfit",
      amount: legacy,
      status: "active",
    });
  }
  await settingsRepository.save({ ...settings, monthlyProfitTarget: 0 });
}
