"use client";

import { cn } from "@/presentation/lib/cn";

export interface DistributionPart {
  /** Stable key. */
  id: string;
  /** Arabic name of the part. */
  label: string;
  /** Amount in major units, already positive. */
  amount: number;
  /** "spend" = a milled plate · "keep" = the merchant's own · "overrun" = past the price. */
  kind: "spend" | "keep" | "overrun";
  /** What the part contains, when its label is a grouping ("بنود أخرى"). */
  hint?: string;
}

interface Props {
  parts: DistributionPart[];
  /** The whole the parts divide. Parts must sum to it. */
  total: number;
  /**
   * A losing month: the tail of the bar that revenue never covered. Drawn as a
   * hatched region ACROSS the plates it swallowed — not as an extra part, which
   * would push the bar past its own whole (VISUAL-LAW §11).
   */
  overrun?: { amount: number; label: string };
  /** Formats an amount for the legend. */
  format: (n: number) => string;
  /** Formats a share (0..1) for the ruler. */
  formatShare: (n: number) => string;
  className?: string;
}

/**
 * The plate ramp lives in CSS (`--plate-N` + its own `--plate-ink-N`) so the
 * metal can be re-lit for the dark room without this component knowing.
 */
const PLATE_COUNT = 6;
/* Ordered so neighbouring plates never share a hatch direction — two diagonals
   side by side read as one striped block with a kink in it. */
const TEXTURES = ["seg-solid", "seg-dots", "seg-hatch", "seg-grid", "seg-dense", "seg-dots"];

function plateFor(part: DistributionPart, spendIndex: number) {
  if (part.kind === "keep") {
    return { color: "var(--success)", texture: "seg-solid", ink: "rgba(255,255,255,0.5)" };
  }
  if (part.kind === "overrun") {
    return { color: "var(--danger)", texture: "seg-overrun", ink: "rgba(255,255,255,0.5)" };
  }
  const i = Math.min(spendIndex, PLATE_COUNT - 1);
  return { color: `var(--plate-${i + 1})`, texture: TEXTURES[i], ink: `var(--plate-ink-${i + 1})` };
}

/**
 * «وين راح المال» — one month's revenue taken apart as a single measured bar
 * (RECIPES R36, from the fourth feedback batch).
 *
 * Every part is the same milled plate under the same overhead light; texture and
 * the occluded seam tell them apart, so hue stays reserved for meaning — the only
 * coloured plate is the one the merchant keeps (VISUAL-LAW §5 §13). A scribe ruler
 * under the bar drops a tick at each boundary, and the legend names each part with
 * its amount, so the composition reads bar → ruler → legend down one axis.
 */
export function DistributionBar({
  parts,
  total,
  overrun,
  format,
  formatShare,
  className,
}: Props) {
  const whole = total > 0 ? total : 1;
  // A real spend that rounds to zero must not be printed as "0%" — it happened,
  // it was just small.
  const pct = (share: number) => (share > 0 && share < 0.005 ? "<1%" : formatShare(share));
  const overrunShare = overrun && overrun.amount > 0 ? overrun.amount / whole : 0;
  const rows = parts.map((part, i) => {
    // Which spend plate this is: the ramp walks graphite → silver in order.
    const spendIndex = parts.slice(0, i + 1).filter((p) => p.kind === "spend").length - 1;
    return { part, plate: plateFor(part, spendIndex), share: part.amount / whole };
  });

  // Boundaries for the ruler — the running edge of every part but the last.
  const boundaries: { at: number; share: number }[] = [];
  let running = 0;
  rows.forEach((row, i) => {
    running += row.share;
    if (i < rows.length - 1) boundaries.push({ at: running, share: row.share });
  });

  return (
    <div className={cn("flex flex-col", className)} data-part="distribution">
      <div className="dist-track h-7" role="img" aria-label="توزيع إيراد الشهر">
        {rows.map(({ part, plate, share }) => (
          <div
            key={part.id}
            className={cn("dist-seg", plate.texture, part.kind === "keep" && "seg-keep")}
            style={
              {
                width: `${share * 100}%`,
                backgroundColor: plate.color,
                "--seg-ink": plate.ink,
              } as React.CSSProperties
            }
            title={`${part.hint ?? part.label}: ${format(part.amount)}`}
          />
        ))}
        {overrunShare > 0 && (
          <span
            className="seg-overrun-region"
            style={{ width: `${Math.min(overrunShare, 1) * 100}%` }}
            title={`${overrun?.label}: ${format(overrun?.amount ?? 0)}`}
          />
        )}
      </div>

      {/* the ruler: a tick at each boundary, its share written beside it */}
      <div className="relative mt-0 h-5">
        {boundaries.map((b, i) => (
          <span key={i} className="dist-tick" style={{ insetInlineStart: `${b.at * 100}%` }} />
        ))}
        {rows.map(({ part, share }, i) => {
          // Only shares wide enough to hold their own label are written here;
          // the legend below carries every part regardless.
          if (share < 0.09) return null;
          const start = rows.slice(0, i).reduce((s, r) => s + r.share, 0);
          return (
            <span
              key={part.id}
              /* a zero-width centring box: `translateX(-50%)` would offset the
                 label by its own width once the axis is mirrored */
              className="absolute top-[9px] flex w-0 justify-center"
              style={{ insetInlineStart: `${(start + share / 2) * 100}%` }}
            >
              <bdi
                dir="ltr"
                className="font-mono text-[10px] font-semibold tabular-nums whitespace-nowrap text-muted"
              >
                {pct(share)}
              </bdi>
            </span>
          );
        })}
      </div>

      <ul className="mt-2 grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map(({ part, plate, share }) => (
          <li key={part.id} className="flex items-center gap-2 text-[13px]">
            <span
              className={cn("dist-chip size-3.5 shrink-0", plate.texture)}
              style={
                { backgroundColor: plate.color, "--seg-ink": plate.ink } as React.CSSProperties
              }
            />
            <span className="min-w-0 flex-1 truncate text-muted" title={part.hint ?? part.label}>
              {part.label}
            </span>
            <bdi
              dir="ltr"
              className={cn(
                "font-mono text-[12px] tabular-nums",
                part.kind === "keep"
                  ? "font-bold text-success"
                  : part.kind === "overrun"
                    ? "font-bold text-danger"
                    : "text-fg",
              )}
            >
              {format(part.amount)}
            </bdi>
            <span className="w-10 shrink-0 text-end text-[11px] text-subtle">
              <bdi dir="ltr" className="font-mono tabular-nums">
                {pct(share)}
              </bdi>
            </span>
          </li>
        ))}
        {overrunShare > 0 && overrun && (
          <li className="flex items-center gap-2 text-[13px]">
            <span className="dist-chip seg-overrun size-3.5 shrink-0 bg-danger" />
            <span className="min-w-0 flex-1 truncate text-muted">{overrun.label}</span>
            <bdi dir="ltr" className="font-mono text-[12px] font-bold tabular-nums text-danger">
              {format(overrun.amount)}
            </bdi>
            <span className="w-10 shrink-0 text-end text-[11px] text-subtle">
              <bdi dir="ltr" className="font-mono tabular-nums">
                {pct(overrunShare)}
              </bdi>
            </span>
          </li>
        )}
      </ul>
    </div>
  );
}
