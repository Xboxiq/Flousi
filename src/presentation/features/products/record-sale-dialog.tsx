"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { NewSale, Product } from "@/domain";
import { CommissionCalculator, schemeParams } from "@/domain";
import { useDataStore } from "@/presentation/stores/data-store";
import { Button, Dialog, Field, Input, Select } from "@/presentation/components/ui";
import { currencySymbol, formatCurrency } from "@/presentation/lib/format";
import { SCHEME_TIER_LABELS } from "@/presentation/lib/labels";
import { SplitPreview } from "@/presentation/features/reps/split-preview";

interface Props {
  product: Product;
  open: boolean;
  onClose: () => void;
}

/** Sold by the merchant themselves. An explicit option, never an empty placeholder. */
const NO_REP = "";

export function RecordSaleDialog({ product, open, onClose }: Props) {
  const settings = useDataStore((s) => s.settings);
  const periods = useDataStore((s) => s.periods);
  const createSale = useDataStore((s) => s.createSale);
  const reps = useDataStore((s) => s.reps);
  const schemes = useDataStore((s) => s.commissionSchemes);
  const assignments = useDataStore((s) => s.commissionAssignments);

  const [quantity, setQuantity] = useState(1);
  /* null = the field was cleared, so the product's list price stands in. A typed
     0 is a real price (a giveaway or a promo) and must survive: `||` used to turn
     it into the list price and pay a rep commission on revenue never received. */
  const [unitPrice, setUnitPrice] = useState<number | null>(product.sellingPrice);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [repId, setRepId] = useState<string>(NO_REP);
  const [saving, setSaving] = useState(false);

  const symbol = currencySymbol(product.currency, settings.locale);
  const activePeriod = periods.find((p) => p.status === "open");
  const money = (n: number) =>
    formatCurrency(n, { currency: product.currency, locale: settings.locale });

  // Only an active rep can be credited with a NEW sale; an archived one keeps
  // their history and their balance but is never offered again.
  const activeReps = useMemo(() => reps.filter((r) => r.status === "active"), [reps]);
  const rep = useMemo(() => activeReps.find((r) => r.id === repId) ?? null, [activeReps, repId]);

  /* Most-specific-wins, from the domain resolver: product × rep, product, rep,
     account default. Recomputed as the picker changes so the preview can never
     report a rule the save would not use. */
  const resolution = useMemo(
    () =>
      CommissionCalculator.resolveScheme({
        productId: product.id,
        repId: repId || undefined,
        assignments,
        schemes,
        accountDefaultSchemeId: settings.defaultCommissionSchemeId,
      }),
    [product.id, repId, assignments, schemes, settings.defaultCommissionSchemeId],
  );

  /* Every figure in the preview comes from this one call — the view multiplies
     nothing and rounds nothing, so what is shown is exactly what gets frozen. */
  const split = useMemo(() => {
    if (!rep || !resolution.scheme) return null;
    return CommissionCalculator.split({
      unitPrice: unitPrice ?? product.sellingPrice,
      quantity: Math.max(1, quantity),
      currency: product.currency,
      costs: product.costs,
      params: schemeParams(resolution.scheme),
    });
  }, [rep, resolution.scheme, unitPrice, quantity, product]);

  const submit = async () => {
    setSaving(true);
    try {
      const draft: NewSale = {
        productId: product.id,
        quantity: Math.max(1, quantity),
        unitPrice: unitPrice ?? product.sellingPrice,
        currency: product.currency,
        soldAt: new Date(date + "T12:00:00").toISOString(),
        periodId: activePeriod?.id,
        repId: rep?.id,
      };
      /* Freeze the split BY VALUE at record time. A later edit to the scheme
         binds new sales only, which is what makes the rep's history unrewritable
         (PRODUCT-PLAN §7 decision 1). Returns undefined when no rule resolved:
         the sale is still recorded and surfaces as fixable rather than blocked. */
      const commissionSnapshot = CommissionCalculator.snapshot({
        sale: draft,
        costs: product.costs,
        rep,
        resolution,
        calculatedAt: new Date().toISOString(),
      });
      await createSale({ ...draft, commissionSnapshot });
      onClose();
      setQuantity(1);
      setUnitPrice(product.sellingPrice);
      setRepId(NO_REP);
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
            value={unitPrice ?? ""}
            onChange={(e) => {
              const raw = e.target.value;
              const parsed = parseFloat(raw);
              // An emptied field means «follow the list price»; a typed 0 means
              // this unit really went out for nothing, and the split must say so.
              setUnitPrice(raw === "" || !Number.isFinite(parsed) ? null : Math.max(0, parsed));
            }}
          />
        </Field>
        <Field label="تاريخ البيع" htmlFor="date">
          <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field
          label="المندوب"
          htmlFor="rep"
          helper={activeReps.length === 0 ? "لا يوجد مندوبون نشطون بعد." : undefined}
        >
          <Select
            id="rep"
            value={repId}
            onChange={(e) => setRepId(e.target.value)}
            options={[
              { label: "بيع مباشر، بدون مندوب", value: NO_REP },
              ...activeReps.map((r) => ({ label: r.name, value: r.id })),
            ]}
          />
        </Field>
      </div>

      {/* The ritual: the split is stated before the sale is saved, and it exists
          only when a rep is actually credited (state-bound, VISUAL-LAW §8). */}
      {rep && split && (
        <SplitPreview
          className="mt-4"
          split={split}
          profitBasis={resolution.scheme?.profitBasis ?? "netProfit"}
          repName={rep.name}
          schemeName={resolution.scheme?.name ?? ""}
          tierLabel={SCHEME_TIER_LABELS[resolution.tier]}
          money={money}
          locale={settings.locale}
        />
      )}

      {/* A rep with no resolvable rule: the sale still records, and the gap is
          named with the way out instead of a fabricated 50/50. */}
      {rep && !split && (
        <div className="clay-inset mt-4 rounded-[var(--radius-md)] px-4 py-3">
          <p className="text-[13px] text-fg">لا يوجد نظام قسمة ينطبق على هذه العملية.</p>
          <p className="mt-1 text-[12px] text-muted">
            سيُسجَّل البيع باسم {rep.name} بدون حصة محسوبة، ويظهر في ملفه كحالة تحتاج ضبطًا.
          </p>
          <Button asChild variant="ghost" size="sm" className="mt-2 -ms-3">
            <Link href="/reps/schemes">اضبط نظام القسمة</Link>
          </Button>
        </div>
      )}
    </Dialog>
  );
}
