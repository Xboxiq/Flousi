import type { Target } from "@/domain";
import { settingsRepository, targetRepository } from "./persistence/local-storage/repositories";

/**
 * One-time, idempotent data lifts.
 *
 * Run on every boot, before the store loads. Each one must be safe to run on an
 * already-migrated store, on a fresh store, and on a store restored from an old
 * backup — those are the same code path here, not three.
 */
export async function runMigrations(): Promise<void> {
  await liftLegacyProfitTarget();
}

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
