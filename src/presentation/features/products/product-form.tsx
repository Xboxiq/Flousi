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
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Field,
  Input,
  Select,
  Textarea,
} from "@/presentation/components/ui";
import { currencySymbol } from "@/presentation/lib/format";
import { CostFields } from "./cost-fields";
import { ProfitPanel } from "./profit-panel";

const CURRENCY_OPTIONS = [
  { label: "دينار عراقي (IQD)", value: "IQD" },
  { label: "دولار أمريكي (USD)", value: "USD" },
  { label: "يورو (EUR)", value: "EUR" },
  { label: "جنيه إسترليني (GBP)", value: "GBP" },
  { label: "ريال سعودي (SAR)", value: "SAR" },
  { label: "درهم إماراتي (AED)", value: "AED" },
  { label: "جنيه مصري (EGP)", value: "EGP" },
];

const STATUS_OPTIONS = [
  { label: "نشط", value: "active" },
  { label: "مسودة", value: "draft" },
  { label: "مؤرشف", value: "archived" },
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
    if (!name.trim()) return setError("اسم المنتج مطلوب.");
    if (sellingPrice <= 0) return setError("يجب أن يكون سعر البيع أكبر من صفر.");
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
        router.push(`/products/view?id=${product.id}`);
      } else {
        const created = await createProduct(payload);
        router.push(`/products/view?id=${created.id}`);
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
            <CardTitle>البيانات الأساسية</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="اسم المنتج" htmlFor="name" required className="sm:col-span-2">
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: حقيبة كتان كروس"
              />
            </Field>
            <Field label="SKU" htmlFor="sku">
              <Input
                id="sku"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="BAG-LIN-01"
              />
            </Field>
            <Field label="الفئة" htmlFor="category">
              <Input
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="حقائب"
              />
            </Field>
            <Field label="الحالة" htmlFor="status">
              <Select
                id="status"
                value={status}
                options={STATUS_OPTIONS}
                onChange={(e) => setStatus(e.target.value as ProductStatus)}
              />
            </Field>
            <Field label="ملاحظات" htmlFor="notes" className="sm:col-span-2">
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="ملاحظات داخلية…"
              />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>التسعير</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="سعر البيع" htmlFor="price" required>
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
            <Field label="العملة" htmlFor="currency">
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
            <CardTitle>التكاليف</CardTitle>
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
            {isEdit ? "حفظ التغييرات" : "إنشاء المنتج"}
          </Button>
          {!isEdit && (
            <Button type="button" variant="ghost" onClick={reset} disabled={saving}>
              تفريغ
            </Button>
          )}
        </div>
      </div>

      {/* Sticky live results */}
      <div className="lg:sticky lg:top-20 lg:self-start">
        <ProfitPanel
          sellingPrice={sellingPrice}
          costs={costs}
          currency={currency}
          locale={settings.locale}
        />
      </div>
    </form>
  );
}
