import { cn } from "@/presentation/lib/cn";

export type OrbTone = "blue" | "silver" | "emerald";

const TONE: Record<OrbTone, string> = {
  blue: "orb-blue text-white",
  silver: "orb-silver text-[#5a6273]",
  emerald: "orb-emerald text-white",
};

/** Glossy 3D sphere (ref: plan-selector radios, stepper nodes). */
export function GlossyOrb({
  tone = "blue",
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
      className={cn("orb inline-flex shrink-0 items-center justify-center", TONE[tone], className)}
      style={{ width: size, height: size }}
    >
      {children}
    </span>
  );
}
