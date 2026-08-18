import { cn } from "@/presentation/lib/cn";

interface SparklineProps {
  /** Series oldest → newest. Empty months are zeros, so rows stay comparable. */
  values: number[];
  width?: number;
  height?: number;
  /** Announced to assistive tech; the drawing itself is aria-hidden. */
  label?: string;
  /**
   * "polarity" (default) reads the window's net sign as profit or loss — correct
   * for a product's own profit trend. "neutral" is for a series that is not a
   * profit at all (a rep's earned share, a volume count): those are always
   * positive by construction, so painting them success would spend the colour on
   * a fact rather than on a meaning (VISUAL-LAW §13).
   */
  tone?: "polarity" | "neutral";
  className?: string;
}

/**
 * A row's trend as one drawn line (RECIPES R27, second feedback batch).
 *
 * Pure SVG, never animated — this is data being read in a table, not a reveal.
 * The line's colour is code, not decor (§13): the window's NET sign picks
 * success/danger, and an all-zero history stays subtle. When the series crosses
 * zero, the zero line is drawn as a dashed hairline — the crossing is the story.
 * The newest point carries the only marker: a disc with a surface collar, the
 * same grammar as the chart's active dot (R34).
 */
export function Sparkline({
  values,
  width = 96,
  height = 26,
  label,
  tone = "polarity",
  className,
}: SparklineProps) {
  const n = values.length;
  if (n < 2) return null;

  const max = Math.max(...values, 0);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  const padY = 3;
  const x = (i: number) => (i / (n - 1)) * (width - 6) + 3;
  const y = (v: number) => padY + (1 - (v - min) / span) * (height - padY * 2);

  const total = values.reduce((s, v) => s + v, 0);
  const allZero = values.every((v) => v === 0);
  const color =
    allZero || tone === "neutral"
      ? "var(--subtle)"
      : total >= 0
        ? "var(--success)"
        : "var(--danger)";
  const crossesZero = min < 0 && max > 0;

  const points = values.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  const lastX = x(n - 1);
  const lastY = y(values[n - 1]);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("shrink-0 overflow-visible", className)}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {crossesZero && (
        <line
          x1={3}
          x2={width - 3}
          y1={y(0)}
          y2={y(0)}
          stroke="var(--border)"
          strokeWidth={1}
          strokeDasharray="2 3"
        />
      )}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lastX} cy={lastY} r={3.4} fill={color} stroke="var(--surface)" strokeWidth={2} />
    </svg>
  );
}
