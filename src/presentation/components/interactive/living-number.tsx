"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { cn } from "@/presentation/lib/cn";

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

interface LivingNumberProps {
  value: number;
  /**
   * Hide the gliding figure from assistive tech. A caller that announces the
   * settled value itself (an sr-only live line) must set this: the glide walks
   * through intermediate amounts that were never the reading.
   */
  "aria-hidden"?: boolean;
  /** Locale/currency formatter from `@/presentation/lib/format`. */
  format: (n: number) => string;
  /** Glide duration in ms. Keep under 300 (MASTER §5). */
  duration?: number;
  className?: string;
}

/**
 * RITM signature device #1 — the Living Number (design-system/SIGNATURE.md).
 * The net-profit figure responds to every input: it glides from its CURRENT
 * displayed value to the next (interruptible — never restarts from the target),
 * in tabular mono so only the changing digits move. Snaps instantly under
 * `prefers-reduced-motion`. This is the one place RITM spends its delight
 * budget; do not reuse it for numbers the user merely reads.
 */
export function LivingNumber({
  value,
  format,
  duration = 280,
  "aria-hidden": ariaHidden,
  className,
}: LivingNumberProps) {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(value);
  // Live presentation value — the animation source on interrupt.
  const liveRef = useRef(value);

  useEffect(() => {
    if (reduce) {
      liveRef.current = value;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reduced motion: snap to final value
      setDisplay(value);
      return;
    }
    const from = liveRef.current;
    if (from === value) return;
    let raf = 0;
    let start: number | null = null;
    const tick = (t: number) => {
      if (start === null) start = t;
      const p = Math.min((t - start) / duration, 1);
      const n = from + (value - from) * easeOutCubic(p);
      liveRef.current = n;
      setDisplay(n);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration, reduce]);

  return (
    <bdi dir="ltr" aria-hidden={ariaHidden} className={cn("font-figure tabular-nums", className)}>
      {format(display)}
    </bdi>
  );
}
