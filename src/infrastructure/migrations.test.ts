import { beforeEach, describe, expect, it } from "vitest";
import { runMigrations, CURRENT_SCHEMA_VERSION } from "./migrations";
import {
  settingsRepository,
  targetRepository,
  DEFAULT_SETTINGS,
} from "./persistence/local-storage/repositories";
import { storage, STORAGE_KEYS } from "./persistence/local-storage/storage";

describe("runMigrations — lift of the legacy profit target (gate P2/G1)", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("lifts a set legacy target into an account standing target and zeroes the old field", async () => {
    await settingsRepository.save({ ...DEFAULT_SETTINGS, monthlyProfitTarget: 2_500_000 });
    await runMigrations();

    const targets = await targetRepository.list();
    expect(targets).toHaveLength(1);
    expect(targets[0]).toMatchObject({
      metric: "netProfit",
      amount: 2_500_000,
      status: "active",
    });
    // account scope + standing: no ids and no month
    expect(targets[0].repId).toBeUndefined();
    expect(targets[0].productId).toBeUndefined();
    expect(targets[0].month).toBeUndefined();

    // and the old field is emptied, so there is exactly ONE truth afterwards
    expect((await settingsRepository.get()).monthlyProfitTarget).toBe(0);
  });

  it("is idempotent: running it twice does not create a second target", async () => {
    await settingsRepository.save({ ...DEFAULT_SETTINGS, monthlyProfitTarget: 2_500_000 });
    await runMigrations();
    await runMigrations();
    await runMigrations();
    expect(await targetRepository.list()).toHaveLength(1);
  });

  it("does nothing when the legacy target was never set", async () => {
    await settingsRepository.save({ ...DEFAULT_SETTINGS, monthlyProfitTarget: 0 });
    await runMigrations();
    expect(await targetRepository.list()).toHaveLength(0);
  });

  it("does nothing when the stored legacy value is not a usable number", async () => {
    await settingsRepository.save({
      ...DEFAULT_SETTINGS,
      monthlyProfitTarget: Number.NaN as unknown as number,
    });
    await runMigrations();
    expect(await targetRepository.list()).toHaveLength(0);
  });

  it("never overwrites an account target the merchant already set on /targets", async () => {
    await targetRepository.create({ metric: "netProfit", amount: 9_000_000, status: "active" });
    await settingsRepository.save({ ...DEFAULT_SETTINGS, monthlyProfitTarget: 2_500_000 });
    await runMigrations();

    const targets = await targetRepository.list();
    expect(targets).toHaveLength(1);
    expect(targets[0].amount).toBe(9_000_000);
    // the stale field is still cleared, so it cannot resurface later
    expect((await settingsRepository.get()).monthlyProfitTarget).toBe(0);
  });

  it("a rep target does not count as the account's, so the lift still runs", async () => {
    await targetRepository.create({
      metric: "netProfit",
      amount: 500,
      repId: "R1",
      status: "active",
    });
    await settingsRepository.save({ ...DEFAULT_SETTINGS, monthlyProfitTarget: 2_500_000 });
    await runMigrations();

    const targets = await targetRepository.list();
    expect(targets).toHaveLength(2);
    expect(targets.some((t) => !t.repId && t.amount === 2_500_000)).toBe(true);
  });

  it("an archived account target does not block the lift", async () => {
    await targetRepository.create({ metric: "netProfit", amount: 1, status: "archived" });
    await settingsRepository.save({ ...DEFAULT_SETTINGS, monthlyProfitTarget: 2_500_000 });
    await runMigrations();
    expect((await targetRepository.list()).filter((t) => t.status === "active")).toHaveLength(1);
  });

  it("a revenue target does not satisfy the netProfit lift", async () => {
    await targetRepository.create({ metric: "revenue", amount: 100, status: "active" });
    await settingsRepository.save({ ...DEFAULT_SETTINGS, monthlyProfitTarget: 2_500_000 });
    await runMigrations();
    const targets = await targetRepository.list();
    expect(targets).toHaveLength(2);
    expect(targets.some((t) => t.metric === "netProfit" && t.amount === 2_500_000)).toBe(true);
  });
});

describe("schema version stamp (vercel: client-localstorage-schema)", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("a store with no stamp is treated as pre-stamp, so its lifts DO run", async () => {
    await settingsRepository.save({ ...DEFAULT_SETTINGS, monthlyProfitTarget: 700 });
    expect(storage.get<number | null>(STORAGE_KEYS.schemaVersion, null)).toBeNull();
    await runMigrations();
    expect(await targetRepository.list()).toHaveLength(1);
    expect(storage.get<number | null>(STORAGE_KEYS.schemaVersion, null)).toBe(
      CURRENT_SCHEMA_VERSION,
    );
  });

  it("an already-stamped store does no work, even with a legacy value sitting there", async () => {
    storage.set(STORAGE_KEYS.schemaVersion, CURRENT_SCHEMA_VERSION);
    // A value the lift WOULD have taken, left behind deliberately: the stamp says
    // this store has been through that lift already, so it must be left alone.
    await settingsRepository.save({ ...DEFAULT_SETTINGS, monthlyProfitTarget: 700 });
    await runMigrations();
    expect(await targetRepository.list()).toHaveLength(0);
    expect((await settingsRepository.get()).monthlyProfitTarget).toBe(700);
  });

  it("a fresh empty store is stamped, so the next boot does no work either", async () => {
    await runMigrations();
    expect(storage.get<number | null>(STORAGE_KEYS.schemaVersion, null)).toBe(
      CURRENT_SCHEMA_VERSION,
    );
    expect(await targetRepository.list()).toHaveLength(0);
  });

  it("a junk stamp is treated as pre-stamp rather than trusted", async () => {
    storage.set(STORAGE_KEYS.schemaVersion, "v2" as unknown as number);
    await settingsRepository.save({ ...DEFAULT_SETTINGS, monthlyProfitTarget: 700 });
    await runMigrations();
    expect(await targetRepository.list()).toHaveLength(1);
    expect(storage.get<number | null>(STORAGE_KEYS.schemaVersion, null)).toBe(
      CURRENT_SCHEMA_VERSION,
    );
  });

  it("a stamp from a FUTURE build is left alone — a newer app already migrated it", async () => {
    storage.set(STORAGE_KEYS.schemaVersion, CURRENT_SCHEMA_VERSION + 5);
    await settingsRepository.save({ ...DEFAULT_SETTINGS, monthlyProfitTarget: 700 });
    await runMigrations();
    expect(await targetRepository.list()).toHaveLength(0);
    expect(storage.get<number | null>(STORAGE_KEYS.schemaVersion, null)).toBe(
      CURRENT_SCHEMA_VERSION + 5,
    );
  });

  it("the lifts stay individually idempotent — the stamp saves work, it is not a licence", async () => {
    await settingsRepository.save({ ...DEFAULT_SETTINGS, monthlyProfitTarget: 700 });
    await runMigrations();
    // simulate a lost stamp (a partial write, a restored backup)
    storage.remove(STORAGE_KEYS.schemaVersion);
    await runMigrations();
    expect(await targetRepository.list()).toHaveLength(1);
  });
});
