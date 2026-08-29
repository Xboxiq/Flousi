import { cn } from "@/presentation/lib/cn";

/**
 * ═══ THE PAGE STRUCTURE ═══════════════════════════════════════════════════
 *
 * The pieces every screen in the artboards is assembled from. They exist as one
 * module rather than as per-screen markup for a reason this project has already
 * paid for: `.toolbar` was used on five boards and defined nowhere, and nothing
 * failed — the elements simply laid out as plain blocks and a 220px search box
 * spanned an entire card. A structure that lives in one file cannot be half
 * implemented on one screen and forgotten on the next.
 *
 * THE PAGE TEMPLATE
 * Every working screen is the same three bands:
 *   1  a BRIEF row — three panels, spans 6 / 3 / 3: what happened, one figure
 *      worth its own size, and the thing that needs a decision;
 *   2  a WORK panel — span 12: a toolbar (title, filters, search), the table or
 *      list itself, and a footer strip carrying the count and the export;
 *   3  nothing else. A screen that needs a fourth band is two screens.
 *
 * The dashboard is the one exception, and it earns it: its first band is a hero
 * figure at span 9 beside a decision at span 3, which is the mark's own shape —
 * blocks of descending reach with exactly one deliberately short.
 */

/* ── layout ─────────────────────────────────────────────────────────────── */

export function Grid({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("r-grid", className)}>{children}</div>;
}

type Span = 3 | 6 | 9 | 12;

/**
 * A panel: the one surface type in the system.
 *
 * `title` and `meta` produce the hairline header the boards put on every card;
 * a panel with no title is a bare surface, which is what the hero uses. There is
 * no `elevated` prop: a surface declares its height ONCE, with a lighter ground
 * on dark and a shadow on light, and a border plus a shadow on the same element
 * is the ghost card.
 */
export function Panel({
  span = 12,
  title,
  meta,
  footer,
  bare = false,
  accent = false,
  className,
  bodyClassName,
  children,
}: {
  span?: Span;
  title?: React.ReactNode;
  /** Drawn at the end of the header: a badge, a total, a filter. */
  meta?: React.ReactNode;
  footer?: React.ReactNode;
  /** Skip the body padding — for a panel whose child is a table or a row list. */
  bare?: boolean;
  /** The one panel on a screen that is asking for a decision. */
  accent?: boolean;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("r-card", `span-${span}`, accent && "is-accent", className)}>
      {title !== undefined && (
        <header>
          <h2>{title}</h2>
          {meta !== undefined && <div className="ms-auto flex items-center gap-2">{meta}</div>}
        </header>
      )}
      <div className={cn(bare ? "r-bare" : "r-body", bodyClassName)}>{children}</div>
      {footer !== undefined && <footer>{footer}</footer>}
    </section>
  );
}

/** The strip above a table or a list: title, filters, search, one action. */
export function Toolbar({
  title,
  children,
  className,
}: {
  title?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("r-toolbar", className)}>
      {title !== undefined && <h2>{title}</h2>}
      {children}
    </div>
  );
}

/* ── figures ────────────────────────────────────────────────────────────── */

/**
 * The financial hierarchy, and it is the same on every surface in the product:
 *     amount → label → period → comparison → trend
 *
 * The amount is the largest thing in its container and the only thing set in
 * the Latin face. The currency word is Arabic and sits OUTSIDE the figure's LTR
 * isolate, or it lays out as part of a Latin run and cramps the last digit.
 */
export function Metric({
  amount,
  unit,
  name,
  size = "md",
  className,
  children,
}: {
  amount: string;
  unit?: string;
  name?: string;
  size?: "sm" | "md" | "lead";
  className?: string;
  /** The comparison line, under the label. */
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "r-metric",
        size === "lead" && "is-lead",
        size === "sm" && "is-small",
        className,
      )}
    >
      <div className="headline">
        <bdi className="amount">{amount}</bdi>
        {unit && <span className="unit">{unit}</span>}
      </div>
      {name && <span className="name">{name}</span>}
      {children}
    </div>
  );
}

/** Direction of money, stated twice: in the colour and in the glyph. */
export function Trend({ ratio, suffix }: { ratio: number | undefined; suffix?: string }) {
  if (ratio === undefined || !Number.isFinite(ratio)) return null;
  const dir = ratio > 0.0005 ? "up" : ratio < -0.0005 ? "down" : "flat";
  const glyph = dir === "up" ? "▲" : dir === "down" ? "▼" : "—";
  const tone = dir === "up" ? "text-success" : dir === "down" ? "text-danger" : "text-subtle";
  const pct = `${Math.abs(ratio * 100).toFixed(1)}%`;
  return (
    <span className={cn("inline-flex items-center gap-1 text-[11px] font-bold", tone)}>
      <span aria-hidden className="text-[8px]">
        {glyph}
      </span>
      <bdi className="r-num">{pct}</bdi>
      {suffix && <span className="font-normal text-subtle">{suffix}</span>}
    </span>
  );
}

