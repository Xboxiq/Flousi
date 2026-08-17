"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CaretDoubleLeft, Check, Lock } from "@phosphor-icons/react";
import { Spinner } from "@/presentation/components/ui";
import { cn } from "@/presentation/lib/cn";

interface SlideToCommitProps {
  /** The instruction written in the channel, e.g. «اسحب لإغلاق الشهر». */
  label: string;
  /** Shown once the slide lands and the work is done. */
  doneLabel: string;
  onCommit: () => Promise<void> | void;
  disabled?: boolean;
  className?: string;
}

const THUMB = 46;
const COMMIT_AT = 0.92;

/**
 * Slide-to-commit (RECIPES R25, second feedback batch — the "slide to send"
 * control): the one irreversible act on a screen costs a GESTURE, not a click.
 *
 * The thumb follows the pointer 1:1 (an interruption of physics here would read
 * as the app wrestling the hand); only the snap-back and the landing are eased.
 * Direction is logical: progress is measured from the inline-start edge, so the
 * same code slides right-to-left in RTL and left-to-right in LTR (§2's mirror
 * rule applied to a gesture).
 *
 * A gesture cannot be the only path (a11y floor): the thumb is a real button —
 * Enter/Space walk the fill to the end and commit, and under reduced motion they
 * commit immediately. Releasing a drag early always snaps back: closing a month
 * can never happen by accident.
 */
export function SlideToCommit({ label, doneLabel, onCommit, disabled, className }: SlideToCommitProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [state, setState] = useState<"idle" | "working" | "done">("idle");
  // written only from event paths — a re-entry latch, not render state
  const busyRef = useRef(false);

  const commit = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setState("working");
    setProgress(1);
    try {
      await onCommit();
      setState("done");
    } catch {
      // the owner surfaces its own error; the channel just resets
      busyRef.current = false;
      setState("idle");
      setProgress(0);
    }
  }, [onCommit]);

  const progressFromPointer = useCallback((clientX: number) => {
    const el = trackRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const rtl = getComputedStyle(el).direction === "rtl";
    const usable = rect.width - THUMB - 8;
    const travelled = rtl ? rect.right - 4 - THUMB / 2 - clientX : clientX - (rect.left + 4 + THUMB / 2);
    return Math.max(0, Math.min(1, travelled / usable));
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    if (disabled || state !== "idle") return;
    // capture on the BUTTON itself: the event's target is usually the icon
    // inside it, and a capture there lets a fast pointer escape the handlers
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging || state !== "idle") return;
    setProgress(progressFromPointer(e.clientX));
  };
  const onPointerUp = () => {
    if (!dragging) return;
    setDragging(false);
    if (progress >= COMMIT_AT) void commit();
    else setProgress(0);
  };

  const walkTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(walkTimer.current), []);
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (disabled || state !== "idle") return;
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      void commit();
      return;
    }
    // walk the fill so the eye gets the same sentence the finger would write
    setProgress(1);
    walkTimer.current = setTimeout(() => void commit(), 240);
  };

  const done = state === "done";
  const pct = Math.round(progress * 100);

  return (
    <div
      ref={trackRef}
      className={cn("slide-track h-[54px] w-full select-none", disabled && "opacity-60", className)}
      data-settling={dragging ? undefined : "true"}
      data-part="slide-to-commit"
    >
      <div
        className="slide-fill"
        data-done={done ? "true" : undefined}
        style={{ width: `calc(${THUMB + 8}px + ${progress} * (100% - ${THUMB + 8}px))` }}
      />
      {/* the instruction lives in the channel and gets consumed by the fill */}
      <span
        className={cn(
          "absolute inset-0 flex items-center justify-center text-sm font-semibold",
          done ? "text-white" : "text-muted",
        )}
        style={done ? undefined : { opacity: 1 - progress * 1.4 }}
      >
        {done ? doneLabel : label}
      </span>
      <button
        type="button"
        role="slider"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label={label}
        disabled={disabled || state !== "idle"}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
        className={cn(
          "slide-thumb molded flex items-center justify-center rounded-full text-white",
          done ? "molded-success" : "molded-accent",
        )}
        style={{
          width: THUMB,
          height: THUMB,
          insetInlineStart: `calc(4px + ${progress} * (100% - ${THUMB + 8}px))`,
        }}
      >
        {state === "working" ? (
          <Spinner className="size-[18px] text-white" />
        ) : done ? (
          <Check size={20} weight="bold" />
        ) : progress > 0.5 ? (
          <Lock size={19} weight="fill" />
        ) : (
          /* the affordance points toward the travel — flipped by the mirror */
          <CaretDoubleLeft size={19} weight="bold" className="ltr:rotate-180" />
        )}
      </button>
    </div>
  );
}
