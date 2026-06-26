"use client";

import { useMemo } from "react";
import { ProfitCalculator, type CostBreakdown } from "@/domain";
import { Badge } from "@/presentation/components/ui";
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

/** Instant profit results: revenue, cost, net profit, margin, ROI, break-even. */
export function ProfitPanel({ sellingPrice, costs, currency, locale, quantity = 1, className }: Props) {
  const result = useMemo(
    () => ProfitCalculator.calculate({ sellingPrice, costs, currency, quantity }),
    [sellingPrice, costs, currency, quantity],
  );

  const money = (n: number) => formatCurrency(n, { currency, locale });
  const positive = result.netProfit >= 0;

  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] border border-border bg-surface shadow-sm",
        className,
      )}
    >
      <div className="border-b border-border px-5 py-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted">Net profit</span>
          <Badge tone={positive ? "success" : "danger"} dot>
            {positive ? "Profitable" : "Loss"}
          </Badge>
        </div>
        <div
          className={cn(
            "mt-1 font-mono text-3xl font-semibold tabular-nums",
            positive ? "text-success" : "text-danger",
          )}
        >
          {money(result.netProfit)}
        </div>
        <div className="mt-1 text-sm text-muted">
          Margin {formatPercent(result.margin, { locale })}
        </div>
      </div>

      <dl className="grid grid-cols-2 divide-x divide-y divide-border">
        <Metric label="Revenue" value={money(result.revenue)} />
        <Metric label="Total cost" value={money(result.totalCost)} />
        <Metric label="ROI" value={formatPercent(result.roi, { locale })} />
        <Metric
          label="Break-even price"
          value={result.breakEvenPrice === null ? "—" : money(result.breakEvenPrice)}
        />
      </dl>

      <div className="px-5 py-4">
        <span className="text-xs font-medium uppercase tracking-wide text-subtle">
          Cost breakdown
        </span>
        <ul className="mt-2 flex flex-col gap-1.5">
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
    <div className="px-5 py-3">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 font-mono text-sm font-medium tabular-nums text-fg">{value}</dd>
    </div>
  );
}
