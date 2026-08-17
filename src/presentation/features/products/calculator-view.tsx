"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { FloppyDisk } from "@phosphor-icons/react";
import { emptyCostBreakdown, type CostBreakdown, type CostLine } from "@/domain";
import { useDataStore } from "@/presentation/stores/data-store";
import { PageHeader } from "@/presentation/components/layout/page-header";
import { Field, Input, Select } from "@/presentation/components/ui";
import { RitualButton } from "@/presentation/components/interactive/ritual-button";
import { currencySymbol } from "@/presentation/lib/format";
import { durations, easeOut } from "@/presentation/lib/motion";
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

/**
 * الحاسبة as a lit scene (MASTER v4 · VISUAL-LAW §7): a mesh field carrying a
 * faded technical grid (plane: field), carved clay panels the merchant works in
 * (plane: mid), and the glass result over the price column (plane: focal).
 * One orchestrated entrance ≤ 700ms, then everything is still — the only motion
 * left is the merchant's own numbers responding.
 */
export function CalculatorView() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const settings = useDataStore((s) => s.settings);
  const createProduct = useDataStore((s) => s.createProduct);

  const [sellingPrice, setSellingPrice] = useState(0);
  const [currency, setCurrency] = useState(settings.currency);
  const [costs, setCosts] = useState<CostBreakdown>(emptyCostBreakdown());
  const [name, setName] = useState("");

  const symbol = currencySymbol(currency, settings.locale);

  const onCostChange = (line: CostLine, field: "fixed" | "percent", value: number) =>
    setCosts((prev) => ({ ...prev, [line]: { ...prev[line], [field]: value } }));

  const saveAsProduct = async () => {
    if (sellingPrice <= 0) return;
    const created = await createProduct({
      name: name.trim() || "منتج بدون اسم",
      sellingPrice,
      currency,
      costs,
      status: "draft",
    });
    // The seal is the confirmation; the route change follows it, not replaces it.
    setTimeout(() => router.push(`/products/view?id=${created.id}`), 620);
  };

  /** Scene entrance: focal first, then the work surfaces. Never gates content. */
  const step = (order: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, transform: "translateY(14px)" },
          animate: { opacity: 1, transform: "translateY(0px)" },
          transition: { duration: durations.slow, ease: easeOut, delay: order * 0.07 },
        };

  return (
    <>
      <PageHeader
        title="حاسبة الأرباح"
        description="جرّب التسعير والتكاليف فورًا، دون الحاجة للحفظ."
      />

      <div className="scene-field p-4 sm:p-6 lg:p-8" data-plane="field">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_368px]">
          {/* ---- plane: mid — the carved surfaces the merchant works in ---- */}
          <div className="flex flex-col gap-5" data-plane="mid">
            <motion.section {...step(1)} className="clay p-5">
              <h2 className="text-heading font-bold text-fg">التسعير</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="سعر البيع" htmlFor="price">
                  <Input
                    id="price"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                    leading={symbol}
                    className="clay-inset"
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
                    className="clay-inset"
                    onChange={(e) => setCurrency(e.target.value)}
                  />
                </Field>
              </div>
            </motion.section>

            <motion.section {...step(2)} className="clay p-5">
              <h2 className="text-heading font-bold text-fg">التكاليف</h2>
              <p className="mt-1 text-sm text-muted">
                كل بند يقبل مبلغًا ثابتًا أو نسبة من سعر البيع، أو الاثنين معًا.
              </p>
              <div className="mt-4">
                <CostFields costs={costs} currencySymbol={symbol} onChange={onCostChange} />
              </div>
            </motion.section>

            <motion.section {...step(3)} className="clay p-5">
              <h2 className="text-heading font-bold text-fg">حفظ كمنتج</h2>
              <p className="mt-1 text-sm text-muted">
                احتفظ بهذه الحسبة في الكتالوج لتتبّع مبيعاتها لاحقًا.
              </p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
                <Field label="اسم المنتج" htmlFor="name" className="flex-1">
                  <Input
                    id="name"
                    value={name}
                    className="clay-inset"
                    onChange={(e) => setName(e.target.value)}
                    placeholder="اختياري"
                  />
                </Field>
                <RitualButton
                  onAction={saveAsProduct}
                  disabled={sellingPrice <= 0}
                  doneLabel="تم الحفظ"
                  icon={<FloppyDisk size={16} />}
                >
                  حفظ كمنتج
                </RitualButton>
              </div>
            </motion.section>
          </div>

          {/* ---- plane: focal — the glass result + the price column ---- */}
          <motion.div
            {...step(0)}
            /* The answer leads on a phone; on desktop the grid already places it
               at the reading-start edge. */
            className="scene-spot order-first lg:order-none lg:sticky lg:top-20 lg:self-start"
            data-plane="focal"
          >
            <ProfitPanel
              sellingPrice={sellingPrice}
              costs={costs}
              currency={currency}
              locale={settings.locale}
              withColumn
            />
          </motion.div>
        </div>
      </div>
    </>
  );
}