/* ── charts ─────────────────────────────────────────────────────────────── */

export interface Slice {
  key: string;
  label: string;
  value: number;
  /** 1..4 — the chart band. Each band ships the ink that survives on it. */
  series: 1 | 2 | 3 | 4;
}

/**
 * Where a whole went. A part-of-whole bar, labelled IN PLACE: there is no legend
 * that makes the eye look away from the shape to find out what it is.
 *
 * A share under 6% gets no label inside it — a percentage rendered into 20px of
 * bar is a smear, and the legend under the bar already carries the figure.
 */
export function SplitBar({ slices, total }: { slices: Slice[]; total: number }) {
  const safe = total > 0 ? total : 1;
  return (
    <div className="r-splitbar" role="img" aria-label={slices.map((s) => s.label).join("، ")}>
      {slices
        .filter((s) => s.value > 0)
        .map((s) => {
          const share = s.value / safe;
          return (
            <span
              key={s.key}
              style={{
                flex: `${share} 0 0`,
                background: `var(--series-${s.series})`,
                color: `var(--on-series-${s.series})`,
              }}
            >
              {share >= 0.06 ? `${Math.round(share * 100)}%` : ""}
            </span>
          );
        })}
    </div>
  );
}

/** The bar's key, as rows: a swatch, the name, and the figure it stands for. */
export function SplitKey({
  slices,
  format,
}: {
  slices: Slice[];
  format: (value: number) => string;
}) {
  return (
    <ul className="mt-3 flex flex-col">
      {slices.map((s) => (
        <li
          key={s.key}
          className="flex items-center gap-3 border-b border-line py-2 last:border-b-0"
        >
          <i
            aria-hidden
            className="size-2 flex-none rounded-[2px]"
            style={{ background: `var(--series-${s.series})` }}
          />
          <span className="flex-1 truncate text-[13px] text-muted">{s.label}</span>
          <bdi className="r-num text-[13px] font-medium text-fg">{format(s.value)}</bdi>
        </li>
      ))}
    </ul>
  );
}

/** Ordered comparison: who earned what. Name, track, figure — one row each. */
export function HBar({
  label,
  value,
  max,
  display,
  series = 1,
  note,
}: {
  label: React.ReactNode;
  value: number;
  max: number;
  display: string;
  series?: 1 | 2 | 3 | 4;
  note?: React.ReactNode;
}) {
  const share = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  return (
    <div className="r-hbar">
      <span className="head">
        <span className="truncate text-[13px] font-bold text-fg">{label}</span>
        <bdi className="v text-fg">{display}</bdi>
      </span>
      <span className="track">
        <i className="fill" style={{ width: `${share * 100}%`, background: `var(--series-${series})` }} />
      </span>
      {note && <span className="text-[10px] text-subtle">{note}</span>}
    </div>
  );
}

/**
 * The shape of a window: one bar per day, tallest day at full height.
 *
 * Deliberately axis-free. It answers «was the month steady or was it two good
 * days», which needs proportion and nothing else; a y-axis on a 100px plot is
 * four labels nobody reads. The one figure that matters — the best day — is
 * written underneath in words.
 */
export function Sparkbars({
  points,
  height = 84,
  label,
}: {
  points: { key: string; value: number }[];
  height?: number;
  label: string;
}) {
  const max = points.reduce((m, p) => Math.max(m, p.value), 0);
  return (
    <div
      className="r-inset flex items-end gap-[2px] p-3"
      style={{ height }}
      role="img"
      aria-label={label}
    >
      {points.map((p) => {
        const h = max > 0 ? Math.max(2, (p.value / max) * 100) : 2;
        return (
          <i
            key={p.key}
            className="min-w-[3px] flex-1 rounded-[1px]"
            style={{
              height: `${h}%`,
              background: p.value >= max ? "var(--series-1)" : "var(--series-2)",
            }}
          />
        );
      })}
    </div>
  );
}

/** Progress to a number. Set, never animated: a bar that grows on load delays
 *  the figure beside it for nothing. */
export function Progress({ share, thin = false }: { share: number; thin?: boolean }) {
  const pct = Math.max(0, Math.min(1, share)) * 100;
  return (
    <div className={cn("r-progress", thin && "is-thin")}>
      <i style={{ width: `${pct}%` }} />
    </div>
  );
}

/* ── status ─────────────────────────────────────────────────────────────── */

export type Tone = "neutral" | "success" | "info" | "warning" | "danger" | "accent";

/** A status is a word plus a shape, never a colour alone. */
export function Chip({
  tone = "neutral",
  dot = true,
  children,
  className,
}: {
  tone?: Tone;
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("r-badge", tone !== "neutral" && `is-${tone}`, !dot && "no-dot", className)}>
      {children}
    </span>
  );
}
