export type CommissionAssignmentStatus = "active" | "archived";

/**
 * Binds a scheme to a product, a rep, or the pair — the three specific tiers of
 * the resolution chain, expressed as one entity so one comparator covers them
 * all. The account-default tier is deliberately NOT an assignment: it lives on
 * `AppSettings.defaultCommissionSchemeId`, so there is exactly one place the
 * fallback can be read from or written to.
 */
export interface CommissionAssignment {
  id: string;
  schemeId: string;
  /** Present = this rule is about that product. */
  productId?: string;
  /** Present = this rule is about that rep. */
  repId?: string;
  status: CommissionAssignmentStatus;
  /** ISO timestamps. */
  createdAt: string;
  updatedAt: string;
}

export type NewCommissionAssignment = Omit<CommissionAssignment, "id" | "createdAt" | "updatedAt">;

export type SchemeTier = "productRep" | "product" | "rep" | "accountDefault" | "none";

/** Specificity rank; higher wins. "none" is never selectable. */
export const SCHEME_TIER_RANK: Record<SchemeTier, number> = {
  productRep: 3,
  product: 2,
  rep: 1,
  accountDefault: 0,
  none: -1,
};

/**
 * Which tier an assignment belongs to. Storage is user-editable JSON, so an
 * assignment with neither key is malformed rather than impossible: it reports
 * "none" and loses every match instead of throwing.
 */
export function assignmentTier(a: CommissionAssignment): SchemeTier {
  if (a.productId && a.repId) return "productRep";
  if (a.productId) return "product";
  if (a.repId) return "rep";
  return "none";
}
