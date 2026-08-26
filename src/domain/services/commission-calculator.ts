import { Money } from "../value-objects/money";
import { COST_LINES, type CostBreakdown } from "../entities/cost-breakdown";
import { ProfitCalculator } from "./profit-calculator";
import {
  DEFAULT_REP_RATIO,
  schemeParams,
  type CommissionScheme,
  type CommissionSchemeParams,
  type ProfitBasis,
  type RoundingBeneficiary,
} from "../entities/commission-scheme";
import { assignmentTier, type CommissionAssignment, type SchemeTier } from "../entities/commission-assignment";
import { lossPolicyApplied, type CommissionSnapshot } from "../entities/commission-snapshot";
import type { Rep } from "../entities/rep";
import type { Sale } from "../entities/sale";
import type { CurrencyBalance, RepBalance, Settlement } from "../entities/settlement";

export interface CommissionBasisInput {
  /** The SALE's actual unit price, major units. Never the product's list price. */
  unitPrice: number;
  /** Units on the line; normalised exactly as ProfitCalculator does. */
  quantity: number;
  currency: string;
  costs: CostBreakdown;
  profitBasis: ProfitBasis;
  /**
   * The line's allocated share of an order discount, major units, already clamped by
   * `allocateDiscount`. Subtracted from REVENUE only — the cost components keep
   * being computed on the actual unit price, because a marketplace fee of 8% is
   * charged on what was invoiced, not on what the merchant wished he had invoiced.
   *
   * Whether it applies at all is the SPLIT's decision (`discountTreatment`, gate
   * P6/G3); `basis` itself always honours what it is handed.
   */
  discount?: number;
}

export interface CommissionBasisResult {
  currency: string;
  quantity: number;
  revenue: Money;
  totalCost: Money;
  netProfit: Money;
  /** The amount actually being split, per `profitBasis`. May be negative. */
  basis: Money;
}

export interface CommissionSplitInput extends Omit<CommissionBasisInput, "profitBasis"> {
  /** Carries `profitBasis`, so the basis and the split can never disagree. */
  params: CommissionSchemeParams;
}

export interface CommissionSplitResult extends CommissionBasisResult {
  repShare: Money;
  ownerShare: Money;
  /** netProfit - repShare: what the owner truly keeps once non-basis costs are paid. */
  ownerKeeps: Money;
  /** true only when lossPolicy "ownerOnly" zeroed the rep on a NEGATIVE basis. */
  lossApplied: boolean;
  /**
   * true when a non-proportional fee (fixedPerUnit / percentOfPrice) was cut down
   * to the basis it is paid out of, under "ownerOnly". The surface says so: the
   * rep is owed less than the rule promises, and that is a fact about this sale
   * the merchant should see rather than discover in a balance.
   */
  feeCapped: boolean;
  /** repShare/basis. null when the basis is 0 — the surface renders a dash, never 0%/NaN%. */
  effectiveRepRatio: number | null;
}

/**
 * What `fromSnapshot` can honestly reconstruct. Quantity is not frozen in the
 * snapshot (the Sale holds it), and inventing a 0 there would be a lie a caller
 * could multiply by.
 */
export type CommissionSplitReadback = Omit<CommissionSplitResult, "quantity">;

export interface SchemeResolutionInput {
  productId: string;
  /** Absent = the owner sold it directly. Resolution then returns tier "none". */
  repId?: string;
  assignments: readonly CommissionAssignment[];
  /** All schemes, archived included — the resolver decides what is eligible. */
  schemes: readonly CommissionScheme[];
  accountDefaultSchemeId?: string;
}

export interface SchemeResolution {
  scheme: CommissionScheme | null;
  tier: SchemeTier;
  /** Present only for tiers productRep | product | rep. */
  assignmentId?: string;
}

export interface CommissionSnapshotInput {
  sale: Pick<Sale, "unitPrice" | "quantity" | "currency" | "repId" | "discount">;
  costs: CostBreakdown;
  /** The credited rep, for the name copy. null when the sale has no rep. */
  rep: Pick<Rep, "id" | "name"> | null;
  resolution: SchemeResolution;
  /** ISO timestamp from the Clock port — the domain never reads a clock. */
  calculatedAt: string;
}

/** Ratios are held as integer basis points so no float ever touches a share. */
const BP_SCALE = 10_000;

/**
 * Positive zero, always. `Math.round(-0)`, `Math.trunc(-0)` and `(-500 * 0)` all
 * yield -0, which survives Money, slips past `Money.equals`, fails vitest's
 * `toBe(0)` and renders as "−0.00" — telling a rep they owe a loss they do not.
 */
