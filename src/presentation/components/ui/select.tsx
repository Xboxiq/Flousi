"use client";

import { forwardRef } from "react";
import { CaretDown } from "@phosphor-icons/react";
import { cn } from "@/presentation/lib/cn";

export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
  invalid?: boolean;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, options, invalid, placeholder, ...props },
  ref,
) {
  return (
    <div className="relative">
      <select
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          "h-10 w-full appearance-none rounded-[var(--radius-md)] border bg-surface ps-3 pe-9 text-sm text-fg",
          "transition-colors duration-[var(--motion-fast)]",
          "focus-visible:outline-2 focus-visible:outline-focus disabled:opacity-50",
          invalid ? "border-danger" : "border-border",
          className,
        )}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <CaretDown
        size={16}
        weight="bold"
        className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-subtle"
      />
    </div>
  );
});
