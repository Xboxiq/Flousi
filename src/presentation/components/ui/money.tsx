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

/**
 * The one way to render a figure: mono, tabular (digits never shift), wrapped
 * in an LTR <bdi> island so adjacent Arabic text can't disturb the number run
 * (MASTER §6–7). Size/weight come from the surrounding type role.
 */
export function Money({ children, polarity, className, ...props }: MoneyProps) {
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
      {children}
    </bdi>
  );
}