const norm0 = (n: number): number => (n === 0 ? 0 : n);

/**
 * Currencies with no sub-unit in circulation. Money stores every currency on a
 * x100 minor scale, but a rep in Baghdad is paid in whole dinars — nobody hands
 * over 0.4 IQD, and the app formats these with zero decimals, so a share of
 * «2,009,881.4» is both unpayable and invisible. Kept in the DOMAIN because it is
 * a fact about money, not about formatting.
 */
const ZERO_DECIMAL_CURRENCIES = new Set(["IQD", "JPY", "KRW", "VND", "CLP", "ISK"]);

/** The smallest amount that can actually change hands, in minor units. */
export function payableStepMinor(currency: string): number {
  return ZERO_DECIMAL_CURRENCIES.has(currency.toUpperCase()) ? 100 : 1;
}

/**
 * Snap a share down (or up, for the rep) to the currency's payable step, so the
 * side being PAID always receives an amount that exists. The other side takes the
 * residual, exactly as `roundingBeneficiary` already governs the single-minor-unit
 * crumb — this is the same rule at the currency's real granularity.
 */
function quantiseToPayable(
  minor: number,
  currency: string,
  beneficiary: "owner" | "rep",
): number {
  const step = payableStepMinor(currency);
  if (step === 1) return minor;
  // Toward zero for the owner-favouring default, away from zero for the rep, so
  // the beneficiary of the crumb is the beneficiary of the rounding at every scale.
  const q = beneficiary === "rep" ? Math.ceil(minor / step) : Math.trunc(minor / step);
  return q * step;
}

/** A configured fee, in payable minor units. A corrupt (non-finite) fee is 0. */
const toMinorFee = (minor: number | undefined): number => {
  const safe = Number(minor);
  return Number.isFinite(safe) ? Math.max(0, Math.round(safe)) : 0;
};

/** Clamped integer basis points. A corrupt (non-finite) ratio is 0, never NaN. */
const toBp = (ratio: number): number => {
  const safe = Number.isFinite(ratio) ? ratio : 0;
  return Math.min(BP_SCALE, Math.max(0, Math.round(safe * BP_SCALE)));
};

/**
 * The commission engine. Pure, framework-free, integer minor units throughout.
 *
 * The application layer loads the data and passes it in: no repository access,
 * no clock read, no Intl, no storage. Every method is total — an unresolvable
 * scheme, an archived rep, a zero price or a corrupt ratio all produce a defined
 * result, because one bad settings row must never block recording a real sale.
 */
export class CommissionCalculator {
  /** Ratios are held as integer basis points. 10_000 = 100%. */
  static readonly RATIO_SCALE = BP_SCALE;

  /**
   * Revenue / totalCost / netProfit / basis.
   *
   * Reuses ProfitCalculator's exact expression order — cost components rounded
   * per unit against the SALE's unit price, then multiplied by quantity — so the
   * profit on the product card and the profit being split can never differ by a
   * fils. A percentage line therefore rounds once per unit
   * (round(1999 x 0.33) = 660), not once against line revenue
   * (round(5997 x 0.33) = 1979).
   */
  static basis(input: CommissionBasisInput): CommissionBasisResult {
    const currency = input.currency;
    const quantity = input.quantity && input.quantity > 0 ? input.quantity : 1;
    const unitPrice = Money.fromMajor(input.unitPrice, currency);

    let unitCost = Money.zero(currency);
    for (const line of COST_LINES) {
      unitCost = unitCost.add(ProfitCalculator.componentCost(input.costs[line], unitPrice));
    }
    const unitPurchase = ProfitCalculator.componentCost(input.costs.purchase, unitPrice);

    const discount = Money.fromMajor(
      Number.isFinite(input.discount) ? Math.max(0, input.discount as number) : 0,
      currency,
    );
    const revenue = unitPrice.multiply(quantity).subtract(discount);
    const totalCost = unitCost.multiply(quantity);
    const netProfit = revenue.subtract(totalCost);
    const basis =
      input.profitBasis === "netProfit"
        ? netProfit
        : revenue.subtract(unitPurchase.multiply(quantity));

    // Every figure here is rendered somewhere, so every figure is normalised —
    // not just the shares. A -0 basis prints as «-0» and tells a merchant they
    // lost something they did not (see norm0).
    return {
      currency,
      quantity,
      revenue: Money.fromMinor(norm0(revenue.minorUnits), currency),
      totalCost: Money.fromMinor(norm0(totalCost.minorUnits), currency),
      netProfit: Money.fromMinor(norm0(netProfit.minorUnits), currency),
      basis: Money.fromMinor(norm0(basis.minorUnits), currency),
    };
  }

