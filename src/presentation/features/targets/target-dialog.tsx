"use client";

import { useState } from "react";
import type { Target, TargetMetric } from "@/domain";
import { useDataStore } from "@/presentation/stores/data-store";
import { Button, Dialog, Field, Input, Segmented } from "@/presentation/components/ui";
import { RingGauge } from "@/presentation/components/objects/ring-gauge";
import { formatCurrency, formatPercent } from "@/presentation/lib/format";

const SPANS = [
  { label: "كل شهر", value: "standing" as const },
  { label: "هذا الشهر فقط", value: "month" as const },
];
type Span = (typeof SPANS)[number]["value"];

const METRIC_WORD: Record<TargetMetric, string> = {
  netProfit: "صافي ربح",
  revenue: "إيراد",
  units: "قطعة",
};

/**
 * Setting a target.
 *
 * The caller keys this component by the row it was opened from, so opening
 * سارة's sheet after علي's REMOUNTS it with سارة's values. That is why the draft
 * can be plain `useState` seeded from props: re-seeding an existing instance from
 * an effect would write state during render for every unrelated re-render too.
 *
 * The subject (account / rep / product) is fixed by where the dialog was opened
 * from and is stated, never chosen: a merchant pressing «حدّد هدفاً» on سارة's row
 * has already said whose target it is, and offering the choice again is how the
 * wrong person gets a target.
 */
export function TargetDialog({
  open,
  onClose,
  subject,
  month,
  metric,
  existing,
  actual,
}: {
  open: boolean;
  onClose: () => void;
  /** What the target is for, already resolved to a name and its ids. */
  subject: { name: string; repId?: string; productId?: string };
  /** `yyyy-mm` — the month a «هذا الشهر فقط» target would apply to. */
  month: string;
  metric: TargetMetric;
  /** The row the resolver found, when editing rather than creating. */
  existing: Target | null;
  /** What has been achieved so far, so the merchant sets the level against reality. */
  actual: number;
}) {
  const settings = useDataStore((s) => s.settings);
  const createTarget = useDataStore((s) => s.createTarget);
  const updateTarget = useDataStore((s) => s.updateTarget);
  const deleteTarget = useDataStore((s) => s.deleteTarget);

  const [amount, setAmount] = useState<number | null>(existing?.amount ?? null);
  const [span, setSpan] = useState<Span>(existing?.month ? "month" : "standing");
  const [busy, setBusy] = useState(false);

  const money = (n: number) =>
    metric === "units"
      ? `${n} قطعة`
      : formatCurrency(n, { currency: settings.currency, locale: settings.locale });

  const level = amount ?? 0;
  const attainment = level > 0 ? actual / level : 0;

  const onSave = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const patch = {
        metric,
        amount: level,
        month: span === "month" ? month : undefined,
        repId: subject.repId,
        productId: subject.productId,
        status: "active" as const,
      };
      if (existing) await updateTarget(existing.id, patch);
      else await createTarget(patch);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const onRemove = async () => {
    if (!existing || busy) return;
    setBusy(true);
    try {
      await deleteTarget(existing.id);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={existing ? `تعديل هدف ${subject.name}` : `هدف ${subject.name}`}
      description={`${METRIC_WORD[metric]} — ما تحقّق حتى الآن ${money(actual)}.`}
      art={
        /* The art band holds the reading the dialog acts on, not an ornament
           (R29): the dial answers «هذا الهدف بعيد كم؟» while it is being typed. */
        <div className="py-1">
          <RingGauge
            value={attainment}
            label={level > 0 ? formatPercent(attainment, { locale: settings.locale }) : "—"}
            caption={level > 0 ? "من الهدف" : "بلا هدف"}
            size={104}
            tone={level <= 0 ? "muted" : attainment >= 1 ? "success" : "accent"}
          />
        </div>
      }
      footer={
        <>
          {existing && (
            <Button variant="ghost" onClick={onRemove} disabled={busy} className="me-auto">
              إزالة الهدف
            </Button>
          )}
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            إلغاء
          </Button>
          <Button onClick={onSave} disabled={busy || level <= 0}>
            حفظ
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <Field label={`الهدف (${METRIC_WORD[metric]})`} htmlFor="target-amount">
          <Input
            id="target-amount"
            type="number"
            min={0}
            step={metric === "units" ? "1" : "1000"}
            trailing={metric === "units" ? "قطعة" : settings.currency}
            /* "" is a cleared field, not a zero: `|| ""` would erase a typed 0 and
               `parseFloat("") || 0` would silently store one (the P1 lesson). */
            value={amount ?? ""}
            onChange={(e) => {
              const raw = e.target.value;
              setAmount(raw === "" ? null : Number(raw));
            }}
          />
        </Field>

        <Field label="يسري على" htmlFor="target-span" labelsGroup>
          <Segmented
            id="target-span"
            aria-labelledby="target-span-label"
            options={SPANS}
            value={span}
            onChange={setSpan}
          />
        </Field>

        <p className="text-sm leading-relaxed text-muted">
          {span === "standing"
            ? "هدف دائم: يُقاس به كل شهر حتى تغيّره. يمكنك دائمًا استثناء شهر واحد بهدف خاص له."
            : `هدف لشهر ${month} وحده. يتقدّم على الهدف الدائم في هذا الشهر فقط، ولا يمسّ بقية الأشهر.`}
        </p>
      </div>
    </Dialog>
  );
}
