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
 * the housing, not spun: only the counting parts move.
 */
export function Odometer({ value, format, drumHeight = 1.16, className }: OdometerProps) {
  const chars = useMemo(() => Array.from(format(value)), [value, format]);
  // Count digits from the right so the rightmost drum leads the cascade.
  const digitIndexFromEnd = useMemo(() => {
    const map = new Map<number, number>();
    let n = 0;
    for (let i = chars.length - 1; i >= 0; i--) {
      if (/\d/.test(chars[i])) map.set(i, n++);
    }
    return map;
  }, [chars]);

  return (
    <bdi
      dir="ltr"
      className={cn("odo font-mono tabular-nums", className)}
      style={{ "--odo-h": `${drumHeight}em` } as React.CSSProperties}
      aria-label={format(value)}
    >
      {chars.map((ch, i) => {
        if (!/\d/.test(ch)) {
          return (
            <span key={i} aria-hidden className="inline-block px-[0.02em]">
              {ch === " " ? " " : ch}
            </span>
          );
        }
        const digit = Number(ch);
        const order = digitIndexFromEnd.get(i) ?? 0;
        return (
          <span key={i} aria-hidden className="odo-wheel">
            <span
              className="odo-strip"
              style={{
                transform: `translateY(calc(-1 * ${digit} * var(--odo-h)))`,
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
      })}
    </bdi>
  );
}
