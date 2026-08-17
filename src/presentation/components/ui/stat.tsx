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
  /** A quiet second reading under the value (e.g. its share of revenue). */
  caption?: React.ReactNode;
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
  caption,
  icon,
  tone = "default",
  accent = "blue",
  className,
}: StatProps) {
  const up = (delta ?? 0) >= 0;
  return (
    /* A tile that is taller than its content (a matched pair beside a hero, say)
       distributes: the label rides the top edge, the reading sits on the floor. */
    <Card className={cn("flex flex-col justify-between gap-3 p-5", className)}>
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
      <div>
        <div className={cn("font-mono text-display font-bold tabular-nums", VALUE_TONE[tone])}>
          <bdi dir="ltr">{value}</bdi>
        </div>
        {caption && <p className="mt-2 text-xs text-muted">{caption}</p>}
        {deltaLabel && (
          <div
            className={cn(
              "mt-2 inline-flex items-center gap-1.5 text-xs font-semibold",
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
      </div>
    </Card>
  );
}
