import { cn } from "@/presentation/lib/cn";

export type MeshVariant = "aurora" | "night" | "night-rose";

const MAP: Record<MeshVariant, string> = {
  aurora: "mesh-aurora",
  night: "mesh-night",
  "night-rose": "mesh-night-rose",
};

/**
 * Grainy mesh-gradient surface (grainient). The brand's signature accent
 * material: an aurora for light highlights, a glow-from-below for dark cards.
 * Always carries the fixed grain overlay.
 */
export function MeshSurface({
  variant = "aurora",
  className,
  children,
}: {
  variant?: MeshVariant;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("grainy relative overflow-hidden", MAP[variant], className)}>
      <div className="relative z-[2]">{children}</div>
    </div>
  );
}
