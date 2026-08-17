"use client";

import { useMemo } from "react";
import { cn } from "@/presentation/lib/cn";

interface OdometerProps {
  value: number;
  /** Formatter from `@/presentation/lib/format` (locale + currency aware). */
  format: (n: number) => string;
  /** Drum height in em, relative to the font size. */
  drumHeight?: number;
  className?: string;
}

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

/**
 * العدّاد — the net figure as a mechanical counter (from the client's visual
 * feedback: utility meters with digit drums).
 *
 * Every digit is its own drum in a bay: masked top and bottom so the numbers
 * fade into the housing, rolling to their new position when the value changes.
 * The rightmost drum leads and each one to its left follows a beat later, the
 * way a real counter cascades. Under `prefers-reduced-motion` the drums simply
 * cut to the new digit (the CSS transition is dropped, not the reading).
 *
 * Non-digits — separators, the currency mark, a minus sign — are struck onto
 * the housing, not spun: only the counting parts move. The unit is struck
 * smaller and quieter than the figure (the same rule `Money` applies to a
 * fraction, RECIPES R32): a counter this size is read for its number, and a
 * full-height «د.ع.» was competing with it.
 */
export function Odometer({ value, format, drumHeight = 1.16, className }: OdometerProps) {
  /**
   * Tokenised into drums and struck runs: each digit is its own drum, and every
   * stretch of non-digits stays ONE run so a unit like «د.ع.» keeps its letter
   * spacing instead of being spread out character by character.
   */
  const tokens = useMemo(() => {
    const out: Array<{ kind: "digit"; digit: number } | { kind: "run"; text: string; unit: boolean }> =
      [];
    for (const ch of Array.from(format(value))) {
      if (/\d/.test(ch)) {
        out.push({ kind: "digit", digit: Number(ch) });
        continue;
      }
      const prev = out[out.length - 1];
      const isLetter = /[\p{L}\p{Sc}]/u.test(ch);
      if (prev && prev.kind === "run") {
        prev.text += ch;
        prev.unit = prev.unit || isLetter;
      } else {
        out.push({ kind: "run", text: ch, unit: isLetter });
      }
    }
    // The rightmost drum leads the cascade, each one to its left a beat behind.
    return out;
  }, [value, format]);

  const totalDigits = tokens.filter((t) => t.kind === "digit").length;

  return (
    <bdi
      dir="ltr"
      className={cn("odo font-mono tabular-nums", className)}
      style={{ "--odo-h": `${drumHeight}em` } as React.CSSProperties}
      aria-label={format(value)}
    >
      {(() => {
        let seen = 0;
        return tokens.map((t, i) => {
          if (t.kind === "run") {
            return (
              <span
                key={i}
                aria-hidden
                className={cn(
                  "inline-block",
                  // The unit recedes; separators inside the figure keep its scale.
                  t.unit ? "px-[0.14em] text-[0.56em] font-semibold opacity-60" : "px-[0.02em]",
                )}
              >
                {t.text.replace(/ /g, "\u00a0")}
              </span>
            );
          }
          const order = totalDigits - 1 - seen;
          seen += 1;
          return (
            <span key={i} aria-hidden className="odo-wheel">
              <span
                className="odo-strip"
                style={{
                  transform: `translateY(calc(-1 * ${t.digit} * var(--odo-h)))`,
                  transitionDelay: `${Math.min(order * 22, 160)}ms`,
                }}
              >
                {DIGITS.map((d) => (
                  <span key={d} className="odo-digit">
                    {d}
                  </span>
                ))}
              </span>
            </span>
          );
        });
      })()}
    </bdi>
  );
}
