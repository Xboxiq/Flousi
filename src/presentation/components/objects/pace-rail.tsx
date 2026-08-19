"use client";

import { cn } from "@/presentation/lib/cn";

export interface PaceRailProps {
  /** achieved / target. 1 = exactly on target. Values past 1 fill the channel. */
  attainment: number;
  /** Share of the month gone, 0..1. Drawn as a scribe line across the channel. */
  elapsed: number;
  /** success = at or ahead of pace · danger = behind · muted = no target set. */
  tone?: "success" | "accent" | "danger" | "muted";
  height?: number;
  /** Announced to assistive tech; the channel itself is decorative. */
  label: string;
  className?: string;
}

const HUE: Record<NonNullable<PaceRailProps["tone"]>, string> = {
  success: "var(--success)",
  accent: "var(--accent)",
  danger: "var(--danger)",
  muted: "color-mix(in srgb, var(--fg) 22%, transparent)",
};

/**
 * مِسطرة الوتيرة — the pace rail.
 *
 * Two facts on one track: the moulded run is what has been ACHIEVED, and the
 * scribe line is how much of the MONTH has gone. That pairing is the whole
 * object. «45% من الهدف» alone is not a reading a merchant can act on; «45%
 * وقد مضى نصف الشهر» is, and putting both on one channel makes it impossible to
 * read one without the other.
 *
 * The remainder carries the app-wide diagonal hatch that means "not yet"
 * (VISUAL-LAW §11a), and the scribe is a LINE rather than a second colour, so it
 * never competes with what the fill's hue already means (§13).
 */
export function PaceRail({
  attainment,
  elapsed,
  tone = "accent",
  height = 14,
  label,
  className,
}: PaceRailProps) {
  const safe = (n: number) => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0);
  // A negative attainment (a losing month measured against a target) fills
  // nothing: there is no such thing as negative progress along a channel, and the
  // figure beside the rail is where that truth is told.
  const filled = safe(attainment);
  const gone = safe(elapsed);

  return (
    <div
      className={cn("pace-track", className)}
      style={{ height, "--pace-hue": HUE[tone] } as React.CSSProperties}
      role="img"
      aria-label={label}
    >
      {filled > 0 && (
        <span className="pace-fill" style={{ width: `${filled * 100}%` }} aria-hidden />
      )}
      {/* the hatch begins where the fill stops — one region, never a second bar */}
      {filled < 1 && (
        <span className="pace-gap" style={{ width: `${(1 - filled) * 100}%` }} aria-hidden />
      )}
      {/* The scribe is state-bound (§8): before a month begins there is nothing to
          mark, and at its end the mark IS the end of the channel. */}
      {gone > 0 && gone < 1 && (
        <span className="pace-scribe" style={{ insetInlineStart: `${gone * 100}%` }} aria-hidden />
      )}
    </div>
  );
}
