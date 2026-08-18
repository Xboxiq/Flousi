export type CommissionKind = "profitShare" | "fixedPerUnit" | "percentOfPrice";
export type ProfitBasis = "netProfit" | "afterPurchaseCost";
export type LossPolicy = "shared" | "ownerOnly";
export type RoundingBeneficiary = "owner" | "rep";
export type CommissionSchemeStatus = "active" | "archived";

/**
 * Everything the math needs and nothing else.
 *
 * Split out from the scheme's identity fields because this exact object is what
 * a sale freezes: the snapshot must hold values, not a foreign key, and the
 * calculator must be testable without inventing ids.
 */
export interface CommissionSchemeParams {
  kind: CommissionKind;
  /** profitShare only. Rep's share of the basis as a ratio 0..1; clamped to [0,1]. */
  repRatio?: number;
  /**
   * fixedPerUnit only. Rep's fee per unit in INTEGER MINOR UNITS of the sale's
   * currency. Minor units rather than major so a sub-cent fee (0.125) rounds
   * once, at creation, instead of at a different point per call site.
   */
  fixedAmountMinor?: number;
  /** percentOfPrice only. Rep's share of the unit selling price, ratio 0..1; clamped. */
  priceRatio?: number;
  /** Which amount gets split. Editable; edits bind new sales only. */
  profitBasis: ProfitBasis;
  /** Behaviour when the CHOSEN BASIS is negative — never when net profit is. */
  lossPolicy: LossPolicy;
  /**
   * Residual holder: whose line absorbs the one minor unit that cannot be
   * split, IN BOTH SIGNS. "owner" (the default) means the owner gains the odd
   * fils on a profit and eats it on a loss, so the rep's share is always the
   * exact truncation of ratio x basis toward zero — one branch-free formula a
   * rep can verify on a pocket calculator.
   */
  roundingBeneficiary: RoundingBeneficiary;
}

/**
 * A named commission rule. Deleting one is an archive, never a removal: an
 * archived scheme loses resolution but stays readable for the history it has
 * already frozen.
 */
export interface CommissionScheme extends CommissionSchemeParams {
  id: string;
  /** Arabic, merchant-authored, e.g. "المناصفة الافتراضية". */
  name: string;
  status: CommissionSchemeStatus;
  /** ISO timestamps. */
  createdAt: string;
  updatedAt: string;
}

export type NewCommissionScheme = Omit<CommissionScheme, "id" | "createdAt" | "updatedAt">;

export const DEFAULT_REP_RATIO = 0.5;
export const DEFAULT_PROFIT_BASIS: ProfitBasis = "netProfit";
export const DEFAULT_LOSS_POLICY: LossPolicy = "ownerOnly";
export const DEFAULT_ROUNDING_BENEFICIARY: RoundingBeneficiary = "owner";

/** The house default: an even split of net profit, with the rep shielded from losses. */
export function defaultCommissionSchemeParams(): CommissionSchemeParams {
  return {
    kind: "profitShare",
    repRatio: DEFAULT_REP_RATIO,
    profitBasis: DEFAULT_PROFIT_BASIS,
    lossPolicy: DEFAULT_LOSS_POLICY,
    roundingBeneficiary: DEFAULT_ROUNDING_BENEFICIARY,
  };
}

/** Strips identity so a scheme can be handed to the calculator or frozen verbatim. */
export function schemeParams(scheme: CommissionScheme): CommissionSchemeParams {
  const {
    kind,
    repRatio,
    fixedAmountMinor,
    priceRatio,
    profitBasis,
    lossPolicy,
    roundingBeneficiary,
  } = scheme;
  return { kind, repRatio, fixedAmountMinor, priceRatio, profitBasis, lossPolicy, roundingBeneficiary };
}

/**
 * Normalises a merchant-typed major fee (0.125) to the fils they will actually
 * be charged (13). Called once, at save time, so the scheme screen and every
 * later settlement agree by construction instead of by coincidence.
 */
export function toFixedAmountMinor(major: number): number {
  return Math.max(0, Math.round((Number.isFinite(major) ? major : 0) * 100));
}
