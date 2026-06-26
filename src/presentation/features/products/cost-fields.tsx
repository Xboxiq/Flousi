"use client";

import { COST_LINES, type CostBreakdown, type CostLine } from "@/domain";
import { Input } from "@/presentation/components/ui";

const LABELS: Record<CostLine, string> = {
  purchase: "Purchase cost",
  shipping: "Shipping",
  packaging: "Packaging",
  marketplaceFees: "Marketplace fees",
  paymentFees: "Payment fees",
  taxes: "Taxes",
  other: "Other",
};

interface Props {
  costs: CostBreakdown;
  currencySymbol: string;
  onChange: (line: CostLine, field: "fixed" | "percent", value: number) => void;
}

/** The seven cost lines, each editable as a fixed amount and/or a percentage. */
export function CostFields({ costs, currencySymbol, onChange }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <div className="hidden grid-cols-[1fr_120px_120px] gap-3 px-1 text-xs font-medium uppercase tracking-wide text-subtle sm:grid">
        <span>Cost line</span>
        <span>Fixed</span>
        <span>Percent</span>
      </div>
      {COST_LINES.map((line) => (
        <div key={line} className="grid grid-cols-2 gap-3 sm:grid-cols-[1fr_120px_120px] sm:items-center">
          <label className="col-span-2 text-sm font-medium text-fg sm:col-span-1" htmlFor={`${line}-fixed`}>
            {LABELS[line]}
          </label>
          <Input
            id={`${line}-fixed`}
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            leading={currencySymbol}
            value={costs[line].fixed || ""}
            placeholder="0.00"
            onChange={(e) => onChange(line, "fixed", parseFloat(e.target.value) || 0)}
          />
          <Input
            id={`${line}-percent`}
            type="number"
            inputMode="decimal"
            min={0}
            step="0.1"
            trailing="%"
            value={costs[line].percent || ""}
            placeholder="0"
            onChange={(e) => onChange(line, "percent", parseFloat(e.target.value) || 0)}
          />
        </div>
      ))}
    </div>
  );
}
