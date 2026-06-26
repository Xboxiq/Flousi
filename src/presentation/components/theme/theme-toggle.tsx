"use client";

import { Moon, Sun } from "@phosphor-icons/react";
import { useTheme } from "./theme-provider";
import { cn } from "@/presentation/lib/cn";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolved, toggle } = useTheme();
  const isDark = resolved === "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-[var(--radius-md)] text-muted",
        "transition-colors hover:bg-surface-2 hover:text-fg",
        className,
      )}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
