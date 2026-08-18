import {
  CommissionCalculator,
  DEFAULT_PROFIT_BASIS,
  Money,
  RepBalanceCalculator,
  needsCommissionScheme,
  schemeParams,
  type CommissionAssignment,
  type CommissionScheme,
  type CommissionSnapshot,
  type Product,
  type Rep,
  type RepBalance,
  type RepStatus,
  type Sale,
  type SchemeTier,
  type Settlement,
} from "@/domain";

/**
 * Everything the commission read models need, loaded by the caller. The domain
 * resolver takes assignments, schemes and the account default as arguments, so
 * nothing here touches a repository, a clock, Intl or storage.
 */
export interface CommissionInput {
  sales: readonly Sale[];
  products: readonly Product[];
  reps: readonly Rep[];
  schemes: readonly CommissionScheme[];
  assignments: readonly CommissionAssignment[];
  settlements: readonly Settlement[];
  /** `AppSettings.defaultCommissionSchemeId` — the last resort of the chain. */
  defaultCommissionSchemeId?: string;
}

export interface CommissionOptions {
  /** The account currency. Scalar totals are scoped to it; see `currencies`. */
  currency?: string;
  /** Injected so every reading is deterministic. */
  now?: Date;
  /** Length of the trailing monthly window. */
  months?: number;
}

/**
 * One sale's commission, as a surface reads it.
 *
 * All figures are INTEGER MINOR UNITS — the same units the snapshot froze, so a
 * team total is an exact integer sum rather than an accumulation of rounded
 * majors. `toMajor` converts for the formatter.
 */
export interface SaleCommission {
  sale: Sale;
  repId: string;
  /**
   * For a frozen row this is the snapshot's own copy — the label must outlive a
   * rename or an archival. For an unfrozen row it is the current rep record.
   */
  repName: string;
  /** true = these figures come from the sale's frozen snapshot, not a live resolve. */
  frozen: boolean;
  /** A rep is credited but nothing could be frozen. Fixable, never fabricated. */
  needsScheme: boolean;
  schemeId?: string;
  schemeName?: string;
  schemeTier: SchemeTier;
  currency: string;
  revenueMinor: number;
  netProfitMinor: number;
  /** The amount that was split, per the scheme's basis. May be negative. */
  basisMinor: number;
  repShareMinor: number;
  ownerShareMinor: number;
  /** netProfit - repShare: what the owner truly pocketed. */
  ownerKeepsMinor: number;
  lossApplied: boolean;
  /** null on a zero basis and on a schemeless row — the surface renders a dash. */
  effectiveRepRatio: number | null;
}

export interface RepAggregate {
  repId: string;
  /** The rep's current name; falls back to a frozen copy if the record is gone. */
  repName: string;
  status: RepStatus;
  /** The currency the scalar figures below are denominated in. */
  currency: string;
  /** Every currency this rep has a sale or a settlement in, sorted. */
  currencies: string[];
  saleCount: number;
  units: number;
  revenueMinor: number;
  netProfitMinor: number;
  /**
   * The total that was actually split. Equals net profit only while every
   * scheme splits `netProfit`; an `afterPurchaseCost` scheme deliberately splits
   * a larger amount and leaves the remaining costs with the owner. This — never
   * net profit — is the whole that the two shares add up to.
   */
  basisMinor: number;
  /** Earnings across the rep's sales — frozen where frozen, live where not. */
  repShareMinor: number;
  ownerShareMinor: number;
  /** netProfit - repShare: what the owner actually pocketed, not what the contract says. */
  ownerKeepsMinor: number;
  /**
   * The payable, per currency, derived from FROZEN splits minus settlements. A
   * live-resolved share is provisional and deliberately excluded: money is owed
   * only once the split is frozen on the sale.
   */
  balance: RepBalance;
  /** The `currency` line of `balance`, for the primary rail. */
  earnedMinor: number;
  settledMinor: number;
  /** earned - settled. Negative = the rep was paid ahead. Never clamped. */
  balanceMinor: number;
  lastSaleAt: string | null;
  /** Rows crediting this rep that still have no frozen split. */
  needsSchemeCount: number;
  /** 1-based position in the ranking, best earner first. */
  rank: number;
}

export interface TeamCommissions {
  currency: string;
  /** Ranked, best earner first. */
  reps: RepAggregate[];
  saleCount: number;
  units: number;
  revenueMinor: number;
  netProfitMinor: number;
  /** The whole the two shares add up to. See `RepAggregate.basisMinor`. */
  basisMinor: number;
  /** The team's total cut. */
  repShareMinor: number;
  ownerShareMinor: number;
  /** netProfit - repShare: what the owner actually pocketed. */
  ownerKeepsMinor: number;
  earnedMinor: number;
  settledMinor: number;
  /** Total still owed to the team in `currency`. Never clamped. */
  outstandingMinor: number;
  needsSchemeCount: number;
  activeRepCount: number;
}

