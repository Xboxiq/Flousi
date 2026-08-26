"use client";

import { CaretDown } from "@phosphor-icons/react";
import { cn } from "@/presentation/lib/cn";

/**
 * سلّم الكشف — the disclosure ladder (P7).
 *
 * One rail, and every reading below the number hangs on it as a rung. A closed
 * rung is not a mystery door: its latch carries a one-line summary, so a glance
 * still answers without opening anything. One rung is open at a time — a ladder
 * is stood on one step, and letting them all open would quietly rebuild the wall
 * of indicators this phase exists to tear down.
 */
export function Ladder({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("ladder flex flex-col gap-4", className)}>{children}</div>;
}

export function Rung({
  title,
  hint,
  summary,
  open,
  onToggle,
  children,
}: {
  title: string;
  /** One quiet line under the title, stating what the rung holds. */
  hint?: string;
  /**
   * The latch's own reading while CLOSED. It disappears when the rung opens —
   * the content then states it larger, and a figure printed twice on one screen
   * is a figure the reader has to reconcile.
   */
  summary?: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <section
      data-open={open}
      className="ladder-rung rounded-[var(--radius-2xl)] bg-surface shadow-card"
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        /* wrap, so a phone-width latch drops the summary to its own line instead of
           squeezing the title into a five-line sliver beside it */
        className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 rounded-[var(--radius-2xl)] p-5 text-start transition-colors hover:bg-surface-2"
      >
        <span className="me-auto min-w-[11rem] flex-1">
          <span className="block text-sm font-semibold text-fg">{title}</span>
          {hint && <span className="mt-0.5 block text-xs text-muted">{hint}</span>}
        </span>
        {summary !== undefined && !open && (
          <span className="shrink-0 text-end text-sm">{summary}</span>
        )}
        <CaretDown
          size={16}
          weight="bold"
          aria-hidden
          className={cn(
            "shrink-0 text-subtle transition-transform duration-[var(--motion-base)] ease-[var(--ease-out)]",
            open && "rotate-180",
          )}
        />
      </button>
      {open && <div className="reveal border-t border-border-soft p-5">{children}</div>}
    </section>
  );
}
