"use client";

import { useMemo } from "react";
import { TrendUp, TrendDown } from "@phosphor-icons/react";
import { ProfitCalculator, type CostBreakdown } from "@/domain";
import { MeshSurface } from "@/presentation/components/ui";
import { formatCurrency, formatPercent } from "@/presentation/lib/format";
import { cn } from "@/presentation/lib/cn";

const COST_LABELS: Record<string, string> = {
  purchase: "Purchase cost",
  shipping: "Shipping",
  packaging: "Packaging",
  marketplaceFees: "Marketplace fees",
  paymentFees: "Payment fees",
  taxes: "Taxes",
  other: "Other",
};

interface Props {
  sellingPrice: number;
  costs: CostBreakdown;
  currency: string;
  locale: string;
  quantity?: number;
  className?: string;
}

/** Instant profit results: a grainient net-profit hero over soft metric tiles. */
export function ProfitPanel({ sellingPrice, costs, currency, locale, quantity = 1, className }: Props) {
  const result = useMemo(
    () => ProfitCalculator.calculate({ sellingPrice, costs, currency, quantity }),
    [sellingPrice, costs, currency, quantity],
  );

  const money = (n: number) => formatCurrency(n, { currency, locale });
  const positive = result.netProfit >= 0;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Net profit hero */}
      <MeshSurface
        variant={positive ? "night" : "night-rose"}
        className="rounded-[var(--radius-xl)] p-6 text-white shadow-md"
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-white/75">Net profit</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold backdrop-blur-sm">
            {positive ? <TrendUp size={13} weight="bold" /> : <TrendDown size={13} weight="bold" />}
            {positive ? "Profitable" : "Loss"}
          </span>
        </div>
        <div className="mt-3 font-mono text-[40px] font-semibold leading-none tracking-tight tabular-nums">
          {money(result.netProfit)}
        </div>
        <div className="mt-2 text-sm text-white/75">
          Margin {formatPercent(result.margin, { locale })}
        </div>
      </MeshSurface>

      {/* Metric tiles */}
      <div className="grid grid-cols-2 gap-3">
        <Metric label="Revenue" value={money(result.revenue)} />
        <Metric label="Total cost" value={money(result.totalCost)} />
        <Metric label="ROI" value={formatPercent(result.roi, { locale })} />
        <Metric
          label="Break-even price"
          value={result.breakEvenPrice === null ? "—" : money(result.breakEvenPrice)}
        />
      </div>

      {/* Cost breakdown */}
      <div className="rounded-[var(--radius-lg)] border border-border-soft bg-surface p-5 shadow-sm">
        <span className="text-xs font-semibold uppercase tracking-wide text-subtle">Cost breakdown</span>
        <ul className="mt-3 flex flex-col gap-2">
          {Object.entries(result.costByLine)
            .filter(([, amount]) => amount > 0)
            .map(([line, amount]) => (
              <li key={line} className="flex items-center justify-between text-sm">
                <span className="text-muted">{COST_LABELS[line] ?? line}</span>
                <span className="font-mono tabular-nums text-fg">{money(amount)}</span>
              </li>
            ))}
          {Object.values(result.costByLine).every((a) => a === 0) && (
            <li className="text-sm text-subtle">No costs entered yet.</li>
          )}
        </ul>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-border-soft bg-surface px-4 py-3 shadow-sm">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 font-mono text-base font-semibold tabular-nums text-fg">{value}</div>
    </div>
  );
}
