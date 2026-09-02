"use client";

import { useMemo } from "react";
import { TrendUp, TrendDown, Equals } from "@phosphor-icons/react";
import { ProfitCalculator, type CostBreakdown, type CostLine } from "@/domain";
import { Money } from "@/presentation/components/ui";
import { PriceColumn } from "@/presentation/components/objects/price-column";
import { formatCurrency, formatPercent } from "@/presentation/lib/format";
import { cn } from "@/presentation/lib/cn";
import { LivingNumber } from "@/presentation/components/interactive/living-number";
import { COST_LINE_LABELS } from "@/presentation/lib/labels";

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
      {/* The instrument: a moulded body with the counter sunk into it. */}
      <div className="r-slab relative px-5 pt-4 pb-5" data-part="focal-panel">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted">صافي الربح</span>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
              polarity === "profit" && "bg-success-soft text-success",
              polarity === "loss" && "bg-danger-soft text-danger",
              polarity === "even" && "bg-surface-2 text-muted",
            )}
          >
            {/* Second channel only: the WORD beside it already says which way the
                money went, and this agrees with it. It was a lamp with a coloured
                glow halo — an emitted light, which is the one thing a flat plate
                cannot have. */}
            <span
              aria-hidden
              className={cn(
                "size-[7px] rounded-full",
                polarity === "profit" && "bg-success",
                polarity === "loss" && "bg-danger",
                polarity === "even" && "bg-subtle",
              )}
            />
            {POLARITY[polarity].word}
          </span>
        </div>

        {/* the drum bay: figures roll inside the housing, behind its glass */}
        <div
          className="r-inset mt-3 overflow-hidden px-4 py-3.5"
          data-part="display"
          aria-live="polite"
          aria-atomic="true"
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 transition-opacity duration-[var(--motion-modal)] ease-[var(--ease-out)]"
            style={{
              opacity: polarity === "even" ? 0 : 1,
              backgroundImage: `radial-gradient(88% 120% at 50% 128%, color-mix(in srgb, ${
                isLoss ? "var(--danger)" : "var(--success)"
              } 40%, transparent), transparent 70%)`,
            }}
          />
          {/* It was an Odometer: ten digit glyphs rendered per drum for a rolling
              illusion, so a seven-figure amount put seventy characters into the
              DOM — which is also what blinded the density gate once. The figure is
              the content; LivingNumber glides it to its new value and stops. */}
          <LivingNumber
            value={result.netProfit}
            format={money}
            className={cn(
              "relative text-[38px] font-semibold leading-none",
              polarity === "profit" && "text-success",
              polarity === "loss" && "text-danger",
              polarity === "even" && "text-muted",
            )}
          />
        </div>

        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-muted">
            الهامش <bdi dir="ltr" className="font-figure tabular-nums text-fg">{formatPercent(result.margin, { locale })}</bdi>
          </span>
          <span className="text-subtle text-xs">لكل وحدة مبيعة</span>
        </div>
      </div>

      {/* Metric tiles — carved, quiet next to the instrument */}
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
        <div className="r-inset px-4 pt-4 pb-2" data-part="focal-object">
          <div className="flex items-baseline justify-between px-1">
            <span className="text-xs font-semibold text-subtle">من السعر إلى الربح</span>
            <span className="text-[11px] text-subtle">ارتفاع كل طبقة = حصتها</span>
          </div>
          <PriceColumn
            price={result.revenue}
            costs={Object.entries(result.costByLine).map(([line, amount]) => ({
              key: line,
              label: COST_LINE_LABELS[line as CostLine] ?? line,
              amount,
            }))}
            netProfit={result.netProfit}
            format={money}
            className="mt-2"
          />
        </div>
      ) : (
        <div className="r-inset p-5">
          <span className="text-xs font-semibold text-subtle">تفصيل التكاليف</span>
          <ul className="mt-3 flex flex-col gap-2">
            {Object.entries(result.costByLine)
              .filter(([, amount]) => amount > 0)
              .map(([line, amount]) => (
                <li key={line} className="flex items-center justify-between text-sm">
                  <span className="text-muted">{COST_LINE_LABELS[line as CostLine] ?? line}</span>
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
    <div className="r-inset px-4 py-3">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 text-base font-semibold text-fg">
        <Money>{value}</Money>
      </div>
    </div>
  );
}
