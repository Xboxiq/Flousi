import {
  ORDER_STATUS_LABELS,
  orderStatus,
  voidOrderIds,
  type AccountingPeriod,
  type Order,
  type OrderStatus,
  type Product,
  type Rep,
  type Sale,
  type Settlement,
} from "@/domain";
import { profitForSale } from "./analytics";
import { frozenSnapshots, toMajor } from "./commissions";

/* ────────────────────────── «منو دفع» ────────────────────────── */

export interface SettlementRow {
  settlement: Settlement;
  /** The rep's name, or a placeholder when the rep row is gone. */
  repName: string;
  /** True when the rep has been archived — they stay payable and stay in history. */
  repArchived: boolean;
  /** Major units, for display beside every other figure in the app. */
  amount: number;
  currency: string;
  paidAt: string;
  method?: string;
  periodLabel?: string;
}

/** Totals for one currency. Never summed across currencies — the domain has no FX. */
export interface CurrencyTotal {
  currency: string;
  /** Paid out in this currency, major units. */
  paid: number;
  /** Earned by the team in this currency, major units. */
  earned: number;
  /** earned − paid. Positive = still owed. Negative = paid ahead. */
  outstanding: number;
  /** How many payments make up `paid`. */
  count: number;
}

export interface SettlementsView {
  rows: SettlementRow[];
  /**
   * One line per currency the store has actually used, ordered by how much was
   * paid in it. Lines are never added together: `Money.add` throws on a currency
   * mismatch, and one mistyped settlement must not brick the screen.
   */
  totals: CurrencyTotal[];
  /** How many payments exist in total, before any window is applied. */
  count: number;
  /** The most recent payment's timestamp, or undefined for a store with none. */
  lastPaidAt?: string;
}

/**
 * «منو دفع» — every payment the merchant has made, across every rep and every
 * currency, newest first.
 */
export function computeSettlements(input: {
  settlements: readonly Settlement[];
  reps: readonly Rep[];
  sales: readonly Sale[];
  periods: readonly AccountingPeriod[];
  /**
   * The trips those sales rode. A returned or cancelled trip earns nobody a share,
   * so its splits are absent from `earned` while the payments already made against
   * them stay in `paid` — which is exactly the overpayment the merchant needs to
   * see, as a negative `outstanding` (gate P5/G2).
   */
  orders?: readonly Order[];
  /** Restricts to one rep's own payments and their own earned share. */
  scope?: { repId: string } | "none";
}): SettlementsView {
  const { reps, periods, scope } = input;
  const allows = (subject: { repId?: string }) =>
    scope === undefined ? true : scope === "none" ? false : subject.repId === scope.repId;
  const settlements = input.settlements.filter(allows);
  const sales = input.sales.filter(allows);
  const repById = new Map(reps.map((r) => [r.id, r]));
  const periodById = new Map(periods.map((p) => [p.id, p]));

  const rows: SettlementRow[] = settlements
    .slice()
    .sort((a, b) => (b.paidAt ?? "").localeCompare(a.paidAt ?? ""))
    .map((s) => {
      const rep = repById.get(s.repId);
      return {
        settlement: s,
        // A payment whose rep row was deleted still happened, and the money still
        // left the till. It is reported, not hidden behind a missing join.
        repName: rep?.name ?? "مندوب محذوف",
        repArchived: rep?.status === "archived",
        amount: toMajor(s.amountMinor, s.currency),
        currency: s.currency,
        paidAt: s.paidAt,
        method: s.method,
        periodLabel: s.periodId ? periodById.get(s.periodId)?.label : undefined,
      };
    });

  const byCurrency = new Map<string, CurrencyTotal>();
  const line = (currency: string): CurrencyTotal => {
    const found = byCurrency.get(currency);
    if (found) return found;
    const fresh: CurrencyTotal = { currency, paid: 0, earned: 0, outstanding: 0, count: 0 };
    byCurrency.set(currency, fresh);
    return fresh;
  };

  for (const r of rows) {
    const l = line(r.currency);
    l.paid += r.amount;
    l.count += 1;
  }
  for (const snap of frozenSnapshots(sales, voidOrderIds(input.orders ?? []))) {
    const l = line(snap.currency);
    l.earned += toMajor(snap.repShareMinor, snap.currency);
  }
  const totals = [...byCurrency.values()]
    .map((l) => ({ ...l, outstanding: l.earned - l.paid }))
    .sort((a, b) => b.paid - a.paid || a.currency.localeCompare(b.currency));

  return {
    rows,
    totals,
    count: rows.length,
    lastPaidAt: rows[0]?.paidAt,
  };
}

