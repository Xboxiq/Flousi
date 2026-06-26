"use client";

import { forwardRef } from "react";
import { cn } from "@/presentation/lib/cn";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, invalid, rows = 3, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      aria-invalid={invalid || undefined}
      className={cn(
        "w-full rounded-[var(--radius-md)] border bg-surface px-3 py-2 text-sm text-fg",
        "placeholder:text-subtle transition-colors duration-[var(--motion-fast)]",
        "focus-visible:outline-2 focus-visible:outline-focus disabled:opacity-50",
        invalid ? "border-danger" : "border-border",
        className,
      )}
      {...props}
    />
  );
});
