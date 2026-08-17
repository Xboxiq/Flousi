import { cn } from "@/presentation/lib/cn";
import { TrendUp, TrendDown } from "@phosphor-icons/react/dist/ssr";
import { Card } from "./card";

export type StatTone = "default" | "success" | "danger";
/** Accent hues are locked to the semantic set: blue (interactive/brand),
 *  green (profit), neutral. Violet/orange were decorative — removed (MASTER §1). */
export type StatAccent = "blue" | "green" | "neutral";

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
  tone?: StatTone;
  /** Colour of the icon chip. */
  accent?: StatAccent;
  className?: string;
}

const VALUE_TONE: Record<StatTone, string> = {
  default: "text-fg",
  success: "text-success",
  danger: "text-danger",
};

const CHIP: Record<StatAccent, string> = {
  blue: "bg-accent-soft text-accent",
  green: "bg-success-soft text-success",
  neutral: "bg-surface-2 text-muted",
};

/** KPI tile: clean white card, label, large tabular value, optional trend delta. */
export function Stat({
  label,
  value,
  delta,
  deltaLabel,
  icon,
  tone = "default",
  accent = "blue",
  className,
}: StatProps) {
  const up = (delta ?? 0) >= 0;
  return (
    <Card className={cn("p-5", className)}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-muted">{label}</span>
        {icon && (
          <span
            className={cn(
              "inline-flex size-9 items-center justify-center rounded-[12px]",
              CHIP[accent],
            )}
          >
            {icon}
          </span>
        )}
      </div>
      <div
        className={cn(
          "mt-4 font-mono text-display font-bold tabular-nums",
          VALUE_TONE[tone],
        )}
      >
        <bdi dir="ltr">{value}</bdi>
      </div>
      {deltaLabel && (
        <div
          className={cn(
            "mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold",
            up ? "text-success" : "text-danger",
          )}
        >
          <span className="inline-flex items-center gap-0.5">
            {up ? <TrendUp size={14} weight="bold" /> : <TrendDown size={14} weight="bold" />}
            {deltaLabel}
          </span>
          <span className="font-medium text-subtle">مقارنة بالشهر السابق</span>
        </div>
      )}
    </Card>
  );
}
