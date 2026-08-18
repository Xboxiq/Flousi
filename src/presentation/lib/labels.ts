import type {
  CommissionKind,
  CostLine,
  LossPolicy,
  ProfitBasis,
  RepStatus,
  RoundingBeneficiary,
  SchemeTier,
} from "@/domain";

/**
 * The one place a cost line is named in Arabic. Three surfaces read these (the
 * product form, the profit panel, the distribution bar), so they cannot drift.
 */
export const COST_LINE_LABELS: Record<CostLine, string> = {
  purchase: "تكلفة الشراء",
  shipping: "التوصيل",
  packaging: "التغليف",
  marketplaceFees: "رسوم المنصّة",
  paymentFees: "رسوم الدفع",
  taxes: "الضرائب",
  other: "أخرى",
};

/**
 * The commission vocabulary, in one place. Six surfaces read these (the team
 * screen, the rep profile, the record-sale preview, the calibration bench, the
 * overrides table and the settlement sheet), so a term can never drift between
 * two of them — and the words themselves are the ones PRODUCT-PLAN §4 locked.
 */
export const REP_STATUS_LABELS: Record<RepStatus, string> = {
  active: "نشط",
  archived: "مؤرشف",
};

export const COMMISSION_KIND_LABELS: Record<CommissionKind, string> = {
  profitShare: "نسبة من الربح",
  fixedPerUnit: "مبلغ ثابت لكل وحدة",
  percentOfPrice: "نسبة من سعر البيع",
};

export const PROFIT_BASIS_LABELS: Record<ProfitBasis, string> = {
  netProfit: "صافي الربح",
  afterPurchaseCost: "الربح بعد الشراء",
};

/** Short sublabels for the basis switch. The FIGURES beside them do the explaining. */
export const PROFIT_BASIS_HINTS: Record<ProfitBasis, string> = {
  netProfit: "كل التكاليف تُخصم قبل القسمة",
  afterPurchaseCost: "تُخصم تكلفة الشراء فقط، والباقي على التاجر",
};

export const LOSS_POLICY_LABELS: Record<LossPolicy, string> = {
  ownerOnly: "على التاجر وحده",
  shared: "مشتركة مع المندوب",
};

export const ROUNDING_BENEFICIARY_LABELS: Record<RoundingBeneficiary, string> = {
  owner: "التاجر",
  rep: "المندوب",
};

/** Which tier of the resolution chain won. Most specific first, as it resolves. */
export const SCHEME_TIER_LABELS: Record<SchemeTier, string> = {
  productRep: "المنتج مع المندوب",
  product: "المنتج",
  rep: "المندوب",
  accountDefault: "الافتراضي للحساب",
  none: "لا ينطبق",
};
