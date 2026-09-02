import { cn } from "@/presentation/lib/cn";

export type OrbTone = "sand" | "silver" | "emerald";

/**
 * A flat disc carrying one glyph.
 *
 * It was a glossy 3D sphere — a radial highlight, a rim light and a cast shadow,
 * three lighting effects to hold a checkmark. Nothing in this product lifts any
 * more (see the surfaces note in ritm.css), and a sphere is the loudest possible
 * way to say "step two of four". The name is kept because the call sites read
 * fine with it and renaming a component is not a design decision.
 */
const TONE: Record<OrbTone, string> = {
  sand: "bg-accent-fill text-accent-fill-fg",
  silver: "bg-surface-2 text-muted",
  emerald: "bg-success-soft text-success",
};

export function GlossyOrb({
  tone = "sand",
  size = 44,
  className,
  children,
}: {
  tone?: OrbTone;
  size?: number;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full",
        TONE[tone],
        className,
      )}
      style={{ width: size, height: size }}
    >
      {children}
    </span>
  );
}
