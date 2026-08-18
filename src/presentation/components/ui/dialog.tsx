"use client";

import { useEffect, useId, useRef } from "react";
import { X } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/presentation/lib/cn";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  /**
   * An art header (RECIPES R29): a band above the title holding an OBJECT —
   * ideally the data the dialog acts on (the month's rings, a folder), never a
   * decorative icon on a wash. The band is a shallow stage, so whatever is
   * placed in it stands rather than floats.
   */
  art?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  art,
  children,
  footer,
  className,
}: DialogProps) {
  const reduce = useReducedMotion();
  const titleId = useId();
  const descId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    // Focus moves INTO the sheet and returns to where it was on close. Without
    // this a keyboard user stays behind the overlay, tabbing an unreachable page,
    // and a screen reader never enters the dialog at all.
    const returnTo = document.activeElement as HTMLElement | null;
    const focusable = panelRef.current?.querySelector<HTMLElement>(
      'input:not([type="hidden"]), select, textarea, [role="slider"], button:not([aria-hidden="true"]), [href], [tabindex]:not([tabindex="-1"])',
    );
    (focusable ?? panelRef.current)?.focus({ preventScroll: true });

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      returnTo?.focus?.({ preventScroll: true });
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          /* The sheet must SAY what it is: role="dialog" with no accessible name
             is announced as an unnamed dialog. */
          aria-labelledby={title ? titleId : undefined}
          aria-describedby={description ? descId : undefined}
        >
          <motion.div
            className="absolute inset-0 bg-black/45"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            className={cn(
              // A sheet taller than the phone must scroll its BODY while the art
              // band, the title and the footer stay put: the commit control is the
              // whole point of a dialog, so it can never be the part that is cut off.
              "relative z-10 flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col",
              "rounded-[var(--radius-lg)] border border-border bg-surface shadow-xl",
              className,
            )}
            initial={reduce ? false : { opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: [0.33, 1, 0.68, 1] }}
          >
            {art && (
              <div className="scene-field relative flex shrink-0 items-center justify-center overflow-hidden !rounded-b-none rounded-t-[calc(var(--radius-lg)-1px)] px-5 pt-6 pb-4">
                {art}
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="إغلاق"
                  className="absolute end-2 top-2 inline-flex size-11 items-center justify-center rounded-full bg-surface/85 text-muted shadow-sm hover:text-fg"
                >
                  <X size={17} />
                </button>
              </div>
            )}
            {(title || description) && (
              <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-5 py-4">
                <div>
                  {title && (
                    <h2 id={titleId} className="text-base font-semibold text-fg">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p id={descId} className="mt-1 text-sm text-muted">
                      {description}
                    </p>
                  )}
                </div>
                {!art && (
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="إغلاق"
                    className="-me-2 -mt-2 inline-flex size-11 items-center justify-center rounded-[var(--radius-md)] text-muted hover:bg-surface-2 hover:text-fg"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            )}
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
            {footer && (
              <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border px-5 py-3">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
