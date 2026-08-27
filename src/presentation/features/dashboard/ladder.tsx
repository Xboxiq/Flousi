"use client";

import { useState } from "react";
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
export function Ladder({
  children,
  className,
  solo,
}: {
  children: React.ReactNode;
  className?: string;
  /**
   * One rung and no rail.
   *
   * A rail is what makes several latches ONE object; with a single latch it is a
   * groove holding nothing, and on /reps it stretched to the height of the device
   * beside it and read as a divider. A lone latch is just a latch (P11).
   */
  solo?: boolean;
}) {
  return (
    <div className={cn("ladder flex flex-col gap-4", solo && "ladder-solo", className)}>
      {children}
    </div>
  );
}

export function Rung({
  title,
  hint,
  summary,
  open,
  onToggle,
  flat,
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
  /** No shell of its own: for a rung that hangs INSIDE a card, where a raised
   *  surface would be a card in a card. */
  flat?: boolean;
  children: React.ReactNode;
}) {
  /* Mounted on FIRST open and kept mounted after: the height tween needs the
     content in the DOM to be symmetric and interruptible, but mounting it on page
     load would fetch the rung's heavy imports (the chart) before anyone asked —
     the exact cost P7 measured out of the first load. A ratchet: set in the latch
     handler, never unset. */
  const [everOpened, setEverOpened] = useState(open);
  return (
    <section
      data-open={open}
      className={cn(
        "ladder-rung rounded-[var(--radius-2xl)]",
        flat ? "border-t border-border-soft" : "bg-surface shadow-card",
      )}
    >
      <button
        type="button"
        onClick={() => {
          setEverOpened(true);
          onToggle();
        }}
        aria-expanded={open}
        /* wrap, so a phone-width latch drops the summary to its own line instead of
           squeezing the title into a five-line sliver beside it */
        className={cn(
          "flex w-full flex-wrap items-center gap-x-4 gap-y-2 rounded-[var(--radius-2xl)] text-start transition-colors hover:bg-surface-2",
          flat ? "px-1 py-4" : "p-5",
        )}
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
      {/* Mounted always, disclosed by height (transitions.dev №21): the tween is
          symmetric and interruptible, and everything below FOLLOWS instead of
          jumping. `inert` keeps the closed content out of the tab order. */}
      <div className="disclose" data-open={open} inert={open ? undefined : true}>
        <div>
          {everOpened && (
            <div className={cn("border-t border-border-soft", flat ? "px-1 py-4" : "p-5")}>
              {children}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
