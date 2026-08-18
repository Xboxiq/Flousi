"use client";

import { cn } from "@/presentation/lib/cn";

export interface SegmentedOption<T extends string> {
  label: string;
  value: T;
  icon?: React.ReactNode;
}

/**
 * A pill filter row: an inset track where exactly one chip is a filled accent
 * body and the rest are text with a hit area (RECIPES R38, fourth feedback
 * batch). The filled chip is the only place accent appears in the row, so "which
 * one is on" is answered before anything is read.
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
  return (
    /* A group, not an anonymous div: a row of buttons under a Field label had no
       accessible name at all, because <label for> cannot target a div. */
    <div
      id={id}
      role="group"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      className={cn("neu-inset inline-flex gap-1 rounded-full bg-sunken p-1", className)}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={active}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-[color,background-color,box-shadow] duration-[var(--motion-base)] ease-[var(--ease-out)]",
              active
                ? "molded molded-accent font-semibold text-white"
                : "text-muted hover:text-fg",
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
