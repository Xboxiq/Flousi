"use client";

import { useMemo } from "react";
import { TrendUp, TrendDown, Equals } from "@phosphor-icons/react";
import { ProfitCalculator, type CostBreakdown } from "@/domain";
import { Money } from "@/presentation/components/ui";
import { LivingNumber } from "@/presentation/components/interactive/living-number";
import { PriceColumn } from "@/presentation/components/objects/price-column";
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
  /** Render the price column — the panel's focal object (scene surfaces only). */
  withColumn?: boolean;
  className?: string;
}

type Polarity = "profit" | "loss" | "even";

/** State is carried in words + icon first; light and color reinforce it. */
const POLARITY: Record<Polarity, { word: string; icon: React.ReactNode }> = {
  profit: { word: "رابح", icon: <TrendUp size={13} weight="bold" /> },
  loss: { word: "خسارة", icon: <TrendDown size={13} weight="bold" /> },
  even: { word: "تعادل", icon: <Equals size={13} weight="bold" /> },
};

/**
 * The profit result as a glass object over its own light (VISUAL-LAW §1 §5 §12).
 * Polarity does not swap a class — two glow layers crossfade, so profit → loss
 * is a change in the light falling on the panel, not a repaint.
 */
export function ProfitPanel({
  sellingPrice,
  costs,
  currency,
  locale,
  quantity = 1,
  withColumn = false,
  className,
}: Props) {
  const result = useMemo(
    () => ProfitCalculator.calculate({ sellingPrice, costs, currency, quantity }),
    [sellingPrice, costs, currency, quantity],
  );

  const money = (n: number) => formatCurrency(n, { currency, locale });
  const polarity: Polarity =
    result.netProfit > 0 ? "profit" : result.netProfit < 0 ? "loss" : "even";
  const isLoss = polarity === "loss";

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div
        className="glass relative overflow-hidden rounded-[var(--radius-2xl)] px-6 pt-6 pb-6"
        data-part="focal-panel"
      >
        {/* the light this panel sits in — crossfaded, never swapped.
            Break-even is genuinely neutral: no glow at all. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 transition-opacity duration-[var(--motion-modal)] ease-[var(--ease-out)]"
          style={{
            opacity: polarity === "profit" ? 1 : 0,
            backgroundImage:
              "radial-gradient(78% 62% at 50% 118%, color-mix(in srgb, var(--success) 55%, transparent), transparent 66%)",
          }}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 transition-opacity duration-[var(--motion-modal)] ease-[var(--ease-out)]"
          style={{
            opacity: isLoss ? 1 : 0,
            backgroundImage:
              "radial-gradient(78% 62% at 50% 118%, color-mix(in srgb, var(--danger) 52%, transparent), transparent 66%)",
          }}
        />

        <div className="relative z-[1]">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted">صافي الربح</span>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
                polarity === "profit" && "bg-success-soft text-success",
                polarity === "loss" && "bg-danger-soft text-danger",
                polarity === "even" && "bg-surface-2 text-muted",
              )}
            >
              {POLARITY[polarity].icon}
              {POLARITY[polarity].word}
            </span>
          </div>

          <div
            className="mt-3 text-kpi font-semibold tracking-tight text-fg"
            aria-live="polite"
            aria-atomic="true"
          >
            <LivingNumber value={result.netProfit} format={money} />
          </div>
          <div className="mt-2 text-sm text-muted">
            الهامش {formatPercent(result.margin, { locale })}
          </div>
        </div>
      </div>

      {/* Metric tiles — clay, carved, quiet next to the focal glass */}
      <div className="grid grid-cols-2 gap-3">
        <Metric label="الإيراد" value={money(result.revenue)} />
        <Metric label="إجمالي التكلفة" value={money(result.totalCost)} />
        <Metric label="العائد" value={formatPercent(result.roi, { locale })} />
        <Metric
          label="سعر التعادل"
          value={result.breakEvenPrice === null ? "—" : money(result.breakEvenPrice)}
        />
      </div>

      {/* The focal object. It replaces the old flat cost list: the breakdown is
          the object now — each slab's height is its share of the price (§8). */}
      {withColumn ? (
        <div className="clay px-4 pt-4 pb-2" data-part="focal-object">
          <div className="flex items-baseline justify-between px-1">
            <span className="text-xs font-semibold text-subtle">من السعر إلى الربح</span>
            <span className="text-[11px] text-subtle">ارتفاع كل طبقة = حصتها</span>
          </div>
          <PriceColumn
            price={result.revenue}
            costs={Object.entries(result.costByLine).map(([line, amount]) => ({
              key: line,
              label: COST_LABELS[line] ?? line,
              amount,
            }))}
            netProfit={result.netProfit}
            format={money}
            className="mt-2"
          />
        </div>
      ) : (
        <div className="clay p-5">
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
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="clay px-4 py-3">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 text-base font-semibold text-fg">
        <Money>{value}</Money>
      </div>
    </div>
  );
}
