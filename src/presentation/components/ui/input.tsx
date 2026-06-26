"use client";

import { forwardRef } from "react";
import { cn } from "@/presentation/lib/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
  /** Affix shown inside the input start (e.g. a currency symbol). */
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
}

const baseField =
  "h-10 w-full rounded-[var(--radius-md)] border bg-surface text-sm text-fg " +
  "placeholder:text-subtle transition-colors duration-[var(--motion-fast)] " +
  "focus-visible:outline-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-50";

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid, leading, trailing, ...props },
  ref,
) {
  const border = invalid ? "border-danger" : "border-border";

  if (leading || trailing) {
    return (
      <div
        className={cn(
          "flex h-10 w-full items-center rounded-[var(--radius-md)] border bg-surface",
          "focus-within:outline-2 focus-within:outline-focus",
          border,
          className,
        )}
      >
        {leading && <span className="ps-3 text-sm text-muted">{leading}</span>}
        <input
          ref={ref}
          aria-invalid={invalid || undefined}
          className="h-full w-full bg-transparent px-3 text-sm text-fg placeholder:text-subtle focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          {...props}
        />
        {trailing && <span className="pe-3 text-sm text-muted">{trailing}</span>}
      </div>
    );
  }

  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(baseField, "px-3", border, className)}
      {...props}
    />
  );
});
