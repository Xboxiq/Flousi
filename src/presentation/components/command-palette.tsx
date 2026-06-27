"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { MagnifyingGlass, ArrowRight } from "@phosphor-icons/react";
import { NAV_GROUPS } from "./layout/nav-config";
import { useUiStore } from "@/presentation/stores/ui-store";
import { cn } from "@/presentation/lib/cn";

interface Command {
  label: string;
  group: string;
  href: string;
  keywords?: string;
}

const ACTIONS: Command[] = [
  { label: "Add product", group: "Actions", href: "/products/new", keywords: "new create" },
  { label: "Open calculator", group: "Actions", href: "/calculator", keywords: "calc profit" },
  { label: "Close the month", group: "Actions", href: "/periods", keywords: "period lock" },
];

export function CommandPalette() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const open = useUiStore((s) => s.commandOpen);
  const setOpen = useUiStore((s) => s.setCommandOpen);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands = useMemo<Command[]>(() => {
    const nav = NAV_GROUPS.flatMap((g) =>
      g.items.map((i) => ({ label: i.label, group: g.label, href: i.href })),
    );
    return [...ACTIONS, ...nav];
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => (c.label + " " + (c.keywords ?? "")).toLowerCase().includes(q));
  }, [commands, query]);

  // Global ⌘K / Ctrl+K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!useUiStore.getState().commandOpen);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset palette state on open
      setQuery("");
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 20);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [open]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- keep highlight on first result as query changes
    setActive(0);
  }, [query]);

  const run = (c: Command) => {
    setOpen(false);
    router.push(c.href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && results[active]) {
      e.preventDefault();
      run(results[active]);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-[12vh]">
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            onClick={() => setOpen(false)}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            className="relative z-10 w-full max-w-xl overflow-hidden rounded-[var(--radius-xl)] border border-border bg-surface shadow-xl"
            initial={reduce ? false : { opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, scale: 0.97, y: 10 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            onKeyDown={onKeyDown}
          >
            <div className="flex items-center gap-3 border-b border-border px-4">
              <MagnifyingGlass size={18} className="text-subtle" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search or jump to…"
                className="h-14 w-full bg-transparent text-base text-fg placeholder:text-subtle focus:outline-none"
              />
              <kbd className="hidden rounded-md border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-subtle sm:block">
                esc
              </kbd>
            </div>
            <ul className="max-h-[52vh] overflow-y-auto p-2">
              {results.length === 0 && (
                <li className="px-3 py-6 text-center text-sm text-muted">No matches.</li>
              )}
              {results.map((c, i) => (
                <li key={c.href + c.label}>
                  <button
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onClick={() => run(c)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-[var(--radius-md)] px-3 py-2.5 text-left text-sm transition-colors",
                      i === active ? "bg-accent-soft text-accent" : "text-fg hover:bg-surface-2",
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-xs text-subtle">{c.group}</span>
                      <span className="text-subtle">/</span>
                      <span className="font-medium">{c.label}</span>
                    </span>
                    <ArrowRight size={14} className={i === active ? "opacity-100" : "opacity-0"} />
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
