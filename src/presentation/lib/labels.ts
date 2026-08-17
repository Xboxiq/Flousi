import type { CostLine } from "@/domain";

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
