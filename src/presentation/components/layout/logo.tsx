import { cn } from "@/presentation/lib/cn";

/** Flousi brand mark: a rounded accent tile with an upward growth glyph. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-accent text-accent-fg",
        className,
      )}
      aria-hidden
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          d="M3 11.5L6.2 8.3L8.4 10.5L13 5.9"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M10 5.5H13V8.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function Logo({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark />
      {!collapsed && (
        <span className="text-lg font-semibold tracking-tight text-fg">Flousi</span>
      )}
    </div>
  );
}
