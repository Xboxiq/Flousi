import {
  TARGET_SCOPE_RANK,
  targetScope,
  type Target,
  type TargetMetric,
  type TargetScope,
} from "../entities/target";

export interface TargetQuery {
  metric: TargetMetric;
  /** `yyyy-mm` being read. */
  month: string;
  repId?: string;
  productId?: string;
}

export interface TargetResolution {
  target: Target | null;
  /** Which rung answered, for a surface that wants to say «موروث من الحساب». */
  scope: TargetScope | null;
  /** True when a month-specific override answered rather than a standing row. */
  fromOverride: boolean;
}

export interface TargetProgress {
  /** False when nothing is set, or when what is set is zero. */
  hasTarget: boolean;
  /** The level, major units. 0 when `hasTarget` is false. */
  targetAmount: number;
  actual: number;
  /** actual / target, clamped at nothing — 1.4 means 140%. 0 with no target. */
  attainment: number;
  /** What is still missing. Never negative. */
  remaining: number;
  /** Anything past the target. Never negative. */
  surplus: number;
  met: boolean;
  /** Share of the month already elapsed, 0..1. */
  elapsed: number;
  /**
   * Attainment measured against elapsed time: 1 = exactly on pace. A month at
   * 45% of target on its 18th day is not "45% good", it is BEHIND, and that is
   * the reading a merchant needs before the month ends (gate P2/G4).
   */
  pace: number;
  onPace: boolean;
}

/** Number of days in a `yyyy-mm`, without constructing a local-time Date. */
function daysInMonth(month: string): number {
  const [y, m] = month.split("-").map(Number);
  if (!y || !m) return 30;
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/**
 * Targets: resolution and attainment.
 *
 * Framework-free and clock-free — `asOf` is always passed in, never read from
 * `Date.now()`, so a pace reading is reproducible in a test and identical on
 * every surface that asks for it.
 */
export const TargetCalculator = {
  /**
   * Most specific wins: month+scope → scope standing → month+account → account
   * standing. Within one rung the most recently updated row wins, and the id
   * breaks a tie so the answer never depends on storage order.
   */
  resolve(targets: Target[], q: TargetQuery): TargetResolution {
    const candidates = targets.filter((t) => {
      if (t.status !== "active") return false;
      if (t.metric !== q.metric) return false;
      if (t.month && t.month !== q.month) return false;
      const scope = targetScope(t);
      if (scope === "rep") return !!q.repId && t.repId === q.repId;
      if (scope === "product") return !!q.productId && t.productId === q.productId;
      return true;
    });
    if (candidates.length === 0) return { target: null, scope: null, fromOverride: false };

    const best = candidates.slice().sort((a, b) => {
      // A month override outranks a standing row at the same scope.
      const byMonth = Number(!!b.month) - Number(!!a.month);
      if (byMonth !== 0) return byMonth;
      const byScope = TARGET_SCOPE_RANK[targetScope(b)] - TARGET_SCOPE_RANK[targetScope(a)];
      if (byScope !== 0) return byScope;
      // Defensive: storage written by an older build may be missing timestamps,
      // and `undefined.localeCompare` would throw in exactly the duplicate case
      // this comparator exists to settle (the P1 lesson, kept).
      const byTime = (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "");
      if (byTime !== 0) return byTime;
      return (a.id ?? "").localeCompare(b.id ?? "");
    })[0];

    return {
      target: best,
      scope: targetScope(best),
      fromOverride: !!best.month,
    };
  },

  /**
   * Attainment for one reading.
   *
   * `asOf` is an ISO timestamp. When it falls outside `month` the month counts as
   * fully elapsed if it is in the past and not at all if it is in the future, so
   * a closed month reads as a final result rather than as one still in progress.
   */
  progress(input: {
    target: Target | null;
    actual: number;
    month: string;
    asOf: string;
  }): TargetProgress {
    const { target, month, asOf } = input;
    const actual = Number.isFinite(input.actual) ? input.actual : 0;
    const amount = Number(target?.amount);
    const targetAmount = Number.isFinite(amount) && amount > 0 ? amount : 0;
    const hasTarget = targetAmount > 0;

    const asOfMonth = asOf.slice(0, 7);
    let elapsed: number;
    if (asOfMonth < month) elapsed = 0;
    else if (asOfMonth > month) elapsed = 1;
    else {
      const day = Number(asOf.slice(8, 10)) || 1;
      elapsed = Math.min(1, Math.max(0, day / daysInMonth(month)));
    }

    const attainment = hasTarget ? actual / targetAmount : 0;
    const remaining = hasTarget ? Math.max(0, targetAmount - actual) : 0;
    const surplus = hasTarget ? Math.max(0, actual - targetAmount) : 0;
    // Pace against an elapsed share of zero is not infinity — before the month
    // starts nothing is behind, so it reads as exactly on pace.
    const pace = hasTarget && elapsed > 0 ? attainment / elapsed : hasTarget ? 1 : 0;

    return {
      hasTarget,
      targetAmount,
      actual,
      attainment,
      remaining,
      surplus,
      met: hasTarget && actual >= targetAmount,
      elapsed,
      pace,
      onPace: !hasTarget || pace >= 1,
    };
  },
};
