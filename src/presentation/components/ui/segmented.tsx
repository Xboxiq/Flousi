"use client";

import { cn } from "@/presentation/lib/cn";

export interface SegmentedOption<T extends string> {
  label: string;
  value: T;
  icon?: React.ReactNode;
}

/** Soft-UI segmented control: an inset track with a raised, glossy active pill. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("neu-inset inline-flex gap-1 rounded-full bg-sunken p-1", className)}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={active}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-[var(--motion-base)]",
              active
                ? "bg-surface text-fg shadow-sm"
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
