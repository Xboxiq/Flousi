"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FloppyDisk } from "@phosphor-icons/react";
import { emptyCostBreakdown, type CostBreakdown, type CostLine } from "@/domain";
import { useDataStore } from "@/presentation/stores/data-store";
import { PageHeader } from "@/presentation/components/layout/page-header";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Field,
  Input,
  Select,
} from "@/presentation/components/ui";
import { currencySymbol } from "@/presentation/lib/format";
import { CostFields } from "./cost-fields";
import { ProfitPanel } from "./profit-panel";

const CURRENCY_OPTIONS = [
  { label: "IQD", value: "IQD" },
  { label: "USD", value: "USD" },
  { label: "EUR", value: "EUR" },
  { label: "GBP", value: "GBP" },
  { label: "SAR", value: "SAR" },
  { label: "AED", value: "AED" },
  { label: "EGP", value: "EGP" },
];

export function CalculatorView() {
  const router = useRouter();
  const settings = useDataStore((s) => s.settings);
  const createProduct = useDataStore((s) => s.createProduct);

  const [sellingPrice, setSellingPrice] = useState(0);
  const [currency, setCurrency] = useState(settings.currency);
  const [costs, setCosts] = useState<CostBreakdown>(emptyCostBreakdown());
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const symbol = currencySymbol(currency, settings.locale);

  const onCostChange = (line: CostLine, field: "fixed" | "percent", value: number) =>
    setCosts((prev) => ({ ...prev, [line]: { ...prev[line], [field]: value } }));

  const saveAsProduct = async () => {
    if (sellingPrice <= 0) return;
    setSaving(true);
    try {
      const created = await createProduct({
        name: name.trim() || "منتج بدون اسم",
        sellingPrice,
        currency,
        costs,
        status: "draft",
      });
      router.push(`/products/view?id=${created.id}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="حاسبة الأرباح"
        description="جرّب التسعير والتكاليف فورًا، دون الحاجة للحفظ."
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>التسعير</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="سعر البيع" htmlFor="price">
                <Input
                  id="price"
                  type="number"
                  min={0}
                  step="0.01"
                  leading={symbol}
                  value={sellingPrice || ""}
                  onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </Field>
              <Field label="العملة" htmlFor="cur">
                <Select
                  id="cur"
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

          <Card>
            <CardHeader>
              <CardTitle>حفظ كمنتج</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <Field label="اسم المنتج" htmlFor="name" className="flex-1">
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="اختياري"
                />
              </Field>
              <Button
                onClick={saveAsProduct}
                loading={saving}
                disabled={sellingPrice <= 0}
                leadingIcon={<FloppyDisk size={16} />}
              >
                حفظ كمنتج
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:sticky lg:top-20 lg:self-start">
          <ProfitPanel
            sellingPrice={sellingPrice}
            costs={costs}
            currency={currency}
            locale={settings.locale}
          />
        </div>
      </div>
    </>
  );
}