  /**
   * The whole engine: basis, kind, lossPolicy, rounding, derived reads.
   *
   * Exactly ONE share is ever computed; the other is a single subtraction. That
   * is what makes `repShare + ownerShare === basis` an exact integer identity
   * instead of something that usually holds.
   */
  static split(input: CommissionSplitInput): CommissionSplitResult {
    const p = input.params;
    const b = CommissionCalculator.basis({
      unitPrice: input.unitPrice,
      quantity: input.quantity,
      currency: input.currency,
      costs: input.costs,
      profitBasis: p.profitBasis,
      // The scheme's own choice (the client's: «خيار لكل طريقة عمولة»). The default,
      // afterDiscount, makes the rep share the cost of the discount he granted —
      // which is what stops a rep discounting freely. beforeDiscount leaves the
      // basis whole and the merchant carries the offer alone (gate P6/G3).
      discount: p.discountTreatment === "beforeDiscount" ? 0 : input.discount,
    });

    const basisMinor = b.basis.minorUnits;
    const rawRepMinor = CommissionCalculator.rawRepShareMinor(input, b);

    // Gated on the sign of the CHOSEN basis, never on net profit: choosing
    // `afterPurchaseCost` IS the decision that non-purchase costs are the
    // owner's risk alone. A break-even 0 is neither profit nor loss, so the test
    // is `< 0` and never `!isPositive()`.
    const lossApplied = basisMinor < 0 && p.lossPolicy === "ownerOnly";
    // «ownerOnly» means the rep does not participate in the downside — so it also
    // means a commission can never CREATE one. Without this cap a flat fee of 5
    // on a basis of 0 paid the rep 5 and put the owner at -5, while one fils of
    // loss paid the rep nothing: the owner was 4.99 better off selling worse. The
    // fee is therefore capped at the basis it is paid out of; «shared» keeps the
    // uncapped figure, because there the rep genuinely carries the downside.
    // Snapped to what can actually be handed over in this currency before any cap
    // or policy runs, so every downstream figure — the balance, the settlement
    // default, the receipt — is an amount that exists.
    const payableMinor = quantiseToPayable(rawRepMinor, b.currency, p.roundingBeneficiary);
    const entitledMinor = lossApplied ? 0 : payableMinor;
    const cappedMinor =
      p.lossPolicy === "ownerOnly" && p.kind !== "profitShare"
        ? Math.min(entitledMinor, Math.max(0, basisMinor))
        : entitledMinor;
    const feeCapped = cappedMinor !== entitledMinor;
    const repShareMinor = norm0(cappedMinor);
    const ownerShareMinor = norm0(basisMinor - repShareMinor);

    return {
      ...b,
      repShare: Money.fromMinor(repShareMinor, b.currency),
      ownerShare: Money.fromMinor(ownerShareMinor, b.currency),
      ownerKeeps: Money.fromMinor(norm0(b.netProfit.minorUnits - repShareMinor), b.currency),
      lossApplied,
      feeCapped,
      effectiveRepRatio: CommissionCalculator.effectiveRepRatio(basisMinor, repShareMinor),
    };
  }

  /**
   * The rep's raw entitlement before lossPolicy, per kind.
   *
   * A missing `repRatio` falls back to the locked house default of 0.5, while a
   * missing `fixedAmountMinor` or `priceRatio` falls back to 0. The asymmetry is
   * deliberate: 50% is the documented default so silently underpaying a person
   * is the worse error, whereas a fee nobody configured is not owed. A corrupt
   * `kind` lands on profitShare for the same reason.
   */
  private static rawRepShareMinor(
    input: CommissionSplitInput,
    b: CommissionBasisResult,
  ): number {
    const p = input.params;
    const beneficiary = p.roundingBeneficiary;
    switch (p.kind) {
      case "fixedPerUnit":
        // Already normalised at creation; clamped defensively. Per unit, then x quantity.
        // `Math.max(0, x)` is NOT a guard against corrupt storage: Math.max(0, NaN)
        // is NaN and Math.max(0, Infinity) is Infinity, and Money.fromMinor (unlike
        // fromMajor and multiply) has no finiteness check of its own — so a
        // hand-edited backup could freeze an unreconcilable snapshot forever. A fee
        // nobody can express is a fee nobody is owed, the same rule `toBp` applies.
        return Money.fromMinor(toMinorFee(p.fixedAmountMinor), b.currency)
          .multiply(b.quantity)
          .minorUnits;
      case "percentOfPrice":
        // Percent of the UNIT price, rounded per unit, then x quantity — matching
        // the cost-line rounding order and the per-unit shape of the kind itself.
        return Money.fromMinor(
          CommissionCalculator.applyRatioMinor(
            Money.fromMajor(input.unitPrice, b.currency).minorUnits,
            p.priceRatio ?? 0,
            beneficiary,
          ),
          b.currency,
        )
          .multiply(b.quantity)
          .minorUnits;
      case "profitShare":
      default:
        return CommissionCalculator.applyRatioMinor(
          b.basis.minorUnits,
          p.repRatio ?? DEFAULT_REP_RATIO,
          beneficiary,
        );
    }
  }

