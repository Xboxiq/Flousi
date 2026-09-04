import { cn } from "@/presentation/lib/cn";

interface TickMeterProps {
  /** 0..1 — values past 1 fill the comb and are reported by the caption. */
  value: number;
  /** How many ticks the comb is cut into. */
  ticks?: number;
  /** Height of the comb in px. */
  height?: number;
  /** accent = neutral progress · success = the merchant's keep · danger = overrun */
  tone?: "accent" | "success" | "danger" | "muted";
  /** Announced to assistive tech, since the comb itself is decorative. */
  label?: string;
  className?: string;
}

const TONE: Record<NonNullable<TickMeterProps["tone"]>, string> = {
  accent: "var(--accent)",
  success: "var(--success)",
  danger: "var(--danger)",
  muted: "var(--subtle)",
};

/**
 * A share drawn as a comb of discrete ticks (RECIPES R40, fifth feedback batch):
 * filled ticks up to the value, carved empty slots for what is left.
 *
 * Two reasons this beats a smooth bar on a KPI tile: the reading QUANTISES, so
 * "eleven of twenty" is countable without a label, and the remainder is
 * structural by construction — empty slots, not a decorative gradient
 * (VISUAL-LAW §11). The tick the value lands on carries the edge detail, which
 * is where a real instrument puts it (§5).
 */
export function TickMeter({
  value,
  ticks = 20,
  height = 18,
  tone = "accent",
  label,
  className,
}: TickMeterProps) {
  const pct = Math.max(0, Math.min(1, value));
  const on = Math.round(pct * ticks);
  const filled = pct > 0 ? Math.max(1, on) : 0;

  return (
    <div
      className={cn("r-comb", className)}
      style={{ height, ["--comb-color" as string]: TONE[tone] }}
      role="img"
      aria-label={label}
    >
      {Array.from({ length: ticks }, (_, i) => (
        <span
          key={i}
          data-on={i < filled ? "true" : undefined}
          data-edge={i === filled - 1 ? "true" : undefined}
        />
      ))}
    </div>
  );
}
