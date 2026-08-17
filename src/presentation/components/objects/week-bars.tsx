"use client";

import { cn } from "@/presentation/lib/cn";

export interface DayValue {
  /** Single-letter Arabic weekday mark. */
  mark: string;
  value: number;
  /** Full label + amount for the tooltip. */
  title: string;
}

interface WeekBarsProps {
  days: DayValue[];
  height?: number;
  className?: string;
}

/**
 * The week as capsules (from the client's feedback: the M T W T F S S widget).
 *
 * Each day is a carved capsule track with a plunger sitting at its level, so an
 * empty day still shows its track — the remainder is part of the reading
 * (VISUAL-LAW §11). No axis, no gridlines: seven objects, one glance.
 * Never animated: this is data being read, not a reveal.
 */
export function WeekBars({ days, height = 74, className }: WeekBarsProps) {
  const max = Math.max(...days.map((d) => Math.abs(d.value)), 1);

  return (
    <div className={cn("flex items-end gap-2", className)} data-part="week-bars">
      {days.map((d, i) => {
        const ratio = Math.abs(d.value) / max;
        const negative = d.value < 0;
        return (
          <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
            {/* a capsule is taller than it is wide — capped so seven of them
                stay capsules on a wide card instead of turning into discs */}
            <div
              className="capsule-track w-full max-w-[20px]"
              style={{ height }}
              title={d.title}
            >
              <div
                className="capsule-fill"
                style={{
                  height: `${Math.max(ratio * 100, d.value === 0 ? 0 : 9)}%`,
                  backgroundImage: negative
                    ? "linear-gradient(180deg, color-mix(in oklab, var(--danger), white 30%), var(--danger))"
                    : undefined,
                }}
              />
            </div>
            <span className="text-[10px] font-medium text-subtle">{d.mark}</span>
          </div>
        );
      })}
    </div>
  );
}
