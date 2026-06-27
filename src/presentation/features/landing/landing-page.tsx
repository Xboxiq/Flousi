"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  ArrowUpRight,
  TrendUp,
  Calculator,
  Lock,
  FileArrowDown,
  Sparkle,
  CheckCircle,
} from "@phosphor-icons/react";
import { LogoMark } from "@/presentation/components/layout/logo";
import { GlossyOrb } from "@/presentation/components/ui";
import { cn } from "@/presentation/lib/cn";

const ease = [0.22, 1, 0.36, 1] as const;

export function LandingPage() {
  const reduce = useReducedMotion();
  const rise = (delay = 0) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 24 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.7, ease, delay },
        };
  const reveal = reduce
    ? {}
    : {
        initial: { opacity: 0, y: 28 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.3 },
        transition: { duration: 0.7, ease },
      };

  return (
    <div className="min-h-[100dvh] bg-bg text-fg">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border-soft bg-bg/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-5 md:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <LogoMark />
            <span className="text-lg font-semibold tracking-tight">Flousi</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-muted md:flex">
            <a href="#features" className="transition-colors hover:text-fg">Features</a>
            <a href="#how" className="transition-colors hover:text-fg">How it works</a>
            <a href="#start" className="transition-colors hover:text-fg">Pricing</a>
          </nav>
          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center gap-1.5 rounded-full px-5 text-sm font-semibold text-white shadow-[var(--shadow-accent)] [background-image:linear-gradient(180deg,var(--blue-400),var(--accent-strong))] transition-[filter] hover:brightness-110"
          >
            Open app
            <ArrowRight size={15} weight="bold" />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* ambient grainient glow */}
        <div className="pointer-events-none absolute inset-x-0 -top-40 h-[480px] opacity-70 [background:radial-gradient(60%_60%_at_50%_0%,rgba(37,99,235,0.20),transparent_70%),radial-gradient(40%_50%_at_80%_10%,rgba(6,182,212,0.16),transparent_70%),radial-gradient(40%_50%_at_15%_15%,rgba(5,150,105,0.14),transparent_70%)]" />
        <div className="relative mx-auto grid max-w-[1200px] items-center gap-12 px-5 pt-16 pb-20 md:px-8 lg:grid-cols-[1.05fr_1fr] lg:pt-24">
          <div>
            <motion.span
              {...rise(0)}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted shadow-sm"
            >
              <Sparkle size={13} weight="fill" className="text-accent" />
              Profit clarity for online stores
            </motion.span>
            <motion.h1
              {...rise(0.06)}
              className="mt-5 text-[clamp(2.6rem,6vw,4.5rem)] font-semibold leading-[0.98] tracking-[-0.03em]"
            >
              Know your{" "}
              <span className="bg-[linear-gradient(120deg,var(--blue-500),var(--teal-500)_55%,var(--green-500))] bg-clip-text text-transparent">
                real net profit.
              </span>
            </motion.h1>
            <motion.p {...rise(0.12)} className="mt-5 max-w-[34ch] text-lg leading-relaxed text-muted">
              Flousi turns selling price, fees and hidden costs into the one number that matters, instantly.
            </motion.p>
            <motion.div {...rise(0.18)} className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/dashboard"
                className="inline-flex h-12 items-center gap-2 rounded-full px-6 text-base font-semibold text-white shadow-[var(--shadow-accent)] [background-image:linear-gradient(180deg,var(--blue-400),var(--accent-strong))] transition-[transform,filter] hover:brightness-110 active:scale-[0.98]"
              >
                Open Flousi
                <ArrowRight size={18} weight="bold" />
              </Link>
              <a
                href="#how"
                className="inline-flex h-12 items-center gap-2 rounded-full border border-border bg-surface px-6 text-base font-medium text-fg shadow-sm transition-colors hover:bg-surface-2"
              >
                See how it works
              </a>
            </motion.div>
            <motion.ul {...rise(0.24)} className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
              {["7 cost factors", "Break-even & ROI", "Reports & export"].map((f) => (
                <li key={f} className="inline-flex items-center gap-1.5">
                  <CheckCircle size={16} weight="fill" className="text-success" />
                  {f}
                </li>
              ))}
            </motion.ul>
          </div>

          {/* Live product preview */}
          <motion.div
            initial={reduce ? undefined : { opacity: 0, y: 36, rotateX: 8 }}
            animate={reduce ? undefined : { opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 0.9, ease, delay: 0.15 }}
            className="relative [perspective:1200px]"
          >
            <HeroPreview />
          </motion.div>
        </div>
      </section>

      {/* Features bento */}
      <section id="features" className="mx-auto max-w-[1200px] px-5 py-20 md:px-8">
        <motion.div {...reveal} className="mb-10 max-w-2xl">
          <h2 className="text-[clamp(1.9rem,3.5vw,2.75rem)] font-semibold tracking-tight">
            Everything that eats your margin, in one view.
          </h2>
          <p className="mt-3 text-lg text-muted">
            Stop guessing. Flousi accounts for every fee so the profit you see is the profit you keep.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <BentoCard className="md:col-span-2" {...reveal}>
            <div className="flex h-full flex-col justify-between gap-6 md:flex-row md:items-center">
              <div className="max-w-sm">
                <FeatureIcon><Calculator size={20} weight="bold" /></FeatureIcon>
                <h3 className="mt-4 text-xl font-semibold">Live profit calculator</h3>
                <p className="mt-2 text-muted">
                  Type a price and your costs. Net profit, margin, ROI and break-even update on every keystroke.
                </p>
              </div>
              <CostToProfit />
            </div>
          </BentoCard>

          <BentoDark {...reveal}>
            <GlossyOrb tone="emerald" size={52}>
              <TrendUp size={24} weight="bold" />
            </GlossyOrb>
            <div className="mt-auto">
              <div className="font-mono text-3xl font-semibold tabular-nums">37.9%</div>
              <p className="mt-1 text-sm text-white/70">Average margin, surfaced automatically.</p>
            </div>
          </BentoDark>

          <BentoCard {...reveal}>
            <FeatureIcon><Lock size={20} weight="bold" /></FeatureIcon>
            <h3 className="mt-4 text-lg font-semibold">Monthly closing</h3>
            <p className="mt-2 text-sm text-muted">
              Lock a month, snapshot the report, start fresh. History stays read-only.
            </p>
          </BentoCard>

          <BentoCard className="md:col-span-2" {...reveal}>
            <div className="flex h-full flex-col justify-between gap-6 md:flex-row md:items-end">
              <div className="max-w-xs">
                <FeatureIcon><FileArrowDown size={20} weight="bold" /></FeatureIcon>
                <h3 className="mt-4 text-xl font-semibold">Reports &amp; export</h3>
                <p className="mt-2 text-muted">
                  Monthly, yearly, product and expense reports. Export to PDF, Excel or CSV.
                </p>
              </div>
              <MiniBars />
            </div>
          </BentoCard>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-[1200px] px-5 py-12 md:px-8">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            { n: "01", t: "Add your product", d: "Selling price plus purchase, shipping, packaging, fees and tax." },
            { n: "02", t: "See the truth instantly", d: "Net profit, margin, ROI and break-even, computed precisely." },
            { n: "03", t: "Close, report, repeat", d: "Lock each month and export clean financial reports." },
          ].map((s, i) => (
            <motion.div
              key={s.n}
              {...reveal}
              transition={{ duration: 0.6, ease, delay: i * 0.08 }}
              className="rounded-[var(--radius-lg)] border border-border-soft bg-surface p-6 shadow-sm"
            >
              <span className="font-mono text-sm font-semibold text-accent">{s.n}</span>
              <h3 className="mt-3 text-lg font-semibold">{s.t}</h3>
              <p className="mt-2 text-sm text-muted">{s.d}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Dark glow CTA */}
      <section id="start" className="mx-auto max-w-[1200px] px-5 py-20 md:px-8">
        <motion.div
          {...reveal}
          className="grainy mesh-night relative overflow-hidden rounded-[var(--radius-xl)] px-8 py-16 text-center text-white shadow-xl md:py-24"
        >
          <div className="relative z-[2] mx-auto max-w-xl">
            <h2 className="text-[clamp(2rem,4vw,3rem)] font-semibold tracking-tight">
              Start with your real numbers.
            </h2>
            <p className="mt-4 text-lg text-white/75">
              Free, local-first, and ready in seconds. Your data never leaves your browser.
            </p>
            <Link
              href="/dashboard"
              className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-white px-7 text-base font-semibold text-[#0b1220] transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Open Flousi
              <ArrowUpRight size={18} weight="bold" />
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border-soft">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-4 px-5 py-10 text-sm text-muted md:flex-row md:px-8">
          <div className="flex items-center gap-2.5">
            <LogoMark />
            <span className="font-semibold text-fg">Flousi</span>
          </div>
          <p>Real net profit for online stores and small businesses.</p>
          <Link href="/dashboard" className="font-medium text-accent hover:underline">
            Open app
          </Link>
        </div>
      </footer>
    </div>
  );
}

