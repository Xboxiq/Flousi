"use client";

import { cn } from "@/presentation/lib/cn";

interface RingGaugeProps {
  /** 0..1 — clamped. Values past 1 fill the ring and are reported by the label. */
  value: number;
  /** Text struck in the middle (already formatted). */
  label: string;
  /** Small caption under the label. */
  caption?: string;
  size?: number;
  /** success = on target · accent = neutral progress · danger = shortfall */
  tone?: "success" | "accent" | "danger" | "muted";
  className?: string;
}

const TONE: Record<NonNullable<RingGaugeProps["tone"]>, string> = {
  success: "var(--success)",
  accent: "var(--accent)",
  danger: "var(--danger)",
  muted: "var(--subtle)",
};

/**
 * A dial, not a pie: the unfilled arc is a carved track (its hatch says "this
 * is what remains", VISUAL-LAW §11), the filled arc sits above it with a round
 * cap, and the figure is struck in the middle of the housing.
 *
 * SVG so the arc has a real cap and stays crisp at any size; the ring reads
 * identically in RTL because a dial has no direction.
 */
export function RingGauge({
  value,
  label,
  caption,
  size = 88,
  tone = "success",
  className,
}: RingGaugeProps) {
  const pct = Math.max(0, Math.min(1, value));
  // A round cap on a zero-length arc leaves a floating dot that reads as a bug:
  // at or below zero the dial simply has no arc, and the hatched track is the
  // whole reading.
  const hasArc = pct > 0.002;
  const stroke = Math.max(7, Math.round(size * 0.1));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const color = TONE[tone];

  return (
    <div
      className={cn("relative shrink-0", className)}
      style={{ width: size, height: size }}
      data-part="gauge"
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <defs>
          {/* the remainder is data: a hatch, never a soft gradient */}
          <pattern
            id="gauge-hatch"
            width="4"
            height="4"
            patternTransform="rotate(45)"
            patternUnits="userSpaceOnUse"
          >
            <line x1="0" y1="0" x2="0" y2="4" stroke="var(--subtle)" strokeWidth="1.6" />
          </pattern>
        </defs>
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--sunken)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="url(#gauge-hatch)"
            strokeWidth={stroke}
            opacity="0.95"
          />
          {hasArc && (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={color}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={`${c * pct} ${c}`}
              style={{
                filter: `drop-shadow(0 2px 5px color-mix(in srgb, ${color} 45%, transparent))`,
              }}
            />
          )}
        </g>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <bdi
          dir="ltr"
          className={cn(
            "font-figure text-[15px] font-bold leading-none tabular-nums",
            tone === "danger" ? "text-danger" : "text-fg",
          )}
        >
          {label}
        </bdi>
        {caption && (
          <span className="mt-1 text-[10px] leading-none font-medium text-muted">{caption}</span>
        )}
      </div>
    </div>
  );
}
