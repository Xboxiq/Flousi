import type { Product, NewProduct } from "../entities/product";
import type { Sale, NewSale } from "../entities/sale";
import type { AccountingPeriod } from "../entities/accounting-period";

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
  /** Default cost values pre-filled into new product forms. */
  defaultCosts: {
    marketplaceFeePercent: number;
    paymentFeePercent: number;
    paymentFeeFixed: number;
    taxPercent: number;
  };
}

export interface SettingsRepository {
  get(): Promise<AppSettings>;
  save(settings: AppSettings): Promise<AppSettings>;
}
