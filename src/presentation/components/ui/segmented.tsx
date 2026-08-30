"use client";

import { useCallback, useLayoutEffect, useRef } from "react";
import { cn } from "@/presentation/lib/cn";

export interface SegmentedOption<T extends string> {
  label: string;
  value: T;
  icon?: React.ReactNode;
}

/**
 * A pill filter row: an inset track where exactly one chip is a filled accent
 * body and the rest are text with a hit area (RECIPES R38). The filled chip is
 * the only place accent appears in the row, so "which one is on" is answered
 * before anything is read.
 *
 * P9 (transitions.dev №16): the accent body is ONE measured pill that SLIDES
 * between options instead of being repainted onto each button — the state
 * visibly travels, which is what makes «before → after» legible without
 * re-reading the labels. JS writes the active button's measured box onto the
 * pill; CSS owns the tween. First paint, container resizes, and late font
 * swaps write the position WITHOUT a transition, so the pill never animates
 * from nowhere.
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  id,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  className,
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Lets a Field's own <label> point at the group instead of at nothing. */
  id?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  className?: string;
}) {
  const groupRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);
  const painted = useRef(false);

  const place = useCallback((animate: boolean) => {
    const group = groupRef.current;
    const pill = pillRef.current;
    if (!group || !pill) return;
    const active = group.querySelector<HTMLButtonElement>('button[aria-pressed="true"]');
    if (!active) {
      pill.style.opacity = "0";
      return;
    }
    if (!animate) pill.setAttribute("data-still", "");
    pill.style.opacity = "1";
    pill.style.width = `${active.offsetWidth}px`;
    pill.style.height = `${active.offsetHeight}px`;
    /* offsetLeft/offsetTop are GEOMETRIC (from the group's left edge in every
       writing mode), so the pill is anchored with physical `left`/`top` and moved
       with translate — the one sanctioned exception to logical-properties-only,
       because the measurement itself is physical. offsetTop carries the pill to
       the right ROW when the group wraps (P5 made these groups wrap). */
    pill.style.transform = `translate(${active.offsetLeft}px, ${active.offsetTop}px)`;
    if (!animate) {
      /* land the still write before the transition is re-enabled */
      void pill.offsetWidth;
      pill.removeAttribute("data-still");
    }
  }, []);

  /* Reposition on every value change — including one arriving from OUTSIDE the
     group (the URL's back button now drives these values, P8). The first paint
     snaps without animating. */
  useLayoutEffect(() => {
    place(painted.current);
    painted.current = true;
  }, [place, value, options.length]);

  /* Wraps, container resizes and late font swaps change the buttons' boxes; every
     one repositions the pill without a tween. Observing the BUTTONS (not just the
     group) is what catches a font swap that changes a label's width. */
  useLayoutEffect(() => {
    const group = groupRef.current;
    if (!group || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => place(false));
    ro.observe(group);
    for (const child of group.children) ro.observe(child);
    return () => ro.disconnect();
  }, [place, options.length]);

  return (
    /* A group, not an anonymous div: a row of buttons under a Field label had no
       accessible name at all, because <label for> cannot target a div. */
    <div
      ref={groupRef}
      id={id}
      role="group"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      /* The GROUP wraps, the labels do not: a squeezed row breaks between options
         instead of snapping a two-word state in half. */
      className={cn(
        "relative inline-flex flex-wrap gap-1 rounded-[var(--radius-md)] border border-line bg-surface-2 p-1",
        className,
      )}
    >
      <span ref={pillRef} aria-hidden className="seg-pill bg-accent-fill" />
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={active}
            className={cn(
              /* nowrap: a squeezed group used to break «في الطريق» in half INSIDE
                 its own pill. Labels ride above the pill on their own layer. */
              "relative z-[1] inline-flex items-center gap-1.5 whitespace-nowrap rounded-[var(--radius-sm)] px-4 py-1.5 text-sm font-medium transition-colors duration-[var(--motion-base)] ease-[var(--ease-out)]",
              active ? "font-semibold text-accent-fill-fg" : "text-muted hover:text-fg",
            )}
          >
            {opt.icon}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
