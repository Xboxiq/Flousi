"use client";

import { useCallback, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { Check } from "@phosphor-icons/react";
import { cn } from "@/presentation/lib/cn";

interface RitualButtonProps {
  /** The work. Progress runs while it's in flight; the seal lands on resolve. */
  onAction: () => Promise<void>;
  children: React.ReactNode;
  /** Label after the seal, e.g. "تم الحفظ". */
  doneLabel: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

type Phase = "idle" | "working" | "done";

const SHARDS = 10;

/**
 * الطقس — a committing action that reports its result INSIDE itself instead of
 * announcing it in a side toast (nova's "الأثر / consequence" principle,
 * RECIPES R15). Progress fills the button; on success a particle seal bursts
 * and the label becomes the past tense of the verb.
 * Under `prefers-reduced-motion` the fill and shards are skipped — the label
 * still changes, so feedback is never motion-only.
 */
export function RitualButton({
  onAction,
  children,
  doneLabel,
  icon,
  disabled,
  className,
}: RitualButtonProps) {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const timers = useRef<ReturnType<typeof setInterval>[]>([]);

  const run = useCallback(async () => {
    if (phase !== "idle" || disabled) return;
    setPhase("working");
    // Progress is honest about being indeterminate: it eases toward 90% and
    // only completes when the real work resolves.
    if (!reduce) {
      setProgress(12);
      const t = setInterval(() => setProgress((p) => (p < 90 ? p + (90 - p) * 0.18 : p)), 90);
      timers.current.push(t);
    }
    try {
      await onAction();
      setProgress(100);
      setPhase("done");
    } catch {
      setProgress(0);
      setPhase("idle");
    } finally {
      timers.current.forEach(clearInterval);
      timers.current = [];
    }
  }, [phase, disabled, reduce, onAction]);

  const sealed = phase === "done";

  return (
    <button
      type="button"
      onClick={run}
      disabled={disabled || phase !== "idle"}
      aria-live="polite"
      className={cn(
        "clay-press relative inline-flex h-11 items-center justify-center gap-2 overflow-hidden rounded-full",
        "px-6 text-sm font-semibold text-accent-fg",
        "disabled:cursor-not-allowed disabled:opacity-60",
        sealed ? "bg-success" : "bg-accent-strong",
        "transition-colors duration-[var(--motion-base)] ease-[var(--ease-out)]",
        className,
      )}
      style={{ boxShadow: "var(--shadow-cast), inset 0 1px 0 rgb(255 255 255 / 0.28)" }}
    >
      {/* progress lives inside the action */}
      <span
        aria-hidden
        className="ritual-fill"
        style={{ "--ritual-progress": `${progress}%` } as React.CSSProperties}
      />
      <span className="relative z-[1] inline-flex items-center gap-2">
        {sealed ? <Check size={16} weight="bold" /> : icon}
        {sealed ? doneLabel : children}
      </span>
      {/* the seal: shards burst once, then the button rests in its done state */}
      {sealed && !reduce && (
        <span aria-hidden className="pointer-events-none absolute inset-0">
          {Array.from({ length: SHARDS }, (_, i) => {
            const angle = (i / SHARDS) * Math.PI * 2;
            return (
              <span
                key={i}
                className="shard"
                style={
                  {
                    "--sx": `${Math.cos(angle) * 62}px`,
                    "--sy": `${Math.sin(angle) * 34}px`,
                    "--sr": `${(i % 2 ? 1 : -1) * (120 + i * 12)}deg`,
                    animationDelay: `${i * 12}ms`,
                  } as React.CSSProperties
                }
              />
            );
          })}
        </span>
      )}
    </button>
  );
}
