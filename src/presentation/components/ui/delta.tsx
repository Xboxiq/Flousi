import { CaretUp, CaretDown } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/presentation/lib/cn";

export interface DeltaProps {
  /** Signed ratio (0.124 = +12.4%). Zero reads as flat. */
  value: number;
  /** Pre-formatted label, e.g. "+12.4%". */
  label: string;
  /** What it is compared against — set beside the chip, never inside it. */
  against?: string;
  className?: string;
}

/**
 * A change, on a chip (RECIPES R43, fifth feedback batch): the soft tint of its
 * own tone, a caret, and the figure in mono.
 *
 * A bare coloured number disappears in a grid of numbers; the chip is what makes
 * it scannable. The caret is the second signal, so the reading survives without
 * colour (a11y floor) — and "against what" stays outside the chip, because it is
 * a sentence, not a value.
 */
export function Delta({ value, label, against, className }: DeltaProps) {
  const up = value >= 0;
  const Caret = up ? CaretUp : CaretDown;
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs", className)}>
      <span
        className={cn(
          "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold",
          up ? "bg-success-soft text-success" : "bg-danger-soft text-danger",
        )}
      >
        <Caret size={10} weight="fill" />
        <bdi dir="ltr" className="font-mono tabular-nums">
          {label}
        </bdi>
      </span>
      {against && <span className="font-medium text-subtle">{against}</span>}
    </span>
  );
}
