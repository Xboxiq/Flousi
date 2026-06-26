"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FloppyDisk } from "@phosphor-icons/react";
import {
  emptyCostBreakdown,
  makeCostBreakdown,
  type CostBreakdown,
  type CostLine,
  type Product,
  type ProductStatus,
} from "@/domain";
import { useDataStore } from "@/presentation/stores/data-store";
import { Button, Card, CardContent, CardHeader, CardTitle, Field, Input, Select, Textarea } from "@/presentation/components/ui";
import { currencySymbol } from "@/presentation/lib/format";
import { CostFields } from "./cost-fields";
import { ProfitPanel } from "./profit-panel";

const CURRENCY_OPTIONS = [
  { label: "US Dollar (USD)", value: "USD" },
  { label: "Euro (EUR)", value: "EUR" },
  { label: "British Pound (GBP)", value: "GBP" },
  { label: "Saudi Riyal (SAR)", value: "SAR" },
  { label: "UAE Dirham (AED)", value: "AED" },
  { label: "Egyptian Pound (EGP)", value: "EGP" },
];

const STATUS_OPTIONS = [
  { label: "Active", value: "active" },
  { label: "Draft", value: "draft" },
  { label: "Archived", value: "archived" },
];

interface Props {
  product?: Product;
}

export function ProductForm({ product }: Props) {
  const router = useRouter();
  const settings = useDataStore((s) => s.settings);
  const createProduct = useDataStore((s) => s.createProduct);
  const updateProduct = useDataStore((s) => s.updateProduct);
  const isEdit = Boolean(product);

  const defaultCosts = useMemo<CostBreakdown>(() => {
    if (product) return product.costs;
    const d = settings.defaultCosts;
    return makeCostBreakdown({
      marketplaceFees: { fixed: 0, percent: d.marketplaceFeePercent },
      paymentFees: { fixed: d.paymentFeeFixed, percent: d.paymentFeePercent },
      taxes: { fixed: 0, percent: d.taxPercent },
    });
  }, [product, settings.defaultCosts]);

  const [name, setName] = useState(product?.name ?? "");
  const [sku, setSku] = useState(product?.sku ?? "");
  const [category, setCategory] = useState(product?.category ?? "");
  const [status, setStatus] = useState<ProductStatus>(product?.status ?? "active");
  const [currency, setCurrency] = useState(product?.currency ?? settings.currency);
  const [sellingPrice, setSellingPrice] = useState<number>(product?.sellingPrice ?? 0);
  const [notes, setNotes] = useState(product?.notes ?? "");
  const [costs, setCosts] = useState<CostBreakdown>(defaultCosts);

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const symbol = currencySymbol(currency, settings.locale);

  const onCostChange = (line: CostLine, field: "fixed" | "percent", value: number) => {
    setCosts((prev) => ({ ...prev, [line]: { ...prev[line], [field]: value } }));
  };

  const reset = () => {
    setName("");
    setSku("");
    setCategory("");
    setStatus("active");
    setSellingPrice(0);
    setNotes("");
    setCosts(emptyCostBreakdown());
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError("Product name is required.");
    if (sellingPrice <= 0) return setError("Selling price must be greater than zero.");
    setError(null);
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        sku: sku.trim() || undefined,
        category: category.trim() || undefined,
        sellingPrice,
        currency,
        costs,
        notes: notes.trim() || undefined,
        status,
      };
      if (isEdit && product) {
        await updateProduct(product.id, payload);
        router.push(`/products/${product.id}`);
      } else {
        const created = await createProduct(payload);
        router.push(`/products/${created.id}`);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Identity</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Product name" htmlFor="name" required className="sm:col-span-2">
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Linen Crossbody Tote" />
            </Field>
            <Field label="SKU" htmlFor="sku">
              <Input id="sku" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="BAG-LIN-01" />
            </Field>
            <Field label="Category" htmlFor="category">
              <Input id="category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Bags" />
            </Field>
            <Field label="Status" htmlFor="status">
              <Select
                id="status"
                value={status}
                options={STATUS_OPTIONS}
                onChange={(e) => setStatus(e.target.value as ProductStatus)}
              />
            </Field>
            <Field label="Notes" htmlFor="notes" className="sm:col-span-2">
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Internal notes…" />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Selling price" htmlFor="price" required>
              <Input
                id="price"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                leading={symbol}
                value={sellingPrice || ""}
                onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </Field>
            <Field label="Currency" htmlFor="currency">
              <Select
                id="currency"
                value={currency}
                options={CURRENCY_OPTIONS}
                onChange={(e) => setCurrency(e.target.value)}
              />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Costs</CardTitle>
          </CardHeader>
          <CardContent>
            <CostFields costs={costs} currencySymbol={symbol} onChange={onCostChange} />
          </CardContent>
        </Card>

        {error && (
          <p className="rounded-[var(--radius-md)] border border-danger bg-danger-soft px-4 py-2.5 text-sm text-danger">
            {error}
          </p>
        )}

        <div className="flex items-center gap-3">
          <Button type="submit" loading={saving} leadingIcon={<FloppyDisk size={16} />}>
            {isEdit ? "Save changes" : "Create product"}
          </Button>
          {!isEdit && (
            <Button type="button" variant="ghost" onClick={reset} disabled={saving}>
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Sticky live results */}
      <div className="lg:sticky lg:top-20 lg:self-start">
        <ProfitPanel sellingPrice={sellingPrice} costs={costs} currency={currency} locale={settings.locale} />
      </div>
    </form>
  );
}
