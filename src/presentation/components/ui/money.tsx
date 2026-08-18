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
function parts(text: string) {
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
 */
export function Money({ children, polarity, className, ...props }: MoneyProps) {
  const text = typeof children === "string" ? children : null;
  const split = text ? parts(text) : null;

  return (
    <bdi
      dir="ltr"
      className={cn(
        "font-mono tabular-nums",
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
          {split.trail && <span className="opacity-60">{split.trail}</span>}
        </>
      ) : (
        children
      )}
    </bdi>
  );
}
