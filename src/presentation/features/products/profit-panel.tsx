"use client";

import { useMemo } from "react";
import { TrendUp, TrendDown, Equals } from "@phosphor-icons/react";
import { ProfitCalculator, type CostBreakdown } from "@/domain";
import { MeshSurface, Money } from "@/presentation/components/ui";
import { LivingNumber } from "@/presentation/components/interactive/living-number";
import { formatCurrency, formatPercent } from "@/presentation/lib/format";
import { cn } from "@/presentation/lib/cn";

const COST_LABELS: Record<string, string> = {
  purchase: "تكلفة الشراء",
  shipping: "التوصيل",
  packaging: "التغليف",
  marketplaceFees: "رسوم المنصّة",
  paymentFees: "رسوم الدفع",
  taxes: "الضرائب",
  other: "أخرى",
};

interface Props {
  sellingPrice: number;
  costs: CostBreakdown;
  currency: string;
  locale: string;
  quantity?: number;
  className?: string;
}

type Polarity = "profit" | "loss" | "even";

/** State is carried in words + icon first; color (the mesh) reinforces it. */
const POLARITY: Record<Polarity, { word: string; icon: React.ReactNode }> = {
  profit: { word: "رابح", icon: <TrendUp size={13} weight="bold" /> },
  loss: { word: "خسارة", icon: <TrendDown size={13} weight="bold" /> },
  even: { word: "تعادل", icon: <Equals size={13} weight="bold" /> },
};

/** Instant profit results: the Living Number over quiet metric tiles. */
export function ProfitPanel({ sellingPrice, costs, currency, locale, quantity = 1, className }: Props) {
  const result = useMemo(
    () => ProfitCalculator.calculate({ sellingPrice, costs, currency, quantity }),
    [sellingPrice, costs, currency, quantity],
  );

  const money = (n: number) => formatCurrency(n, { currency, locale });
  const polarity: Polarity =
    result.netProfit > 0 ? "profit" : result.netProfit < 0 ? "loss" : "even";

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Net profit hero — signature device #1 (the Living Number) on the
          screen's single mesh moment. Loss switches to the semantic danger mesh. */}
      <MeshSurface
        variant={polarity === "loss" ? "night-danger" : "night"}
        className="rounded-[var(--radius-xl)] p-6 text-white shadow-md"
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-white/75">صافي الربح</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold">
            {POLARITY[polarity].icon}
            {POLARITY[polarity].word}
          </span>
        </div>
        <div className="mt-3 text-kpi font-semibold tracking-tight" aria-live="polite" aria-atomic="true">
          <LivingNumber value={result.netProfit} format={money} />
        </div>
        <div className="mt-2 text-sm text-white/75">
          الهامش {formatPercent(result.margin, { locale })}
        </div>
      </MeshSurface>

      {/* Metric tiles — deliberately quiet (elevation declared once) */}
      <div className="grid grid-cols-2 gap-3">
        <Metric label="الإيراد" value={money(result.revenue)} />
        <Metric label="إجمالي التكلفة" value={money(result.totalCost)} />
        <Metric label="العائد" value={formatPercent(result.roi, { locale })} />
        <Metric
          label="سعر التعادل"
          value={result.breakEvenPrice === null ? "—" : money(result.breakEvenPrice)}
        />
      </div>

      {/* Cost breakdown */}
      <div className="rounded-[var(--radius-lg)] bg-surface p-5 shadow-card">
        <span className="text-xs font-semibold text-subtle">تفصيل التكاليف</span>
        <ul className="mt-3 flex flex-col gap-2">
          {Object.entries(result.costByLine)
            .filter(([, amount]) => amount > 0)
            .map(([line, amount]) => (
              <li key={line} className="flex items-center justify-between text-sm">
                <span className="text-muted">{COST_LABELS[line] ?? line}</span>
                <Money className="text-fg">{money(amount)}</Money>
              </li>
            ))}
          {Object.values(result.costByLine).every((a) => a === 0) && (
            <li className="text-sm text-subtle">لم تُدخل أي تكاليف بعد.</li>
          )}
        </ul>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-lg)] bg-surface px-4 py-3 shadow-card">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 text-base font-semibold text-fg">
        <Money>{value}</Money>
      </div>
    </div>
  );
}
