"use client";

import { Moon, Sun } from "@phosphor-icons/react";
import { useTheme } from "./theme-provider";
import { cn } from "@/presentation/lib/cn";

/**
 * The theme switch. Its two icons live in ONE stacked slot and cross-swap with a
 * blurred scale (transitions.dev №9) — the sun sets as the moon rises, an object
 * being exchanged rather than a glyph repainted. Rare tier (a few taps a day at
 * most), so a standard 200ms swap is allowed; the icons are always both mounted,
 * which is what lets a mid-swap second tap retarget instead of restarting.
 */
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
      <span className="icon-swap" data-swapped={isDark}>
        <Moon size={18} aria-hidden />
        <Sun size={18} aria-hidden />
      </span>
    </button>
  );
}
