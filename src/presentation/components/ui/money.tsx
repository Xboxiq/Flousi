import { cn } from "@/presentation/lib/cn";

export interface MoneyProps extends React.HTMLAttributes<HTMLElement> {
  /** Pre-formatted figure (via `@/presentation/lib/format`). */
  children: React.ReactNode;
  /**
   * Signed value driving profit polarity. Positive → success, negative →
   * danger, zero → muted. Omit to inherit the surrounding ink.
   * Polarity must never be the only signal — pair with a sign/word nearby.
   */
  polarity?: number;
}

const toneOf = (n: number) => (n > 0 ? "text-success" : n < 0 ? "text-danger" : "text-muted");

/** Split "25,000.75 د.ع." into the whole part, the fraction, and the mark. */
export function figureParts(text: string) {
  const m = /^([^\d]*)([\d,   ]*\d)(?:([.،٫])(\d+))?(.*)$/.exec(text);
  if (!m) return null;
  return { lead: m[1], whole: m[2], sep: m[3], frac: m[4], trail: m[5] };
}

/**
 * The one way to render a figure: mono, tabular (digits never shift), wrapped
 * in an LTR <bdi> island so adjacent Arabic text can't disturb the number run
 * (MASTER §6–7).
 *
 * The fraction and the currency mark are set one step quieter than the whole
 * part, so the eye lands on the figure that matters first — the treatment the
 * reference wallets use, and the reason a long price still reads at a glance.
 *
 * The currency mark is also set SMALLER, not just fainter, and the authority is
 * the client's own dashboard board (renders/p1-dashboard.png): «د.ع.» sits beside
 * a 56px figure at a fraction of its size, and on the list rows underneath it the
 * board prints no currency at all. The app was setting «د.ع.» at the FIGURE'S own
 * size everywhere — on the hero that made a four-character word as tall as the
 * number it qualifies, and on a phone it took most of the line.
 *
 * `max(10px, 0.34em)` because one rule has to serve a 56px hero and an 11px table
 * cell: the em term keeps it proportional where there is room, and the 10px floor
 * keeps it legible where there is not. A ratio alone would print a 4px currency
 * mark inside a caption.
 */
export function Money({ children, polarity, className, ...props }: MoneyProps) {
  const text = typeof children === "string" ? children : null;
  const split = text ? figureParts(text) : null;

  return (
    <bdi
      dir="ltr"
      className={cn(
        "font-figure tabular-nums",
        polarity !== undefined && toneOf(polarity),
        className,
      )}
      {...props}
    >
      {split ? (
        <>
          {split.lead}
          {split.whole}
          {split.sep && <span className="opacity-55">{split.sep + split.frac}</span>}
          {split.trail && (
            <span className="ms-[0.15em] text-[max(10px,0.34em)] opacity-60">{split.trail}</span>
          )}
        </>
      ) : (
        children
      )}
    </bdi>
  );
}