  /** Most specific wins: product x rep, product, rep, account default. Never throws. */
  static resolveScheme(input: SchemeResolutionInput): SchemeResolution {
    // No rep means no split at all — not a zero-share row against nobody.
    if (!input.repId) return { scheme: null, tier: "none" };

    const byId = new Map(input.schemes.map((s) => [s.id, s]));

    const eligible = (a: CommissionAssignment): CommissionScheme | null => {
      if (a.status !== "active") return null; // an archived binding wins nothing
      const s = byId.get(a.schemeId);
      if (!s || s.status !== "active") return null; // dangling or archived: fall through
      return s;
    };

    const pick = (
      tier: Exclude<SchemeTier, "accountDefault" | "none">,
    ): SchemeResolution | null => {
      const hits = input.assignments
        .filter((a) => assignmentTier(a) === tier)
        .filter((a) =>
          tier === "productRep"
            ? a.productId === input.productId && a.repId === input.repId
            : tier === "product"
              ? a.productId === input.productId
              : a.repId === input.repId,
        )
        // Archived bindings are dropped BEFORE the sort, not inside the loop after
        // it: a malformed archived row must not be able to reach the comparator.
        .filter((a) => a.status === "active")
        // Storage is user-editable JSON and may hold duplicates at one tier;
        // newest-then-lowest-id keeps resolution deterministic. The fields are
        // read defensively because the same distrust that motivates this sort
        // applies to the timestamps themselves — a row written by an older
        // version, or by hand, can be missing them, and this method's contract
        // is that it never throws.
        .slice()
        .sort(
          (x, y) =>
            (y.updatedAt ?? "").localeCompare(x.updatedAt ?? "") ||
            (x.id ?? "").localeCompare(y.id ?? ""),
        );
      for (const a of hits) {
        const s = eligible(a);
        if (s) return { scheme: s, tier, assignmentId: a.id };
      }
      return null;
    };

    const specific = pick("productRep") ?? pick("product") ?? pick("rep");
    if (specific) return specific;

    const fallback = input.accountDefaultSchemeId
      ? byId.get(input.accountDefaultSchemeId)
      : undefined;
    return fallback && fallback.status === "active"
      ? { scheme: fallback, tier: "accountDefault" }
      : { scheme: null, tier: "none" };
  }

  /**
   * The value written into `Sale.commissionSnapshot` at record time.
   *
   * Returns undefined — refusing to freeze a guess — when there is no rep, no
   * rep record, or no resolvable scheme. A fabricated 50/50 would be permanent
   * unfixable debt; an absent snapshot is a state the merchant can repair.
   */
  static snapshot(input: CommissionSnapshotInput): CommissionSnapshot | undefined {
    const { sale, rep, resolution, calculatedAt, costs } = input;
    if (!sale.repId || !rep || rep.id !== sale.repId || !resolution.scheme) return undefined;

    const params = schemeParams(resolution.scheme);
    const r = CommissionCalculator.split({
      unitPrice: sale.unitPrice,
      quantity: sale.quantity,
      currency: sale.currency,
      costs,
      params,
      discount: sale.discount,
    });

    return {
      schemeId: resolution.scheme.id,
      schemeName: resolution.scheme.name,
      schemeTier: resolution.tier,
      params,
      repId: rep.id,
      repName: rep.name,
      currency: r.currency,
      revenueMinor: r.revenue.minorUnits,
      netProfitMinor: r.netProfit.minorUnits,
      basisMinor: r.basis.minorUnits,
      repShareMinor: r.repShare.minorUnits,
      ownerShareMinor: r.ownerShare.minorUnits,
      calculatedAt,
    };
  }

