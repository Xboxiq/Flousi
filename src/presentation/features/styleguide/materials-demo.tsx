"use client";

import { useState } from "react";
import { ArrowUp, CurrencyDollar, Question, Sun, Moon, Desktop } from "@phosphor-icons/react";
import {
  Button,
  GlossyOrb,
  MeshSurface,
  Segmented,
  Stepper,
} from "@/presentation/components/ui";

export function MaterialsDemo() {
  const [view, setView] = useState<"day" | "week" | "month">("week");

  return (
    <div className="flex flex-col gap-12">
      {/* Grainient mesh surfaces */}
      <Section title="Grainient surfaces">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <MeshSurface variant="aurora" className="flex min-h-[180px] flex-col justify-between rounded-[var(--radius-xl)] p-6 text-white shadow-md">
            <span className="text-sm font-medium text-white/80">Net profit</span>
            <div>
              <div className="font-mono text-3xl font-semibold tabular-nums">$4,820.50</div>
              <div className="mt-1 text-sm text-white/75">Aurora</div>
            </div>
          </MeshSurface>
          <MeshSurface variant="night" className="flex min-h-[180px] flex-col items-center justify-between rounded-[var(--radius-xl)] p-6 text-center text-white shadow-md">
            <span className="text-base font-semibold">Start Working Smarter</span>
            <Button variant="secondary" className="!bg-white !text-[#11141b]">
              Get started
            </Button>
          </MeshSurface>
          <MeshSurface variant="night-rose" className="flex min-h-[180px] items-end rounded-[var(--radius-xl)] p-6 text-white shadow-md">
            <span className="text-sm text-white/80">Night · rose</span>
          </MeshSurface>
        </div>
      </Section>

      {/* Glossy orbs */}
      <Section title="Glossy 3D orbs">
        <div className="flex flex-wrap items-center gap-6">
          <GlossyOrb tone="blue" size={56}>
            <ArrowUp size={24} weight="bold" />
          </GlossyOrb>
          <GlossyOrb tone="silver" size={56}>
            <CurrencyDollar size={22} weight="bold" />
          </GlossyOrb>
          <GlossyOrb tone="emerald" size={56} />
          <GlossyOrb tone="silver" size={40} />
          <GlossyOrb tone="blue" size={40} />
        </div>
      </Section>

      {/* Connected stepper */}
      <Section title="Connected stepper">
        <div className="neu-raised max-w-sm rounded-[var(--radius-xl)] bg-surface p-6">
          <Stepper
            steps={[
              { label: "Choose wallet", state: "active", icon: <ArrowUp size={20} weight="bold" /> },
              { label: "Choose amount", state: "todo", icon: <CurrencyDollar size={18} weight="bold" /> },
              { label: "Choose coin", state: "todo", icon: <Question size={18} weight="bold" /> },
            ]}
          />
        </div>
      </Section>

      {/* Segmented */}
      <Section title="Segmented control">
        <Segmented
          options={[
            { label: "Day", value: "day", icon: <Sun size={15} /> },
            { label: "Week", value: "week", icon: <Moon size={15} /> },
            { label: "Month", value: "month", icon: <Desktop size={15} /> },
          ]}
          value={view}
          onChange={setView}
        />
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-subtle">{title}</h2>
      {children}
    </section>
  );
}
