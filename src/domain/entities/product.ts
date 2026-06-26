import type { CostBreakdown } from "./cost-breakdown";

export type ProductStatus = "active" | "draft" | "archived";

/**
 * A product whose profitability is tracked. Pricing/costs are stored in major
 * units; the currency travels with the product so multi-currency catalogs work.
 */
export interface Product {
  id: string;
  name: string;
  sku?: string;
  category?: string;
  /** List/selling price in major units. */
  sellingPrice: number;
  /** ISO 4217 currency code. */
  currency: string;
  costs: CostBreakdown;
  images?: string[];
  notes?: string;
  status: ProductStatus;
  /** ISO timestamps. */
  createdAt: string;
  updatedAt: string;
}

export type NewProduct = Omit<Product, "id" | "createdAt" | "updatedAt">;