/* ────────────────────────── «شنو صار» ────────────────────────── */

export type MovementKind = "sale" | "settlement" | "periodClose";

/**
 * Which way money moved. Deliberately three values and not a signed number: a
 * sale and a payment are different EVENTS, and summing them into one running
 * balance would invent a figure that means nothing (a sale's profit is not cash
 * in hand, and a settlement is not a cost).
 */
export type MovementDirection = "in" | "out" | "none";

export interface Movement {
  id: string;
  kind: MovementKind;
  direction: MovementDirection;
  /** ISO timestamp the event happened. */
  at: string;
  /** What it was: a product name, a rep's name, a period's label. */
  title: string;
  /** The one line of detail under the title, already built. */
  detail?: string;
  /** The figure, major units. Always positive — direction carries the sign. */
  amount: number;
  currency: string;
  /** A second, quieter figure beside the amount. */
  secondary?: number;
  /**
   * What `secondary` IS, because the two are not interchangeable:
   *
   * * `"profit"` — the sale's net profit. Revenue minus this IS what the merchant
   *   paid, so it is only ever attached for a session that may see costs.
   * * `"repShare"` — the rep's own frozen share of that sale. Theirs to know, and it
   *   reveals nothing about the purchase price on its own.
   */
  secondaryKind?: "profit" | "repShare";
  /**
   * The sale rode a trip that came back or was cancelled. The row stays in the log —
   * it happened, and the merchant paid to ship it — but no figure on it is money he
   * kept, so no total counts it and no colour claims it came in (gate P5/G2).
   */
  voided?: boolean;
  /** The trip's state, when the row belongs to one. Absent for a loose sale. */
  status?: OrderStatus;
  /** Deep link for the row, when the event has a screen of its own. */
  href?: string;
}

export interface LedgerView {
  /** The window the caller asked for, newest first. */
  rows: Movement[];
  /** Everything, before the window — so a screen can say «١٢ من ٨٨». */
  total: number;
  /** Per-kind counts of the FULL log, not of the window. */
  counts: Record<MovementKind, number>;
}

/**
 * «شنو صار» — sales, payments and month closes in one reverse-chronological log.
 *
 * `limit` windows the result the way the rep profile does: P1 shipped 176
 * operations in one 6,716px page and had to be fixed, so this one is bounded from
 * the start (gate P2/G7).
 */