/**
 * Major units for the formatter. Routed through Money so the minor-unit scale
 * stays a single domain fact instead of a `/100` scattered across screens.
 */
export function toMajor(minorUnits: number, currency: string): number {
  return Money.fromMinor(minorUnits, currency).amount;
}

/** Frozen splits only — the one input a balance is ever derived from. */
export function frozenSnapshots(sales: readonly Sale[]): CommissionSnapshot[] {
  const out: CommissionSnapshot[] = [];
  for (const sale of sales) {
    if (sale.commissionSnapshot) out.push(sale.commissionSnapshot);
  }
  return out;
}

interface Lookups {
  productById: Map<string, Product>;
  repById: Map<string, Rep>;
}

function lookups(input: CommissionInput): Lookups {
  return {
    productById: new Map(input.products.map((p) => [p.id, p])),
    repById: new Map(input.reps.map((r) => [r.id, r])),
  };
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * One sale's commission row, or null when the sale has no rep — an absent repId
 * credits nobody, and an explicit zero-share row against a null rep would be an
 * empty ledger line for an event that has nothing to do with any rep.
 *
 * The frozen snapshot is authoritative for history: when one is present it is
 * re-read, never recomputed, so a later scheme edit, scheme deletion or rep
 * archival cannot move a figure the merchant already saw. Only a sale that never
 * got a snapshot is resolved live.
 */
function saleCommissionWith(sale: Sale, input: CommissionInput, at: Lookups): SaleCommission | null {
  if (!sale.repId) return null;

  const snapshot = sale.commissionSnapshot;
  if (snapshot) {
    const r = CommissionCalculator.fromSnapshot(snapshot);
    return {
      sale,
      repId: snapshot.repId,
      repName: snapshot.repName,
      frozen: true,
      needsScheme: false,
      schemeId: snapshot.schemeId,
      schemeName: snapshot.schemeName,
      schemeTier: snapshot.schemeTier,
      currency: snapshot.currency,
      revenueMinor: snapshot.revenueMinor,
      netProfitMinor: snapshot.netProfitMinor,
      basisMinor: snapshot.basisMinor,
      repShareMinor: snapshot.repShareMinor,
      ownerShareMinor: snapshot.ownerShareMinor,
      ownerKeepsMinor: r.ownerKeeps.minorUnits,
      lossApplied: r.lossApplied,
      effectiveRepRatio: r.effectiveRepRatio,
    };
  }

  const rep = at.repById.get(sale.repId);
  const product = at.productById.get(sale.productId);
  const resolution = CommissionCalculator.resolveScheme({
    productId: sale.productId,
    repId: sale.repId,
    assignments: input.assignments,
    schemes: input.schemes,
    accountDefaultSchemeId: input.defaultCommissionSchemeId,
  });
  const base = {
    sale,
    repId: sale.repId,
    repName: rep?.name ?? sale.repId,
    frozen: false,
    needsScheme: needsCommissionScheme(sale),
    currency: sale.currency,
  };

  // A deleted product leaves no cost structure to split, so the row reports
  // zeros rather than a revenue with no cost against it. History is unaffected:
  // a frozen row never reads the product at all.
  if (!product) {
    return {
      ...base,
      schemeId: resolution.scheme?.id,
      schemeName: resolution.scheme?.name,
      schemeTier: resolution.tier,
      revenueMinor: 0,
      netProfitMinor: 0,
      basisMinor: 0,
      repShareMinor: 0,
      ownerShareMinor: 0,
      ownerKeepsMinor: 0,
      lossApplied: false,
      effectiveRepRatio: null,
    };
  }

  // No rule at any tier: the owner provisionally holds the whole net profit and
  // the row surfaces as fixable. Never a fabricated 50/50 — a guessed figure the
  // merchant might act on is worse than an obvious gap.
  if (!resolution.scheme) {
    const b = CommissionCalculator.basis({
      unitPrice: sale.unitPrice,
      quantity: sale.quantity,
      currency: sale.currency,
      costs: product.costs,
      profitBasis: DEFAULT_PROFIT_BASIS,
    });
    return {
      ...base,
      schemeTier: resolution.tier,
      revenueMinor: b.revenue.minorUnits,
      netProfitMinor: b.netProfit.minorUnits,
      basisMinor: b.netProfit.minorUnits,
      repShareMinor: 0,
      ownerShareMinor: b.netProfit.minorUnits,
      ownerKeepsMinor: b.netProfit.minorUnits,
      lossApplied: false,
      // Not 0%: no rule exists yet, so the realised ratio is undefined.
      effectiveRepRatio: null,
    };
  }

  const r = CommissionCalculator.split({
    unitPrice: sale.unitPrice,
    quantity: sale.quantity,
    currency: sale.currency,
    costs: product.costs,
    params: schemeParams(resolution.scheme),
  });
  return {
    ...base,
    schemeId: resolution.scheme.id,
    schemeName: resolution.scheme.name,
    schemeTier: resolution.tier,
    revenueMinor: r.revenue.minorUnits,
    netProfitMinor: r.netProfit.minorUnits,
    basisMinor: r.basis.minorUnits,
    repShareMinor: r.repShare.minorUnits,
    ownerShareMinor: r.ownerShare.minorUnits,
    ownerKeepsMinor: r.ownerKeeps.minorUnits,
    lossApplied: r.lossApplied,
    effectiveRepRatio: r.effectiveRepRatio,
  };
}

/** Single-sale entry point for a detail surface. Returns null when no rep is credited. */
export function resolveSaleCommission(sale: Sale, input: CommissionInput): SaleCommission | null {
  return saleCommissionWith(sale, input, lookups(input));
}

/**
 * Every sale that credits a rep, newest first (a display concern of the ledger;
 * the totals below are order-independent by construction). Sales with no rep are
 * absent entirely.
 */
export function computeSaleCommissions(input: CommissionInput): SaleCommission[] {
  const at = lookups(input);
  const rows: SaleCommission[] = [];
  for (const sale of input.sales) {
    const row = saleCommissionWith(sale, input, at);
    if (row) rows.push(row);
  }
  return rows.sort(
    (a, b) =>
      new Date(b.sale.soldAt).getTime() - new Date(a.sale.soldAt).getTime() ||
      a.sale.id.localeCompare(b.sale.id),
  );
}

/**
 * Per-rep totals plus the derived balance, ranked best earner first.
 *
 * Every rep on record appears, including archived ones and those with no sales:
 * archival is a filter for the surface, never a gate here, because an archived
 * rep stays payable. A repId that appears only in history keeps its own row so
 * money owed can never fall off the screen.
 *
 * Scalar figures are scoped to one currency — summing across currencies would
 * need an FX rate the domain does not hold — while `balance.lines` and
 * `currencies` carry the rest.
 */
export function computeRepAggregates(
  input: CommissionInput,
  options: CommissionOptions = {},
): RepAggregate[] {
  const currency = options.currency ?? input.products[0]?.currency ?? "USD";
  const rows = computeSaleCommissions(input);
  const snapshots = frozenSnapshots(input.sales);
  const repById = new Map(input.reps.map((r) => [r.id, r]));

  const byRep = new Map<string, SaleCommission[]>();
  for (const row of rows) {
    const list = byRep.get(row.repId);
    if (list) list.push(row);
    else byRep.set(row.repId, [row]);
  }

  // Reps on record first, then any id that survives only in history.
  const ids: string[] = input.reps.map((r) => r.id);
  const seen = new Set(ids);
  for (const id of [...byRep.keys(), ...input.settlements.map((s) => s.repId)]) {
    if (!seen.has(id)) {
      seen.add(id);
      ids.push(id);
    }
  }

  const aggregates = ids.map((repId): RepAggregate => {
    const repRows = byRep.get(repId) ?? [];
    const rep = repById.get(repId);
    const balance = RepBalanceCalculator.forRep(repId, snapshots, input.settlements);
    const line = balance.lines.find((l) => l.currency === currency);

    const currencies = new Set<string>();
    let saleCount = 0;
    let units = 0;
    let revenueMinor = 0;
    let netProfitMinor = 0;
    let basisMinor = 0;
    let repShareMinor = 0;
    let ownerShareMinor = 0;
    let ownerKeepsMinor = 0;
    let needsSchemeCount = 0;
    let lastSaleAt: string | null = null;
    let lastSaleTime = Number.NEGATIVE_INFINITY;

    for (const row of repRows) {
      currencies.add(row.currency);
      if (row.needsScheme) needsSchemeCount += 1;
      const time = new Date(row.sale.soldAt).getTime();
      if (Number.isFinite(time) && time > lastSaleTime) {
        lastSaleTime = time;
        lastSaleAt = row.sale.soldAt;
      }
      if (row.currency !== currency) continue;
      saleCount += 1;
      units += row.sale.quantity;
      revenueMinor += row.revenueMinor;
      netProfitMinor += row.netProfitMinor;
      basisMinor += row.basisMinor;
      repShareMinor += row.repShareMinor;
      ownerShareMinor += row.ownerShareMinor;
      ownerKeepsMinor += row.ownerKeepsMinor;
    }
    for (const settlement of input.settlements) {
      if (settlement.repId === repId) currencies.add(settlement.currency);
    }

    return {
      repId,
      repName: rep?.name ?? repRows[0]?.repName ?? repId,
      // An id with no record left reads as archived: still payable and still
      // listed, but never offered as a target for a new sale.
      status: rep?.status ?? "archived",
      currency,
      currencies: [...currencies].sort((a, b) => a.localeCompare(b)),
      saleCount,
      units,
      revenueMinor,
      netProfitMinor,
      basisMinor,
      repShareMinor,
      ownerShareMinor,
      ownerKeepsMinor,
      balance,
      earnedMinor: line?.earnedMinor ?? 0,
      settledMinor: line?.settledMinor ?? 0,
      balanceMinor: line?.balanceMinor ?? 0,
      lastSaleAt,
      needsSchemeCount,
      rank: 0,
    };
  });

  // Best earner first; repId breaks ties so the order never depends on input order.
  aggregates.sort((a, b) => b.repShareMinor - a.repShareMinor || a.repId.localeCompare(b.repId));
  aggregates.forEach((aggregate, i) => {
    aggregate.rank = i + 1;
  });
  return aggregates;
}

/** Team totals over the ranked reps. Integer sums, so the parts are the whole. */
export function computeTeamCommissions(
  input: CommissionInput,
  options: CommissionOptions = {},
): TeamCommissions {
  const currency = options.currency ?? input.products[0]?.currency ?? "USD";
  const reps = computeRepAggregates(input, { ...options, currency });

  const total = {
    saleCount: 0,
    units: 0,
    revenueMinor: 0,
    netProfitMinor: 0,
    basisMinor: 0,
    repShareMinor: 0,
    ownerShareMinor: 0,
    ownerKeepsMinor: 0,
    earnedMinor: 0,
    settledMinor: 0,
    outstandingMinor: 0,
    needsSchemeCount: 0,
    activeRepCount: 0,
  };
  for (const rep of reps) {
    total.saleCount += rep.saleCount;
    total.units += rep.units;
    total.revenueMinor += rep.revenueMinor;
    total.netProfitMinor += rep.netProfitMinor;
    total.basisMinor += rep.basisMinor;
    total.repShareMinor += rep.repShareMinor;
    total.ownerShareMinor += rep.ownerShareMinor;
    total.ownerKeepsMinor += rep.ownerKeepsMinor;
    total.earnedMinor += rep.earnedMinor;
    total.settledMinor += rep.settledMinor;
    total.outstandingMinor += rep.balanceMinor;
    total.needsSchemeCount += rep.needsSchemeCount;
    if (rep.status === "active") total.activeRepCount += 1;
  }

  return { currency, reps, ...total };
}

/**
 * Per-rep trailing monthly rep-share series — the sparkline on each rep row.
 * Months with no sales stay 0 so every rep spans the same window and the
 * sparklines are comparable across rows. Oldest first, integer minor units.
 */
export function computeRepTrends(
  input: CommissionInput,
  options: CommissionOptions = {},
): Map<string, number[]> {
  const months = options.months ?? 6;
  const now = options.now ?? new Date();
  const currency = options.currency ?? input.products[0]?.currency ?? "USD";

  // Month-key → index into each rep's series.
  const slot = new Map<string, number>();
  for (let i = months - 1; i >= 0; i--) {
    slot.set(monthKey(new Date(now.getFullYear(), now.getMonth() - i, 1)), months - 1 - i);
  }

  const series = new Map<string, number[]>(
    input.reps.map((r) => [r.id, new Array<number>(months).fill(0)]),
  );
  for (const row of computeSaleCommissions(input)) {
    if (row.currency !== currency) continue;
    const idx = slot.get(monthKey(new Date(row.sale.soldAt)));
    if (idx === undefined) continue;
    let track = series.get(row.repId);
    if (!track) {
      // A rep that survives only in history still gets a track.
      track = new Array<number>(months).fill(0);
      series.set(row.repId, track);
    }
    track[idx] += row.repShareMinor;
  }
  return series;
}

/**
 * Month-over-month change in a rep's monthly share series — the series
 * `computeRepTrends` produces, oldest first.
 *
 * A DISPLAY ratio, not money: nothing here is stored, owed or paid out, which is
 * why it returns a bare number rather than a `Money`. It lives beside the series
 * it reads so it can be tested, instead of inside a render path.
 *
 * `null` means there is no comparison to state: a window shorter than two months
 * has no previous month, and a previous month of exactly zero has no magnitude to
 * divide by — "up from nothing" is not a percentage.
 */
export function repMomentum(series: readonly number[]): number | null {
  if (series.length < 2) return null;
  const current = series[series.length - 1];
  const previous = series[series.length - 2];
  if (previous === 0) return null;
  return (current - previous) / Math.abs(previous);
}
