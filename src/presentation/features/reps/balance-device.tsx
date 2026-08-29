"use client";

import { Money } from "@/presentation/components/ui";
import { cn } from "@/presentation/lib/cn";

/**
 * A label over its figure, for readings a table would over-dress.
 *
 * All that survives of this file. `BalanceDevice` — a payable rendered as a
 * drum bay with a lit housing — went with the rep sheet's rebuild: the balance
 * is a `Metric` in a panel now, the same shape every other figure in the product
 * uses, and one screen having its own instrument for one number is how a system
 * stops being one.
 */
export function Figure({
  label,
  value,
  polarity,
  hint,
  className,
}: {
  label: string;
  value: string;
  /** Signed profit figure only. A balance and a count stay neutral ink (§13). */
  polarity?: number;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <div className="text-[11px] text-muted">{label}</div>
      <Money polarity={polarity} className="mt-0.5 block text-[15px] font-bold text-fg">
        {value}
      </Money>
      {hint && <div className="mt-0.5 text-[11px] text-subtle">{hint}</div>}
    </div>
  );
}

/**
 * The payable as an instrument: one figure in a drum bay, with the two amounts it
 * is derived from struck underneath it.
 *
 * The state is a WORD first, the lamp second and the housing's glow third, and
 * all three are absent at zero: nothing here is lit unless there is something to
 * report (VISUAL-LAW §8 §12). Owing a rep is not a loss, so the figure keeps
 * neutral ink and no danger tint (§13) — the words carry which case it is.
 */
