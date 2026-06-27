"use client";

import { useRef } from "react";
import { cn } from "@/presentation/lib/cn";

/**
 * Card whose border/surface illuminates under the cursor (Spotlight Border).
 * Writes CSS custom properties directly on the node — no React re-render.
 */
export function SpotlightCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      onMouseMove={(e) => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${e.clientX - r.left}px`);
        el.style.setProperty("--my", `${e.clientY - r.top}px`);
      }}
      className={cn("spotlight relative", className)}
    >
      {children}
    </div>
  );
}
