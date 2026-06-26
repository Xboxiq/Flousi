import { cn } from "@/presentation/lib/cn";

/** Shape-matching skeleton placeholder. Use instead of spinners for page content. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse rounded-[var(--radius-md)] bg-surface-2", className)}
    />
  );
}