export function computeLedger(input: {
  sales: readonly Sale[];
  settlements: readonly Settlement[];
  periods: readonly AccountingPeriod[];
  products: readonly Product[];
  reps: readonly Rep[];
  /**
   * The trips the sales rode. A sale on a returned or cancelled trip is marked
   * `voided` and painted as no movement rather than as income (gate P5/G2). Omit
   * and every sale reads as delivered, which is what a pre-P4 sale is.
   */
  orders?: readonly Order[];
  currency: string;
  /** How many rows to return. Omit for all of them. */
  limit?: number;
  /** Show only this kind. */
  kind?: MovementKind;
  /**
   * Restricts the log to one rep's own movements: their sales and their payments,
   * and no period closes at all — a month's close is the store's event, not theirs.
   *
   * Applied HERE and not in the view, so a scoped session's counts and totals are
   * that rep's rather than the store's with rows hidden (gate P3/G3).
   */
  scope?: { repId: string } | "none";
  /**
   * Whether this session may see costs. False withholds a sale's NET PROFIT and
   * attaches the rep's own frozen share instead — because revenue minus profit is
   * the purchase price, so printing profit hands the merchant's cost to a rep by
   * subtraction (gate P3/G4). Decided here rather than in the view: a figure the
   * session may not read is not computed into the row at all.
   */
  costs?: boolean;
}): LedgerView {
  const { sales, settlements, periods, products, reps, currency, scope } = input;
  const costs = input.costs ?? true;
  const allows = (subject: { repId?: string }) =>
    scope === undefined ? true : scope === "none" ? false : subject.repId === scope.repId;
  const productById = new Map(products.map((p) => [p.id, p]));
  const repById = new Map(reps.map((r) => [r.id, r]));
  const statusByOrder = new Map(
    (input.orders ?? []).map((o) => [o.id, orderStatus(o)] as const),
  );

  const all: Movement[] = [];

  for (const sale of sales) {
    if (!allows(sale)) continue;
    const product = productById.get(sale.productId);
    const p = profitForSale(sale, product);
    const rep = sale.repId ? repById.get(sale.repId) : undefined;
    const snapshot = sale.commissionSnapshot;
    const share = snapshot ? toMajor(snapshot.repShareMinor, snapshot.currency) : undefined;
    // A loose sale has no trip and therefore no state: it reads as it always did.
    const status = sale.orderId ? statusByOrder.get(sale.orderId) : undefined;
    const voided = status === "returned" || status === "cancelled";
    const who = rep ? ` · ${rep.name}` : "";
    all.push({
      id: `sale:${sale.id}`,
      kind: "sale",
      // A void sale moved no money in. Green on it would be colour spent on a
      // figure that never arrived (§13).
      direction: voided ? "none" : "in",
      at: sale.soldAt,
      title: product?.name ?? "منتج محذوف",
      detail: voided ? `${ORDER_STATUS_LABELS[status]}${who}` : `بيع${who}`,
      amount: p.revenue,
      currency: sale.currency || currency,
      // Nothing was earned and nothing is owed on a void row, so no second figure
      // is attached — an amount with a strike through it says the rest.
      secondary: voided ? undefined : costs ? p.netProfit : share,
      secondaryKind: voided
        ? undefined
        : costs
          ? "profit"
          : share === undefined
            ? undefined
            : "repShare",
      voided: voided || undefined,
      status,
      href: product ? `/products/view?id=${product.id}` : undefined,
    });
  }

  for (const s of settlements) {
    if (!allows(s)) continue;
    const rep = repById.get(s.repId);
    all.push({
      id: `settlement:${s.id}`,
      kind: "settlement",
      direction: "out",
      at: s.paidAt,
      title: rep?.name ?? "مندوب محذوف",
      detail: s.method ? `تسوية · ${s.method}` : "تسوية",
      amount: toMajor(s.amountMinor, s.currency),
      currency: s.currency,
      href: rep ? `/reps/view?id=${rep.id}` : undefined,
    });
  }

  for (const period of periods) {
    // A close belongs to the store, so it is absent from a scoped log rather than
    // shown with a figure the session is not entitled to.
    if (scope !== undefined) break;
    if (period.status !== "closed" || !period.endDate) continue;
    all.push({
      id: `period:${period.id}`,
      kind: "periodClose",
      // A close moves no money: it freezes a reading. Painting it as income or
      // spend would be colour spent on a fact rather than a meaning (§13).
      direction: "none",
      at: period.endDate,
      title: period.label,
      detail: "إغلاق فترة",
      amount: period.summary?.netProfit ?? 0,
      currency,
      href: "/periods",
    });
  }

  const counts: Record<MovementKind, number> = { sale: 0, settlement: 0, periodClose: 0 };
  for (const m of all) counts[m.kind] += 1;

  const filtered = input.kind ? all.filter((m) => m.kind === input.kind) : all;
  const sorted = filtered.sort((a, b) => (b.at ?? "").localeCompare(a.at ?? ""));

  return {
    rows: input.limit ? sorted.slice(0, input.limit) : sorted,
    total: sorted.length,
    counts,
  };
}
