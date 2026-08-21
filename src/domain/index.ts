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

export type {
  Order,
  NewOrder,
  OrderLineInput,
  DeliveryAllocation,
  DeliveryShare,
} from "./entities/order";
export {
  DELIVERY_ALLOCATIONS,
  DELIVERY_ALLOCATION_LABELS,
  deliveryMargin,
  defaultAllocation,
} from "./entities/order";

export {
  allocateDelivery,
  calculateOrder,
  costsByProduct,
  splitDeliveryMargin,
} from "./services/order-calculator";
export type {
  OrderLineResult,
  OrderResult,
  DeliverySplitResult,
} from "./services/order-calculator";

export type {
  Target,
  NewTarget,
  TargetMetric,
  TargetStatus,
  TargetScope,
} from "./entities/target";
export { targetScope, targetMonthKey, TARGET_SCOPE_RANK } from "./entities/target";

export type {
  Role,
  NewRole,
  RoleStatus,
  Capability,
  AccessSession,
  PinRecord,
} from "./entities/role";
export {
  CAPABILITIES,
  CAPABILITY_LABELS,
  CAPABILITY_NOTES,
  OWNER_ROLE_ID,
  ownerRole,
  isOwnerRole,
} from "./entities/role";

export { AccessPolicy } from "./services/access-policy";
export type { ResolvedAccess } from "./services/access-policy";

export { TargetCalculator } from "./services/target-calculator";
export type { TargetQuery, TargetResolution, TargetProgress } from "./services/target-calculator";

export { ProfitCalculator } from "./services/profit-calculator";
export type { ProfitInput, ProfitResult } from "./services/profit-calculator";

export { payableStepMinor } from "./services/commission-calculator";
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
  TargetRepository,
  RoleRepository,
  AccessStore,
  OrderRepository,
} from "./ports/repositories";
export type {
  Clock,
  IdGenerator,
  ExportService,
  ExportFormat,
  ExportableTable,
} from "./ports/services";
