// Domain layer public API. Import from "@/domain" rather than deep paths.

export { Money } from "./value-objects/money";
export { Percentage } from "./value-objects/percentage";

export type { CostComponent, CostBreakdown, CostLine } from "./entities/cost-breakdown";
export {
  COST_LINES,
  emptyCostComponent,
  emptyCostBreakdown,
  makeCostBreakdown,
} from "./entities/cost-breakdown";

export type { Product, NewProduct, ProductStatus } from "./entities/product";
export type { Sale, NewSale } from "./entities/sale";
export { needsCommissionScheme } from "./entities/sale";
export type { AccountingPeriod, PeriodStatus, PeriodSummary } from "./entities/accounting-period";
export { isLocked } from "./entities/accounting-period";

export type { Rep, NewRep, RepStatus } from "./entities/rep";
export { isArchivedRep } from "./entities/rep";

export type {
  CommissionScheme,
  NewCommissionScheme,
  CommissionSchemeParams,
  CommissionKind,
  ProfitBasis,
  LossPolicy,
  RoundingBeneficiary,
  CommissionSchemeStatus,
} from "./entities/commission-scheme";
export {
  DEFAULT_REP_RATIO,
  DEFAULT_PROFIT_BASIS,
  DEFAULT_LOSS_POLICY,
  DEFAULT_ROUNDING_BENEFICIARY,
  defaultCommissionSchemeParams,
  schemeParams,
  toFixedAmountMinor,
} from "./entities/commission-scheme";

export type {
  CommissionAssignment,
  NewCommissionAssignment,
  CommissionAssignmentStatus,
  SchemeTier,
} from "./entities/commission-assignment";
export { SCHEME_TIER_RANK, assignmentTier } from "./entities/commission-assignment";

export type { CommissionSnapshot } from "./entities/commission-snapshot";
export { lossPolicyApplied, ownerKeepsMinor } from "./entities/commission-snapshot";

export type {
  Settlement,
  NewSettlement,
  CurrencyBalance,
  RepBalance,
} from "./entities/settlement";

export { ProfitCalculator } from "./services/profit-calculator";
export type { ProfitInput, ProfitResult } from "./services/profit-calculator";

export { CommissionCalculator, RepBalanceCalculator } from "./services/commission-calculator";
export type {
  CommissionBasisInput,
  CommissionBasisResult,
  CommissionSplitInput,
  CommissionSplitResult,
  CommissionSplitReadback,
  SchemeResolutionInput,
  SchemeResolution,
  CommissionSnapshotInput,
} from "./services/commission-calculator";

export type {
  ProductRepository,
  SaleRepository,
  PeriodRepository,
  SettingsRepository,
  AppSettings,
  RepRepository,
  CommissionSchemeRepository,
  CommissionAssignmentRepository,
  SettlementRepository,
} from "./ports/repositories";
export type {
  Clock,
  IdGenerator,
  ExportService,
  ExportFormat,
  ExportableTable,
} from "./ports/services";
