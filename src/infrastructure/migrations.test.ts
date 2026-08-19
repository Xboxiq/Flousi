import { beforeEach, describe, expect, it } from "vitest";
import { runMigrations } from "./migrations";
import {
  settingsRepository,
  targetRepository,
  DEFAULT_SETTINGS,
} from "./persistence/local-storage/repositories";

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