/* ---------------- Building blocks ---------------- */

function FeatureIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex size-11 items-center justify-center rounded-[var(--radius-md)] bg-accent-soft text-accent">
      {children}
    </span>
  );
}

function BentoCard({
  children,
  className,
  ...motionProps
}: { children: React.ReactNode; className?: string } & React.ComponentProps<typeof motion.div>) {
  return (
    <motion.div
      {...motionProps}
      className={cn(
        "bento-hover rounded-[var(--radius-xl)] border border-border-soft bg-surface p-6 shadow-sm",
        className,
      )}
    >
      {children}
    </motion.div>
  );
}

function BentoDark({
  children,
  ...motionProps
}: { children: React.ReactNode } & React.ComponentProps<typeof motion.div>) {
  return (
    <motion.div
      {...motionProps}
      className="grainy mesh-night relative flex min-h-[200px] flex-col gap-4 overflow-hidden rounded-[var(--radius-xl)] p-6 text-white shadow-md"
    >
      <div className="relative z-[2] flex h-full flex-col gap-4">{children}</div>
    </motion.div>
  );
}

/** A real, on-brand product preview (allowed by taste-skill: real component preview). */
function HeroPreview() {
  return (
    <div className="relative">
      <div className="absolute -inset-6 -z-10 rounded-[32px] [background:radial-gradient(60%_60%_at_70%_20%,rgba(37,99,235,0.18),transparent_70%)]" />
      <div className="rounded-[var(--radius-xl)] border border-border-soft bg-surface p-4 shadow-xl">
        {/* mesh net-profit card */}
        <div className="grainy mesh-night relative overflow-hidden rounded-[var(--radius-lg)] p-5 text-white">
          <div className="relative z-[2]">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/75">Net profit · this month</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-xs font-semibold backdrop-blur-sm">
                <TrendUp size={12} weight="bold" /> +12.4%
              </span>
            </div>
            <div className="mt-2 font-mono text-4xl font-semibold tracking-tight tabular-nums">$4,820.50</div>
            <Sparkline />
          </div>
        </div>
        {/* stat tiles */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          {[
            { l: "Revenue", v: "$18.3k" },
            { l: "Costs", v: "$13.4k" },
            { l: "Margin", v: "26.3%" },
          ].map((s) => (
            <div key={s.l} className="rounded-[var(--radius-md)] border border-border-soft bg-surface-2 px-3 py-2.5">
              <div className="text-xs text-muted">{s.l}</div>
              <div className="mt-0.5 font-mono text-sm font-semibold tabular-nums">{s.v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Sparkline() {
  return (
    <svg viewBox="0 0 320 64" className="mt-3 h-16 w-full" fill="none" preserveAspectRatio="none">
      <defs>
        <linearGradient id="sl" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>
      <path d="M0 50 L40 44 L80 48 L120 32 L160 36 L200 22 L240 26 L280 12 L320 16" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M0 50 L40 44 L80 48 L120 32 L160 36 L200 22 L240 26 L280 12 L320 16 L320 64 L0 64 Z" fill="url(#sl)" />
    </svg>
  );
}

function CostToProfit() {
  const rows = [
    { l: "Selling price", v: "$64.00", tone: "text-fg" },
    { l: "Costs & fees", v: "-$45.80", tone: "text-danger" },
    { l: "Net profit", v: "$18.20", tone: "text-success" },
  ];
  return (
    <div className="w-full max-w-[220px] rounded-[var(--radius-lg)] border border-border-soft bg-surface-2 p-4">
      {rows.map((r, i) => (
        <div
          key={r.l}
          className={cn(
            "flex items-center justify-between py-2 text-sm",
            i === rows.length - 1 && "mt-1 border-t border-border pt-3 font-semibold",
          )}
        >
          <span className="text-muted">{r.l}</span>
          <span className={cn("font-mono tabular-nums", r.tone)}>{r.v}</span>
        </div>
      ))}
    </div>
  );
}

function MiniBars() {
  const bars = [40, 64, 52, 80, 72, 96];
  return (
    <div className="flex h-28 items-end gap-2">
      {bars.map((h, i) => (
        <div
          key={i}
          className="w-6 rounded-t-md [background-image:linear-gradient(180deg,var(--blue-400),var(--accent-strong))]"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}