  /**
   * Re-hydrate a frozen split for display. A pure re-read of stored integers:
   * no recompute, no lookup, no arithmetic on `params`. This is why a snapshot
   * survives a scheme edit, a scheme deletion, a rep archival and an account
   * currency change byte-identically.
   */
  static fromSnapshot(snapshot: CommissionSnapshot): CommissionSplitReadback {
    const c = snapshot.currency;
    return {
      currency: c,
      revenue: Money.fromMinor(snapshot.revenueMinor, c),
      totalCost: Money.fromMinor(norm0(snapshot.revenueMinor - snapshot.netProfitMinor), c),
      netProfit: Money.fromMinor(snapshot.netProfitMinor, c),
      basis: Money.fromMinor(snapshot.basisMinor, c),
      repShare: Money.fromMinor(snapshot.repShareMinor, c),
      ownerShare: Money.fromMinor(snapshot.ownerShareMinor, c),
      ownerKeeps: Money.fromMinor(norm0(snapshot.netProfitMinor - snapshot.repShareMinor), c),
      lossApplied: lossPolicyApplied(snapshot),
      // Derived, not frozen: an older snapshot predates the field, and the fact is
      // recoverable — a non-proportional rule whose share landed exactly on a
      // positive basis is a fee that was cut down to it.
      feeCapped:
        snapshot.params.kind !== "profitShare" &&
        snapshot.params.lossPolicy === "ownerOnly" &&
        snapshot.basisMinor > 0 &&
        snapshot.repShareMinor === snapshot.basisMinor,
      effectiveRepRatio: CommissionCalculator.effectiveRepRatio(
        snapshot.basisMinor,
        snapshot.repShareMinor,
      ),
    };
  }

  /**
   * The ONLY place a ratio meets money.
   *
   * Never `Math.floor(amountMinor * ratio)`, never `Percentage.of`, never
   * `Money.multiply(ratio)`: those go through IEEE doubles, where
   * 180*0.35 = 62.99999999999999 and 100*0.55 = 55.00000000000001 — each one a
   * fils stolen from or invented for a real person. Integer x integer is exact,
   * and the remainder tells us whether a crumb exists at all.
   */
  static applyRatioMinor(
    amountMinor: number,
    ratio: number,
    beneficiary: RoundingBeneficiary,
  ): number {
    const num = amountMinor * toBp(ratio); // integer x integer — exact
    const rem = num % BP_SCALE; // sign follows num
    const q = (num - rem) / BP_SCALE; // exact truncation toward zero
    // No crumb exists: NEVER manufacture one. Both beneficiaries agree here.
    if (rem === 0) return norm0(q);
    return norm0(beneficiary === "owner" ? q : q + (num > 0 ? 1 : -1));
  }

  /**
   * The ratio the split actually realised. null on a zero basis, because a share
   * of nothing is undefined rather than 0% — `Money.ratioTo` returns 0 for a zero
   * denominator and must not be used for this reading.
   */
  static effectiveRepRatio(basisMinor: number, repShareMinor: number): number | null {
    return basisMinor === 0 ? null : repShareMinor / basisMinor;
  }
}

/**
 * A rep's balance is always derived: sum of frozen rep shares minus sum of
 * settlements, recomputed on every read. No stored counter exists to drift when
 * a sale is voided or a payment corrected.
 */
export class RepBalanceCalculator {
  static forRep(
    repId: string,
    snapshots: readonly CommissionSnapshot[],
    settlements: readonly Settlement[],
  ): RepBalance {
    const lines = new Map<string, CurrencyBalance>();
    // Group by currency BEFORE any addition: Money.add across currencies throws,
    // and the domain holds no FX rate to convert with.
    const bump = (currency: string): CurrencyBalance => {
      const existing = lines.get(currency);
      if (existing) return existing;
      const created: CurrencyBalance = { currency, earnedMinor: 0, settledMinor: 0, balanceMinor: 0 };
      lines.set(currency, created);
      return created;
    };

    for (const s of snapshots) {
      if (s.repId === repId) bump(s.currency).earnedMinor += s.repShareMinor;
    }
    for (const t of settlements) {
      if (t.repId === repId) bump(t.currency).settledMinor += t.amountMinor;
    }
    // Never clamped: a negative balance means the rep was paid ahead, and
    // clamping it would destroy the merchant's own cash on the next credit.
    for (const line of lines.values()) {
      line.balanceMinor = norm0(line.earnedMinor - line.settledMinor);
    }

    return {
      repId,
      lines: [...lines.values()].sort((a, b) => a.currency.localeCompare(b.currency)),
    };
  }

  static forAll(
    repIds: readonly string[],
    snapshots: readonly CommissionSnapshot[],
    settlements: readonly Settlement[],
  ): RepBalance[] {
    return repIds.map((id) => RepBalanceCalculator.forRep(id, snapshots, settlements));
  }
}
