"use client";

import { useState } from "react";
import { ArrowUp, CurrencyDollar, Question, Sun, Moon, Desktop } from "@phosphor-icons/react";
import {
  GlossyOrb,
  Segmented,
  Stepper,
} from "@/presentation/components/ui";

export function MaterialsDemo() {
  const [view, setView] = useState<"day" | "week" | "month">("week");

  return (
    <div className="flex flex-col gap-12">
      {/* Glossy orbs */}
      <Section title="Glossy 3D orbs">
        <div className="flex flex-wrap items-center gap-6">
          <GlossyOrb tone="sand" size={56}>
            <ArrowUp size={24} weight="bold" />
          </GlossyOrb>
          <GlossyOrb tone="silver" size={56}>
            <CurrencyDollar size={22} weight="bold" />
          </GlossyOrb>
          <GlossyOrb tone="emerald" size={56} />
          <GlossyOrb tone="silver" size={40} />
          <GlossyOrb tone="sand" size={40} />
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
          aria-label="عيّنة عناصر التحكم"
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
      <h2 className="mb-4 text-sm font-medium text-subtle">{title}</h2>
      {children}
    </section>
  );
}
