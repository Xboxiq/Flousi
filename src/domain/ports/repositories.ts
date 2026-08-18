import type { Product, NewProduct } from "../entities/product";
import type { Sale, NewSale } from "../entities/sale";
import type { AccountingPeriod } from "../entities/accounting-period";
import type { Rep, NewRep, RepStatus } from "../entities/rep";
import type { CommissionScheme, NewCommissionScheme } from "../entities/commission-scheme";
import type {
  CommissionAssignment,
  NewCommissionAssignment,
} from "../entities/commission-assignment";
import type { Settlement, NewSettlement } from "../entities/settlement";

/**
 * Persistence ports. Inner layers depend on these interfaces; infrastructure
 * provides adapters (localStorage now, cloud API later) without touching domain.
 * Async signatures so a network-backed adapter is a drop-in replacement.
 */

export interface ProductRepository {
  list(): Promise<Product[]>;
  getById(id: string): Promise<Product | null>;
  create(product: NewProduct): Promise<Product>;
  update(id: string, patch: Partial<NewProduct>): Promise<Product>;
  remove(id: string): Promise<void>;
}

export interface SaleRepository {
  list(filter?: { periodId?: string; productId?: string }): Promise<Sale[]>;
  getById(id: string): Promise<Sale | null>;
  create(sale: NewSale): Promise<Sale>;
  remove(id: string): Promise<void>;
}

export interface PeriodRepository {
  list(): Promise<AccountingPeriod[]>;
  getById(id: string): Promise<AccountingPeriod | null>;
  getActive(): Promise<AccountingPeriod | null>;
  create(period: Omit<AccountingPeriod, "id">): Promise<AccountingPeriod>;
  update(id: string, patch: Partial<AccountingPeriod>): Promise<AccountingPeriod>;
}

export interface AppSettings {
  currency: string;
  locale: string;
  language: "en" | "ar";
  /**
   * The merchant's own net-profit target for a month, in major units. 0 means
   * "no target set" — readings then compare against their own average instead.
   */
  monthlyProfitTarget: number;
  /** Default cost values pre-filled into new product forms. */
  defaultCosts: {
    marketplaceFeePercent: number;
    paymentFeePercent: number;
    paymentFeeFixed: number;
    taxPercent: number;
  };
  /**
   * Account-default commission scheme: the last resort of the resolution chain.
   * Lives here rather than as an assignment row so there is exactly one place
   * the fallback can be read from or written to.
   */
  defaultCommissionSchemeId?: string;
}

export interface SettingsRepository {
  get(): Promise<AppSettings>;
  save(settings: AppSettings): Promise<AppSettings>;
}

export interface RepRepository {
  list(filter?: { status?: RepStatus }): Promise<Rep[]>;
  getById(id: string): Promise<Rep | null>;
  create(rep: NewRep): Promise<Rep>;
  update(id: string, patch: Partial<NewRep>): Promise<Rep>;
  // No remove(): archive instead — history references reps forever.
}

export interface CommissionSchemeRepository {
  /** Includes archived schemes; the resolver decides what is eligible. */
  list(): Promise<CommissionScheme[]>;
  getById(id: string): Promise<CommissionScheme | null>;
  create(scheme: NewCommissionScheme): Promise<CommissionScheme>;
  update(id: string, patch: Partial<NewCommissionScheme>): Promise<CommissionScheme>;
  // No remove(): archive instead — a scheme stays readable for the history it froze.
}

export interface CommissionAssignmentRepository {
  list(): Promise<CommissionAssignment[]>;
  create(assignment: NewCommissionAssignment): Promise<CommissionAssignment>;
  update(id: string, patch: Partial<NewCommissionAssignment>): Promise<CommissionAssignment>;
  /** A binding holds no history of its own, so removing one is safe. */
  remove(id: string): Promise<void>;
}

export interface SettlementRepository {
  list(filter?: { repId?: string; periodId?: string }): Promise<Settlement[]>;
  getById(id: string): Promise<Settlement | null>;
  create(settlement: NewSettlement): Promise<Settlement>;
  /** Amount and currency are both editable — a mistyped payment is corrected, not voided. */
  update(id: string, patch: Partial<NewSettlement>): Promise<Settlement>;
  remove(id: string): Promise<void>;
}
