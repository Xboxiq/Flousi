import { cn } from "@/presentation/lib/cn";

export interface RingValue {
  label: string;
  value: number;
  /** revenue = neutral ring · cost = graphite · keep = success */
  kind: "whole" | "cost" | "keep";
}

interface Props {
  rings: RingValue[];
  size?: number;
  format: (n: number) => string;
  className?: string;
}

const STROKE: Record<RingValue["kind"], string> = {
  whole: "var(--plate-3)",
  cost: "var(--plate-1)",
  keep: "var(--success)",
};
const FILL: Record<RingValue["kind"], number> = { whole: 0.1, cost: 0.16, keep: 0.2 };

/**
 * Nested magnitude rings (RECIPES R47, fifth feedback batch — the coral
 * dashboard's "Annual profits"): each value is a circle whose AREA carries it
 * (radius ∝ √value), nested on a shared floor so the bands stay readable.
 *
 * Legitimate ONLY because these quantities genuinely contain one another —
 * revenue holds costs, costs hold nothing of profit — so the eye's "this sits
 * inside that" is the true sentence. For a partition of one whole the
 * DistributionBar is the honest instrument instead. Negative values cannot be an
 * area: a losing month draws revenue inside costs (the true containment) and the
 * caption carries the loss.
 */
export function MagnitudeRings({ rings, size = 148, format, className }: Props) {
  const drawable = rings.filter((r) => r.value > 0);
  if (drawable.length === 0) return null;
  const sorted = [...drawable].sort((a, b) => b.value - a.value);

  const maxR = size / 2 - 2;
  const scale = maxR / Math.sqrt(sorted[0].value);
  const floor = size - 2;

  return (
    <div className={cn("flex items-center gap-4", className)} data-part="magnitude-rings">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        {sorted.map((r) => {
          const radius = Math.max(9, Math.sqrt(r.value) * scale);
          return (
            <g key={r.label}>
              {/* bottom-tangent nesting: every circle stands on the same floor,
                  so each ring's top band stays exposed and readable */}
              <circle
                cx={size / 2}
                cy={floor - radius}
                r={radius}
                fill={STROKE[r.kind]}
                fillOpacity={FILL[r.kind]}
                stroke={STROKE[r.kind]}
                strokeWidth={r.kind === "keep" ? 2 : 1.25}
              />
            </g>
          );
        })}
      </svg>
      <ul className="flex flex-col gap-1.5">
        {sorted.map((r) => (
          <li key={r.label} className="flex items-center gap-2 text-[12px]">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{
                backgroundColor: STROKE[r.kind],
                opacity: r.kind === "keep" ? 1 : 0.75,
              }}
            />
            <span className="text-muted">{r.label}</span>
            <bdi
              dir="ltr"
              className={cn(
                "ms-auto font-mono text-[11px] tabular-nums",
                r.kind === "keep" ? "font-bold text-success" : "text-fg",
              )}
            >
              {format(r.value)}
            </bdi>
          </li>
        ))}
      </ul>
    </div>
  );
}
