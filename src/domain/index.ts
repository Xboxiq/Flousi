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
export type { AccountingPeriod, PeriodStatus, PeriodSummary } from "./entities/accounting-period";
export { isLocked } from "./entities/accounting-period";

export { ProfitCalculator } from "./services/profit-calculator";
export type { ProfitInput, ProfitResult } from "./services/profit-calculator";

export type {
  ProductRepository,
  SaleRepository,
  PeriodRepository,
  SettingsRepository,
  AppSettings,
} from "./ports/repositories";
export type {
  Clock,
  IdGenerator,
  ExportService,
  ExportFormat,
  ExportableTable,
} from "./ports/services";
