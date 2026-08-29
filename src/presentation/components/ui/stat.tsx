import { cn } from "@/presentation/lib/cn";
import { Card } from "./card";
import { Delta } from "./delta";
import { Money } from "./money";
import { TickMeter } from "../objects/tick-meter";

export type StatTone = "default" | "success" | "danger";
/** Accent hues are locked to the semantic set: blue (interactive/brand),
 *  green (profit), neutral. Violet/orange were decorative — removed (MASTER §1). */
export type StatAccent = "sand" | "green" | "neutral";

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
  /**
   * A share this tile also reports (0..1), drawn as a comb of ticks under the
   * figure. Only pass it when the share is a real reading, not decoration.
   */
  meter?: { value: number; label: string; tone?: "accent" | "success" | "danger" };
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
  sand: "bg-accent-soft text-accent",
  green: "bg-success-soft text-success",
  neutral: "bg-surface-2 text-muted",
};

/**
 * KPI tile: label on the top edge, the reading on the floor.
 *
 * The figure goes through `Money`, so it carries the same scale contrast as
 * every other figure in the product — whole part loud, fraction quieter, unit
 * quietest (RECIPES R41). A tile taller than its content (a matched pair beside
 * a hero) distributes instead of padding its bottom.
 */
export function Stat({
  label,
  value,
  delta,
  deltaLabel,
  caption,
  meter,
  icon,
  tone = "default",
  accent = "sand",
  className,
}: StatProps) {
  return (
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
        <Money className={cn("block text-display font-bold", VALUE_TONE[tone])}>{value}</Money>
        {meter && (
          <TickMeter
            className="mt-3"
            value={meter.value}
            label={meter.label}
            tone={meter.tone ?? "accent"}
            height={16}
            ticks={18}
          />
        )}
        {caption && <p className="mt-2 text-xs text-muted">{caption}</p>}
        {deltaLabel && (
          <Delta
            className="mt-2"
            value={delta ?? 0}
            label={deltaLabel}
            against="مقارنة بالشهر السابق"
          />
        )}
      </div>
    </Card>
  );
}
