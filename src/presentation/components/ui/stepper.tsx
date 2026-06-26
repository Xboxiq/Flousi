import { Check } from "@phosphor-icons/react/dist/ssr";
import { GlossyOrb } from "./glossy-orb";
import { cn } from "@/presentation/lib/cn";

export type StepState = "done" | "active" | "todo";

export interface Step {
  label: string;
  description?: string;
  icon?: React.ReactNode;
  state: StepState;
}

/** Connected vertical stepper with glossy orb nodes (the signature Flousi flow). */
export function Stepper({ steps, className }: { steps: Step[]; className?: string }) {
  return (
    <ol className={cn("relative flex flex-col", className)}>
      {steps.map((step, i) => {
        const last = i === steps.length - 1;
        return (
          <li key={step.label} className="relative flex gap-4 pb-7 last:pb-0">
            {!last && (
              <span
                aria-hidden
                className={cn(
                  "absolute left-[22px] top-12 h-[calc(100%-1rem)] w-0.5 -translate-x-1/2 rounded-full",
                  step.state === "done" ? "bg-accent/40" : "bg-border",
                )}
              />
            )}
            <Node step={step} />
            <div className="pt-2.5">
              <div
                className={cn(
                  "text-lg font-semibold leading-tight",
                  step.state === "todo" ? "text-subtle" : "text-fg",
                )}
              >
                {step.label}
              </div>
              {step.description && (
                <div className="mt-0.5 text-sm text-muted">{step.description}</div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function Node({ step }: { step: Step }) {
  if (step.state === "done") {
    return (
      <GlossyOrb tone="emerald" size={44}>
        <Check size={20} weight="bold" />
      </GlossyOrb>
    );
  }
  if (step.state === "active") {
    return <GlossyOrb tone="blue" size={44}>{step.icon}</GlossyOrb>;
  }
  return (
    <span className="neu-raised-sm inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-surface text-subtle">
      {step.icon}
    </span>
  );
}
