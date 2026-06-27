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
import { TiltCard } from "@/presentation/components/interactive/tilt-card";
import { Magnetic } from "@/presentation/components/interactive/magnetic";
import { SpotlightCard } from "@/presentation/components/interactive/spotlight-card";
import { CountUp } from "@/presentation/components/interactive/count-up";
import { cn } from "@/presentation/lib/cn";

const ease = [0.22, 1, 0.36, 1] as const;

export function LandingPage() {
  const reduce = useReducedMotion();
  const rise = (delay = 0) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 28 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.8, ease, delay },
        };
  const reveal = reduce
    ? {}
    : {
        initial: { opacity: 0, y: 32 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.3 },
        transition: { duration: 0.8, ease },
      };

  return (
    <div className="min-h-[100dvh] overflow-x-clip bg-bg text-fg">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border-soft bg-bg/75 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between px-5 md:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <LogoMark />
            <span className="text-lg font-semibold tracking-tight">Flousi</span>
          </Link>
          <nav className="hidden items-center gap-9 text-sm text-muted md:flex">
            <a href="#features" className="transition-colors hover:text-fg">Features</a>
            <a href="#how" className="transition-colors hover:text-fg">How it works</a>
            <a href="#start" className="transition-colors hover:text-fg">Get started</a>
          </nav>
          <Magnetic>
            <Link
              href="/dashboard"
              className="inline-flex h-10 items-center gap-1.5 rounded-full px-5 text-sm font-semibold text-white shadow-[var(--shadow-accent)] [background-image:linear-gradient(180deg,var(--blue-400),var(--accent-strong))] transition-[filter] hover:brightness-110"
            >
              Open app <ArrowRight size={15} weight="bold" />
            </Link>
          </Magnetic>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <div className="pointer-events-none absolute inset-x-0 -top-48 h-[560px] opacity-80 [background:radial-gradient(55%_60%_at_50%_0%,rgba(37,99,235,0.22),transparent_70%),radial-gradient(45%_55%_at_82%_8%,rgba(6,182,212,0.18),transparent_72%),radial-gradient(45%_55%_at_14%_14%,rgba(5,150,105,0.16),transparent_72%)]" />
        <div className="relative mx-auto grid max-w-[1240px] items-center gap-12 px-5 pt-16 pb-16 md:px-8 lg:grid-cols-[1.08fr_1fr] lg:pt-24">
          <div>
            <motion.span
              {...rise(0)}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-medium text-muted shadow-sm"
            >
              <Sparkle size={13} weight="fill" className="text-accent" />
              Profit clarity for online stores
            </motion.span>
            <motion.h1
              {...rise(0.06)}
              className="mt-6 font-display text-[clamp(3rem,7vw,5.5rem)] font-semibold leading-[0.92] tracking-[-0.02em]"
            >
              Know your
              <br />
              <span className="bg-[linear-gradient(110deg,var(--blue-500),var(--teal-500)_52%,var(--green-500))] bg-clip-text text-transparent">
                real net profit.
              </span>
            </motion.h1>
            <motion.p {...rise(0.12)} className="mt-6 max-w-[36ch] text-lg leading-relaxed text-muted md:text-xl">
              Flousi turns price, fees and hidden costs into the one number that matters, instantly.
            </motion.p>
            <motion.div {...rise(0.18)} className="mt-8 flex flex-wrap items-center gap-3">
              <Magnetic strength={0.4}>
                <Link
                  href="/dashboard"
                  className="inline-flex h-12 items-center gap-2 rounded-full px-7 text-base font-semibold text-white shadow-[var(--shadow-accent)] [background-image:linear-gradient(180deg,var(--blue-400),var(--accent-strong))] transition-[filter] hover:brightness-110"
                >
                  Open Flousi <ArrowRight size={18} weight="bold" />
                </Link>
              </Magnetic>
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

          <motion.div
            initial={reduce ? undefined : { opacity: 0, y: 40 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.95, ease, delay: 0.15 }}
            className="[perspective:1300px]"
          >
            <TiltCard className="will-change-transform">
              <HeroPreview />
            </TiltCard>
          </motion.div>
        </div>

        {/* Marquee */}
        <div className="relative overflow-hidden border-y border-border-soft bg-surface/50 py-4 [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]">
          <div className="marquee-track gap-10 text-sm font-medium text-subtle">
            {[...PHRASES, ...PHRASES].map((p, i) => (
              <span key={i} className="inline-flex items-center gap-10">
                {p}
                <span className="size-1 rounded-full bg-border" />
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Stats band */}
      <section className="mx-auto max-w-[1240px] px-5 py-16 md:px-8">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {[
            { v: 7, s: "", l: "cost factors tracked" },
            { v: 100, s: "%", l: "local & private" },
            { v: 4, s: " formats", l: "PDF · Excel · CSV · print" },
            { v: 0, s: "ms", l: "to recompute profit", pre: "~" },
          ].map((stat) => (
            <motion.div key={stat.l} {...reveal} className="text-center md:text-left">
              <div className="font-display text-4xl font-semibold tracking-tight md:text-5xl">
                <CountUp value={stat.v} prefix={stat.pre ?? ""} suffix={stat.s} />
              </div>
              <p className="mt-1.5 text-sm text-muted">{stat.l}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features bento */}
      <section id="features" className="mx-auto max-w-[1240px] px-5 pb-20 md:px-8">
        <motion.div {...reveal} className="mb-12 max-w-2xl">
          <h2 className="font-display text-[clamp(2.2rem,4vw,3.4rem)] font-semibold leading-[1.02] tracking-[-0.02em]">
            Everything that eats your margin, in one view.
          </h2>
          <p className="mt-4 text-lg text-muted">
            Stop guessing. Flousi accounts for every fee so the profit you see is the profit you keep.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <Spot className="md:col-span-2" {...reveal}>
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
          </Spot>

          <BentoDark {...reveal}>
            <GlossyOrb tone="emerald" size={52}>
              <TrendUp size={24} weight="bold" />
            </GlossyOrb>
            <div className="mt-auto">
              <div className="font-display text-4xl font-semibold tabular-nums">
                <CountUp value={37.9} decimals={1} suffix="%" />
              </div>
              <p className="mt-1 text-sm text-white/70">Average margin, surfaced automatically.</p>
            </div>
          </BentoDark>

          <Spot {...reveal}>
            <FeatureIcon><Lock size={20} weight="bold" /></FeatureIcon>
            <h3 className="mt-4 text-lg font-semibold">Monthly closing</h3>
            <p className="mt-2 text-sm text-muted">
              Lock a month, snapshot the report, start fresh. History stays read-only.
            </p>
          </Spot>

          <Spot className="md:col-span-2" {...reveal}>
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
          </Spot>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-[1240px] px-5 pb-20 md:px-8">
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
              className="rounded-[var(--radius-lg)] border border-border-soft bg-surface p-7 shadow-sm"
            >
              <span className="font-mono text-sm font-semibold text-accent">{s.n}</span>
              <h3 className="mt-3 text-lg font-semibold">{s.t}</h3>
              <p className="mt-2 text-sm text-muted">{s.d}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Dark glow CTA */}
      <section id="start" className="mx-auto max-w-[1240px] px-5 pb-24 md:px-8">
        <motion.div
          {...reveal}
          className="grainy mesh-night relative overflow-hidden rounded-[var(--radius-xl)] px-8 py-20 text-center text-white shadow-xl md:py-28"
        >
          <div className="relative z-[2] mx-auto max-w-2xl">
            <h2 className="font-display text-[clamp(2.4rem,5vw,3.6rem)] font-semibold leading-[1] tracking-[-0.02em]">
              Start with your real numbers.
            </h2>
            <p className="mt-5 text-lg text-white/75">
              Free, local-first, and ready in seconds. Your data never leaves your browser.
            </p>
            <Magnetic strength={0.5}>
              <Link
                href="/dashboard"
                className="mt-9 inline-flex h-12 items-center gap-2 rounded-full bg-white px-8 text-base font-semibold text-[#0b1220] transition-transform hover:scale-[1.02]"
              >
                Open Flousi <ArrowUpRight size={18} weight="bold" />
              </Link>
            </Magnetic>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border-soft">
        <div className="mx-auto flex max-w-[1240px] flex-col items-center justify-between gap-4 px-5 py-10 text-sm text-muted md:flex-row md:px-8">
          <div className="flex items-center gap-2.5">
            <LogoMark />
            <span className="font-semibold text-fg">Flousi</span>
          </div>
          <p>Real net profit for online stores and small businesses.</p>
          <Link href="/dashboard" className="font-medium text-accent hover:underline">Open app</Link>
        </div>
      </footer>
    </div>
  );
}

const PHRASES = ["Shopify", "Etsy", "Amazon", "Instagram", "TikTok Shop", "Marketplaces"];

/* ---------------- Building blocks ---------------- */

function FeatureIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex size-11 items-center justify-center rounded-[var(--radius-md)] bg-accent-soft text-accent">
      {children}
    </span>
  );
}

