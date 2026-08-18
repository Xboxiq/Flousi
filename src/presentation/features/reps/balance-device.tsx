"use client";

import { Money } from "@/presentation/components/ui";
import { Odometer } from "@/presentation/components/objects/odometer";
import { cn } from "@/presentation/lib/cn";

/** A label over its figure, for readings a table would over-dress. */
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

interface Props {
  label: string;
  /** The derived payable, major units. Negative = paid ahead. */
  outstanding: number;
  earned: number;
  settled: number;
  money: (n: number) => string;
  caption: string;
  className?: string;
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
export function BalanceDevice({
  label,
  outstanding,
  earned,
  settled,
  money,
  caption,
  className,
}: Props) {
  const state =
    outstanding > 0 ? "رصيد مستحق" : outstanding < 0 ? "مدفوع مقدّمًا" : "مسوّى بالكامل";
  const lit = outstanding !== 0;
  const hue = outstanding < 0 ? "var(--warning)" : "var(--accent)";

  return (
    <div
      /* the glow is STATE-BOUND, so it is absent from the class list at neutral
         rather than present-but-transparent (VISUAL-LAW §8 §12) */
      className={cn("device relative px-5 pt-4 pb-5", lit && "leak", className)}
      data-part="balance-device"
      style={
        lit
          ? ({
              "--leak-color": `color-mix(in srgb, ${hue} 45%, transparent)`,
            } as React.CSSProperties)
          : undefined
      }
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-muted">{label}</span>
        <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] bg-surface-2 px-2.5 py-1 text-xs font-semibold text-muted">
          <span
            aria-hidden
            className="lamp size-[9px]"
            style={
              {
                "--lamp-color": lit ? hue : "var(--subtle)",
                "--lamp-glow": lit ? `color-mix(in srgb, ${hue} 60%, transparent)` : "transparent",
              } as React.CSSProperties
            }
          />
          {state}
        </span>
      </div>

      <div
        className="display-window mt-3 overflow-hidden px-4 py-3.5"
        data-part="display"
        aria-live="polite"
        aria-atomic="true"
      >
        <Odometer
          value={outstanding}
          format={money}
          drumHeight={1.32}
          className="text-[32px] font-semibold leading-none text-white/85"
        />
      </div>

      <div className="mt-3.5 flex items-baseline justify-between gap-4 border-t border-border pt-3">
        <Figure label="الحصص المجمّدة" value={money(earned)} />
        <div className="text-end">
          <div className="text-[11px] text-muted">المدفوع</div>
          <Money className="mt-0.5 block text-[15px] font-bold text-fg">{money(settled)}</Money>
        </div>
      </div>
      <p className="mt-2 text-[11px] text-subtle">{caption}</p>
    </div>
  );
}
