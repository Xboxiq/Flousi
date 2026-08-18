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
  /** The day being reported: solid plunger, rimmed track, its figure above it. */
  activeIndex?: number;
  /** Already-formatted figure for the active day's chip. */
  activeLabel?: string;
  /** One word naming the active day, set before its figure ("اليوم"). */
  activeCaption?: string;
  className?: string;
}

/**
 * The week as capsules (from the client's feedback: the M T W T F S S widget).
 *
 * Each day is a carved capsule track with a plunger sitting at its level, so an
 * empty day still shows its track — the remainder is part of the reading
 * (VISUAL-LAW §11). No axis, no gridlines: seven objects, one glance.
 *
 * One day is the reading (R37, fourth feedback batch): it stays solid, gets a
 * rimmed housing and carries its own figure on a chip above the strip, while the
 * others keep their hue but drop to a dot screen. That is why the card header no
 * longer repeats today's number — the object reports itself.
 *
 * Never animated: this is data being read, not a reveal.
 */
export function WeekBars({
  days,
  height = 74,
  activeIndex,
  activeLabel,
  activeCaption,
  className,
}: WeekBarsProps) {
  const max = Math.max(...days.map((d) => Math.abs(d.value)), 1);
  const active = activeIndex ?? -1;

  return (
    <div className={cn("flex items-end gap-2", className)} data-part="week-bars">
      {days.map((d, i) => {
        const ratio = Math.abs(d.value) / max;
        const negative = d.value < 0;
        const isActive = i === active;
        return (
          <div key={i} className="relative flex flex-1 flex-col items-center gap-1.5">
            {isActive && activeLabel && (
              <>
                <span
                  /* The chip hugs the strip's outer edge on the end columns so it
                     never overflows the panel; the notch below stays centred on
                     THIS capsule, so the figure cannot be read as its neighbour's. */
                  className="reading-chip bottom-[calc(100%+8px)] z-10 whitespace-nowrap px-2 py-[3px] text-[11px] font-bold text-fg"
                  style={
                    i === 0
                      ? { insetInlineStart: 0 }
                      : i === days.length - 1
                        ? { insetInlineEnd: 0 }
                        : { left: "50%", transform: "translateX(-50%)" }
                  }
                >
                  {activeCaption && (
                    <span className="me-1 font-medium text-muted">{activeCaption}</span>
                  )}
                  <bdi dir="ltr" className="font-mono tabular-nums">
                    {activeLabel}
                  </bdi>
                </span>
                <span className="reading-notch bottom-[calc(100%+4px)] z-20" aria-hidden />
              </>
            )}
            {/* a capsule is taller than it is wide — capped so seven of them
                stay capsules on a wide card instead of turning into discs */}
            <div
              className={cn("capsule-track w-full max-w-[24px]", isActive && "capsule-active")}
              style={{ height }}
              title={d.title}
            >
              <div
                className={cn("capsule-fill", !isActive && "capsule-fill-quiet")}
                style={{
                  height: `${Math.max(ratio * 100, d.value === 0 ? 0 : 9)}%`,
                  backgroundImage: negative
                    ? "linear-gradient(180deg, color-mix(in oklab, var(--danger), white 30%), var(--danger))"
                    : undefined,
                }}
              />
            </div>
            <span
              className={cn(
                "text-[10px]",
                isActive ? "font-bold text-fg" : "font-medium text-subtle",
              )}
            >
              {d.mark}
            </span>
          </div>
        );
      })}
    </div>
  );
}
