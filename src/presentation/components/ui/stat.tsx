import { cn } from "@/presentation/lib/cn";
import { TrendUp, TrendDown } from "@phosphor-icons/react/dist/ssr";
import { Card } from "./card";

export interface StatProps {
  label: string;
  /** Pre-formatted primary value (currency/number/percent). */
  value: string;
  /** Optional delta vs previous period, as a ratio (0.12 = +12%). */
  delta?: number;
  /** Formatted delta label, e.g. "+12.4%". */
  deltaLabel?: string;
  icon?: React.ReactNode;
  /** Force value color (e.g. profit positive/negative). */
  tone?: "default" | "success" | "danger";
  className?: string;
}

const VALUE_TONE = {
  default: "text-fg",
  success: "text-success",
  danger: "text-danger",
} as const;

/** KPI tile: soft surface, label, large tabular value, optional trend delta. */
export function Stat({
  label,
  value,
  delta,
  deltaLabel,
  icon,
  tone = "default",
  className,
}: StatProps) {
  const up = (delta ?? 0) >= 0;
  return (
    <Card className={cn("p-5", className)}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-muted">{label}</span>
        {icon && (
          <span className="neu-raised-sm inline-flex size-9 items-center justify-center rounded-full bg-surface text-accent">
            {icon}
          </span>
        )}
      </div>
      <div
        className={cn(
          "mt-4 font-mono text-[26px] font-semibold leading-none tracking-tight tabular-nums",
          VALUE_TONE[tone],
        )}
      >
        {value}
      </div>
      {deltaLabel && (
        <div
          className={cn(
            "mt-2.5 inline-flex items-center gap-1 text-xs font-medium",
            up ? "text-success" : "text-danger",
          )}
        >
          {up ? <TrendUp size={14} weight="bold" /> : <TrendDown size={14} weight="bold" />}
          {deltaLabel}
          <span className="text-subtle">vs last period</span>
        </div>
      )}
    </Card>
  );
}
