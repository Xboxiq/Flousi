"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FloppyDisk } from "@phosphor-icons/react";
import {
  ProfitCalculator,
  COST_LINES,
  emptyCostBreakdown,
  type CostBreakdown,
  type CostLine,
} from "@/domain";
import { useDataStore } from "@/presentation/stores/data-store";
import { PageHeader } from "@/presentation/components/layout/page-header";
import { Button, Field, Input, Select } from "@/presentation/components/ui";
import {
  Grid,
  Panel,
  Metric,
  SplitBar,
  SplitKey,
  Chip,
  type Slice,
} from "@/presentation/components/structure";
import { COST_LINE_LABELS } from "@/presentation/lib/labels";
import { currencySymbol, formatCurrency, formatPercent } from "@/presentation/lib/format";
import { cn } from "@/presentation/lib/cn";
import { CostFields } from "./cost-fields";

const CURRENCY_OPTIONS = [
  { label: "IQD", value: "IQD" },
  { label: "USD", value: "USD" },
  { label: "EUR", value: "EUR" },
  { label: "GBP", value: "GBP" },
  { label: "SAR", value: "SAR" },
  { label: "AED", value: "AED" },
  { label: "EGP", value: "EGP" },
];

/**
 * «الحاسبة» — pricing a product that does not exist yet.
 *
 * WHAT WAS WRONG WITH IT: the screen was a decorated stage — a mesh field with a
 * technical grid printed on it, three carved panels sitting inside that field, a
 * staggered entrance, and a glass result object floating over a drawn price
 * column. Card inside card inside card, one banned material, and a 2×2 grid of
 * four identical figure tiles: the exact shape the mark cannot make.
 *
 * WHAT IT IS NOW: the same two halves the product page uses, because it is the
 * same question asked before the product exists. You type on the right; the
 * answer builds on the left, in the same split bar and the same three limits the
 * product sheet prints, so a merchant who prices here and saves it recognises
 * every figure on the page he lands on.
 */
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
  const money = (n: number) => formatCurrency(n, { currency, locale: settings.locale });

  const result = useMemo(
    () => ProfitCalculator.calculate({ sellingPrice, costs, currency, quantity: 1 }),
    [sellingPrice, costs, currency],
  );

  const priced = sellingPrice > 0;

  /* The same bands the product sheet draws, so the two screens teach one shape. */
  const slices = useMemo<Slice[]>(() => {
    const bands: Slice[] = [
      { key: "profit", label: "ربحك", value: Math.max(0, result.netProfit), series: 1 },
    ];
    const lines = COST_LINES.map((line) => ({ line, amount: result.costByLine[line] ?? 0 }))
      .filter((l) => l.amount > 0)
      .sort((a, b) => b.amount - a.amount);
    const [first, second, ...rest] = lines;
    if (first)
      bands.push({ key: first.line, label: COST_LINE_LABELS[first.line], value: first.amount, series: 2 });
    if (second)
      bands.push({ key: second.line, label: COST_LINE_LABELS[second.line], value: second.amount, series: 3 });
    const other = rest.reduce((sum, l) => sum + l.amount, 0);
    if (other > 0) bands.push({ key: "other", label: "كلف أخرى", value: other, series: 4 });
    return bands;
  }, [result]);

  const onCostChange = (line: CostLine, field: "fixed" | "percent", value: number) =>
    setCosts((prev) => ({ ...prev, [line]: { ...prev[line], [field]: value } }));

  const saveAsProduct = async () => {
    if (!priced || saving) return;
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

  const verdict = !priced
    ? { tone: "neutral" as const, word: "بانتظار السعر" }
    : result.netProfit > 0
      ? { tone: "success" as const, word: "رابح" }
      : result.netProfit < 0
        ? { tone: "danger" as const, word: "خسارة" }
        : { tone: "warning" as const, word: "تعادل" };

  return (
    <>
      {/* No action in the bar. The one verb this screen has needs the name field
          beside it, and a second copy of a button whose input is somewhere else is
          a duplicate, not a shortcut. Not every screen owes the bar a verb. */}
      <PageHeader title="حاسبة الأرباح" />

      <Grid>
        {/* ── what you type ────────────────────────────────────────────────── */}
        <Panel span={6} title="الحسبة" bodyClassName="flex flex-col gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="سعر البيع" htmlFor="price">
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
            <Field label="العملة" htmlFor="cur">
              <Select
                id="cur"
                value={currency}
                options={CURRENCY_OPTIONS}
                onChange={(e) => setCurrency(e.target.value)}
              />
            </Field>
          </div>

          <div className="border-t border-line pt-4">
            <h3 className="text-[13px] font-bold text-fg">سطور الكلفة</h3>
            <p className="mt-1 text-[12px] leading-relaxed text-subtle">
              كل سطر يقبل مبلغاً ثابتاً أو نسبة من سعر البيع، أو الاثنين معاً.
            </p>
            <div className="mt-4">
              <CostFields costs={costs} currencySymbol={symbol} onChange={onCostChange} />
            </div>
          </div>
        </Panel>

        {/* ── what it means ────────────────────────────────────────────────── */}
        <Panel
          span={6}
          title="النتيجة"
          meta={<Chip tone={verdict.tone}>{verdict.word}</Chip>}
          bodyClassName="flex flex-col gap-5"
        >
          <Metric
            size="lead"
            amount={money(result.netProfit)}
            name="صافي الربح لكل وحدة مبيعة"
            className={cn(
              priced && result.netProfit > 0 && "[&_.amount]:text-accent",
              priced && result.netProfit < 0 && "[&_.amount]:text-danger",
              !priced && "[&_.amount]:text-subtle",
            )}
          />

          {priced ? (
            <>
              <div>
                <SplitBar slices={slices} total={sellingPrice} />
                <SplitKey slices={slices} format={money} />
              </div>

              <div className="grid gap-4 border-t border-line pt-4 sm:grid-cols-3">
                <Metric
                  size="sm"
                  amount={formatPercent(result.margin, { locale: settings.locale })}
                  name="الهامش"
                />
                <Metric
                  size="sm"
                  amount={
                    result.breakEvenPrice === null ? "لا يوجد" : money(result.breakEvenPrice)
                  }
                  name="سعر التعادل"
                />
                <Metric
                  size="sm"
                  amount={formatPercent(result.roi, { locale: settings.locale })}
                  name="العائد على الكلفة"
                />
              </div>

              <p className="text-[12px] leading-relaxed text-muted">
                {result.breakEvenPrice === null
                  ? "النسب في سطور الكلفة تبلغ مئة بالمئة أو أكثر، فلا سعر يجعل هذه الحسبة متعادلة. راجع النسب قبل السعر."
                  : result.netProfit < 0
                    ? "السعر تحت التعادل: كل قطعة تبيعها بهذا السعر تأخذ من جيبك."
                    : "الفرق بين سعرك وسعر التعادل هو كل ما تملكه للخصم أو للتوصيل المجاني."}
              </p>
            </>
          ) : (
            /* An empty state that says WHY it is empty and what fills it, rather
               than a hatched placeholder standing where a chart will be. */
            <p className="text-[13px] leading-relaxed text-muted">
              أدخل سعر البيع أولاً. سطور الكلفة تُقاس عليه، فالنسبة بلا سعر لا تُنتج
              رقماً.
            </p>
          )}
        </Panel>

        {/* ── keeping it ───────────────────────────────────────────────────── */}
        <Panel span={12} title="حفظ كمنتج" bodyClassName="flex flex-col gap-3">
          <p className="text-[12px] leading-relaxed text-muted">
            يُحفظ في الكتالوج كمسودة، فتُتابَع مبيعاته وأرباحه مثل أي منتج آخر. تبقى كل
            سطور الكلفة كما هي، ويمكن تعديلها من صفحته.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <Field label="اسم المنتج" htmlFor="name" className="flex-1">
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="اختياري"
              />
            </Field>
            <Button
              leadingIcon={<FloppyDisk size={16} />}
              disabled={!priced}
              loading={saving}
              onClick={saveAsProduct}
            >
              حفظ كمنتج
            </Button>
          </div>
          {!priced && (
            <p className="text-[11px] text-subtle">
              الحفظ متاح بعد إدخال سعر بيع أكبر من صفر.
            </p>
          )}
        </Panel>
      </Grid>
    </>
  );
}
