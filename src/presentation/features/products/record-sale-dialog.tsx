"use client";

import { useState } from "react";
import type { Product } from "@/domain";
import { useDataStore } from "@/presentation/stores/data-store";
import { Button, Dialog, Field, Input } from "@/presentation/components/ui";
import { currencySymbol } from "@/presentation/lib/format";

interface Props {
  product: Product;
  open: boolean;
  onClose: () => void;
}

export function RecordSaleDialog({ product, open, onClose }: Props) {
  const settings = useDataStore((s) => s.settings);
  const periods = useDataStore((s) => s.periods);
  const createSale = useDataStore((s) => s.createSale);

  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(product.sellingPrice);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  const symbol = currencySymbol(product.currency, settings.locale);
  const activePeriod = periods.find((p) => p.status === "open");

  const submit = async () => {
    setSaving(true);
    try {
      await createSale({
        productId: product.id,
        quantity: Math.max(1, quantity),
        unitPrice: unitPrice || product.sellingPrice,
        currency: product.currency,
        soldAt: new Date(date + "T12:00:00").toISOString(),
        periodId: activePeriod?.id,
      });
      onClose();
      setQuantity(1);
      setUnitPrice(product.sellingPrice);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="تسجيل عملية بيع"
      description={product.name}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            إلغاء
          </Button>
          <Button onClick={submit} loading={saving}>
            تسجيل البيع
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="الكمية" htmlFor="qty">
          <Input
            id="qty"
            type="number"
            min={1}
            value={quantity || ""}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
          />
        </Field>
        <Field label="سعر الوحدة" htmlFor="unit">
          <Input
            id="unit"
            type="number"
            min={0}
            step="0.01"
            leading={symbol}
            value={unitPrice || ""}
            onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
          />
        </Field>
        <Field label="تاريخ البيع" htmlFor="date" className="sm:col-span-2">
          <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
      </div>
    </Dialog>
  );
}
