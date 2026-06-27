"use client";

import { useEffect } from "react";
import { X } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { SidebarNav } from "./sidebar";
import { Logo } from "./logo";
import { useUiStore } from "@/presentation/stores/ui-store";

/** Mobile slide-in navigation drawer (<lg). */
export function MobileNav() {
  const { mobileNavOpen, setMobileNavOpen } = useUiStore();
  const reduce = useReducedMotion();

  // Close on Escape.
  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMobileNavOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileNavOpen, setMobileNavOpen]);

  return (
    <AnimatePresence>
      {mobileNavOpen && (
        <div className="lg:hidden">
          <motion.div
            className="fixed inset-0 z-40 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setMobileNavOpen(false)}
          />
          <motion.aside
            className="fixed inset-y-0 start-0 z-50 flex w-72 flex-col border-e border-border bg-surface"
            initial={reduce ? false : { x: "-100%" }}
            animate={{ x: 0 }}
            exit={reduce ? undefined : { x: "-100%" }}
            transition={{ duration: 0.24, ease: [0.33, 1, 0.68, 1] }}
          >
            <div className="flex h-16 items-center justify-between border-b border-border px-4">
              <Logo />
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                aria-label="إغلاق القائمة"
                className="inline-flex size-9 items-center justify-center rounded-[var(--radius-md)] text-muted hover:bg-surface-2 hover:text-fg"
              >
                <X size={18} />
              </button>
            </div>
            <div onClick={() => setMobileNavOpen(false)} className="flex flex-1 flex-col">
              <SidebarNav idPrefix="mobile" />
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