function Spot({
  children,
  className,
  ...motionProps
}: { children: React.ReactNode; className?: string } & React.ComponentProps<typeof motion.div>) {
  return (
    <motion.div {...motionProps} className={cn("bento-hover", className)}>
      <SpotlightCard className="h-full rounded-[var(--radius-xl)] border border-border-soft bg-surface p-7 shadow-sm">
        {children}
      </SpotlightCard>
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
      className="grainy mesh-night relative flex min-h-[210px] flex-col gap-4 overflow-hidden rounded-[var(--radius-xl)] p-7 text-white shadow-md"
    >
      <div className="relative z-[2] flex h-full flex-col gap-4">{children}</div>
    </motion.div>
  );
}

function HeroPreview() {
  return (
    <div className="relative" style={{ transform: "translateZ(40px)" }}>
      <div className="absolute -inset-8 -z-10 rounded-[36px] [background:radial-gradient(60%_60%_at_70%_20%,rgba(37,99,235,0.20),transparent_70%)]" />
      <div className="rounded-[var(--radius-xl)] border border-border-soft bg-surface p-4 shadow-xl">
        <div className="grainy mesh-night relative overflow-hidden rounded-[var(--radius-lg)] p-5 text-white">
          <div className="relative z-[2]">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/75">Net profit · this month</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-xs font-semibold backdrop-blur-sm">
                <TrendUp size={12} weight="bold" /> +12.4%
              </span>
            </div>
            <div className="mt-2 font-mono text-4xl font-semibold tracking-tight tabular-nums">
              <CountUp value={4820.5} prefix="$" decimals={2} />
            </div>
            <Sparkline />
          </div>
        </div>
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
