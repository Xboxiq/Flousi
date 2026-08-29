"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Calculator, UsersThree, FolderOpen } from "@phosphor-icons/react";
import { LogoMark } from "@/presentation/components/layout/logo";
import { Delta } from "@/presentation/components/ui";
import { Odometer } from "@/presentation/components/objects/odometer";
import { RingGauge } from "@/presentation/components/objects/ring-gauge";
import { WeekBars } from "@/presentation/components/objects/week-bars";
import { PriceColumn } from "@/presentation/components/objects/price-column";
import { DistributionBar } from "@/presentation/components/objects/distribution-bar";
import { ReportFolder } from "@/presentation/components/objects/report-folder";
import { Magnetic } from "@/presentation/components/interactive/magnetic";
import {
  formatCurrency,
  formatCurrencyCompact,
  formatPercent,
  formatSignedPercent,
} from "@/presentation/lib/format";
import { easeOut as ease } from "@/presentation/lib/motion";
import { cn } from "@/presentation/lib/cn";

/**
 * The landing page is the app, standing still.
 *
 * Every figure and every object on this page comes from the same components the
 * product renders (`Odometer`, `RingGauge`, `WeekBars`, `PriceColumn`,
 * `DistributionBar`, `ReportFolder`) fed a fixed sample month. Nothing here is
 * drawn for the page: there is no hand-rolled SVG sparkline, no gradient bar
 * chart, no mock screenshot. A visitor looking at the hero is looking at the
 * dashboard, and what convinces is that it is the real instrument
 * (`anti-slop-ui` #27, gate A1/G6).
 *
 * The numbers below are ONE illustrative month, labelled as such. Nothing on this
 * page claims to be a platform statistic — the fabricated «~0ms» and «37.9%
 * average margin» were removed in the same gate (A1/G5).
 */

const money = (n: number) => formatCurrency(n, { currency: "IQD", locale: "ar-IQ" });
const compact = (n: number) => formatCurrencyCompact(n, { currency: "IQD", locale: "ar-IQ" });

/** One illustrative month, consistent across every object on the page. */
const SAMPLE = {
  netProfit: 6_312_000,
  margin: 0.261,
  delta: 0.124,
  days: [
    { mark: "ح", value: 214_000, title: "الأحد · ٢١٤٬٠٠٠ د.ع" },
    { mark: "ن", value: 268_000, title: "الاثنين · ٢٦٨٬٠٠٠ د.ع" },
    { mark: "ث", value: 191_000, title: "الثلاثاء · ١٩١٬٠٠٠ د.ع" },
    { mark: "ر", value: 302_000, title: "الأربعاء · ٣٠٢٬٠٠٠ د.ع" },
    { mark: "خ", value: 246_000, title: "الخميس · ٢٤٦٬٠٠٠ د.ع" },
    { mark: "ج", value: 118_000, title: "الجمعة · ١١٨٬٠٠٠ د.ع" },
    { mark: "س", value: 337_000, title: "السبت · ٣٣٧٬٠٠٠ د.ع" },
  ],
};

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
        initial: { opacity: 0, y: 26 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.25 },
        transition: { duration: 0.7, ease },
      };

  return (
    <div className="min-h-[100dvh] overflow-x-clip bg-bg text-fg">
      {/* The header is a solid surface on a hairline, not a frosted pane: text
          scrolling under blurred glass is the one place readability is always
          worse (`anti-slop-ui` #8). */}
      <header className="sticky top-0 z-40 border-b border-border-soft bg-bg">
        <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between px-5 md:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <LogoMark />
            <span className="text-lg font-semibold tracking-tight">RITM</span>
          </Link>
          <nav className="hidden items-center gap-9 text-sm text-muted md:flex">
            <a href="#instrument" className="transition-colors hover:text-fg">الأداة</a>
            <a href="#how" className="transition-colors hover:text-fg">كيف يعمل</a>
            <a href="#start" className="transition-colors hover:text-fg">ابدأ الآن</a>
          </nav>
          <Magnetic>
            <Link
              href="/dashboard"
              className="inline-flex h-10 items-center gap-1.5 rounded-full bg-accent px-5 text-sm font-semibold text-white transition-colors hover:bg-accent-strong"
            >
              فتح التطبيق <ArrowRight size={15} weight="bold" className="rtl:rotate-180" />
            </Link>
          </Magnetic>
        </div>
      </header>

      {/* ───────────────────────── Hero ───────────────────────── */}
      {/* A flat sunken field, its bottom border the horizon. The three stacked
          corner orbs (blue + cyan + emerald) that used to sit here were a light
          source with no position and three accents on one screen — VISUAL-LAW
          §2/§6a and `anti-slop-ui` #11/#3. The depth on this page comes from the
          objects standing on the floor, not from a glow behind them. */}
      <section className="border-b border-border-soft bg-sunken">
        <div className="mx-auto grid max-w-[1240px] items-center gap-14 px-5 pt-16 pb-20 md:px-8 lg:grid-cols-[1fr_1.02fr] lg:pt-24">
          <div>
            <motion.p
              {...rise(0)}
              className="flex items-center gap-3 text-sm font-medium text-muted"
            >
              <span className="h-px w-8 bg-border" aria-hidden />
              وضوح الأرباح لمتاجرك الإلكترونية
            </motion.p>
            <motion.h1
              {...rise(0.06)}
              className="mt-5 font-display text-[clamp(2.6rem,5.8vw,4.6rem)] font-semibold leading-[1.2] tracking-[-0.02em]"
            >
              اعرف
              <br />
              <span className="text-accent">صافي ربحك الحقيقي.</span>
            </motion.h1>
            <motion.p
              {...rise(0.12)}
              className="mt-6 max-w-[38ch] text-lg leading-relaxed text-muted md:text-xl"
            >
              رِتم يحوّل السعر والرسوم والتكاليف الخفية إلى الرقم الوحيد المهم، فورًا.
            </motion.p>
            <motion.div {...rise(0.18)} className="mt-8 flex flex-wrap items-center gap-3">
              <Magnetic strength={0.4}>
                <Link
                  href="/dashboard"
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-accent px-7 text-base font-semibold text-white transition-colors hover:bg-accent-strong"
                >
                  افتح رِتم <ArrowRight size={18} weight="bold" className="rtl:rotate-180" />
                </Link>
              </Magnetic>
              <a
                href="#instrument"
                className="inline-flex h-12 items-center rounded-full border border-border bg-surface px-6 text-base font-medium text-fg transition-colors hover:border-fg/25 hover:bg-surface-2"
              >
                شاهد الأداة
              </a>
            </motion.div>

            {/* Three proof points, each carrying its own figure. The green
                CheckCircle bullets that used to stand here said nothing: a tick
                beside a phrase is decoration with a checkmark on it
                (`anti-slop-ui` #25, gate A1/G2). */}
            <motion.dl {...rise(0.24)} className="mt-10 grid max-w-md grid-cols-3">
              {[
                { t: "7", l: "بنود تكلفة" },
                { t: "3", l: "طرق عمولة" },
                { t: "4", l: "صيغ تصدير" },
              ].map((f, i) => (
                <div
                  key={f.l}
                  className={cn("pe-5", i > 0 && "border-s border-border ps-5")}
                >
                  <dt className="font-display text-2xl font-semibold tabular-nums">{f.t}</dt>
                  <dd className="mt-0.5 text-sm text-muted">{f.l}</dd>
                </div>
              ))}
            </motion.dl>
          </div>

          <motion.div
            initial={reduce ? undefined : { opacity: 0, y: 32 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.85, ease, delay: 0.14 }}
          >
            <DashboardReading />
          </motion.div>
        </div>
      </section>

      {/* ───────── The instrument: three narrative rows, alternating ─────────
          Not a bento collage and not three equal cards: each row is the real
          object at working size beside the one thing it answers
          (`anti-slop-ui` #13/#14, gate A1/G7). */}
      <section id="instrument" className="mx-auto max-w-[1240px] px-5 py-20 md:px-8">
        <motion.div {...reveal} className="max-w-2xl">
          <h2 className="font-display text-[clamp(2rem,4vw,3.2rem)] font-semibold leading-[1.16] tracking-[-0.02em]">
            كل ما يلتهم هامشك، جسمٌ يمكنك قراءته.
          </h2>
          <p className="mt-4 text-lg text-muted">
            لا مزيد من التخمين. رِتم يحتسب كل رسم، فالربح الذي تراه هو الربح الذي تحتفظ به.
          </p>
        </motion.div>

        <div className="mt-14 flex flex-col">
          <NarrativeRow
            {...reveal}
            icon={<Calculator size={19} weight="bold" />}
            eyebrow="الحاسبة"
            title="من السعر إلى الربح، صفيحةً صفيحة"
            body="أدخل سعر البيع وبنود التكلفة، فيقف العمود أمامك: ارتفاع كل صفيحة هو حصّتها الحقيقية من السعر، وما يبقى في رأسه هو ربحك. وإن أكلت التكاليف السعر، تجاوز العمود خطّه وقال ذلك."
            frame="w-[290px]"
            object={
              <PriceColumn
                price={85_000}
                netProfit={38_700}
                format={money}
                costs={[
                  { key: "purchase", label: "الشراء", amount: 31_000 },
                  { key: "fees", label: "التوصيل والرسوم", amount: 15_300 },
                ]}
              />
            }
          />

          {/* This one is a band, not a column pair: the bar divides a whole, and a
              whole reads at full width — which is also where its legend has room
              for its labels. Three rows of the same shape would be the card grid
              the skill rejects (#13); the asymmetry is the point. */}
          <motion.div
            {...reveal}
            className="border-t border-border-soft py-14"
          >
            <div className="grid items-end gap-6 lg:grid-cols-[1fr_22rem]">
              <div>
                <span className="inline-flex items-center gap-2.5 text-sm font-semibold text-accent">
                  <span className="squircle size-9 text-accent">
                    <UsersThree size={19} weight="bold" />
                  </span>
                  الفريق
                </span>
                <h3 className="mt-4 font-display text-[clamp(1.5rem,2.5vw,2.1rem)] font-semibold leading-[1.22] tracking-[-0.015em]">
                  منتج بعشرة، يبيعه مندوبك بعشرين
                </h3>
              </div>
              <p className="max-w-[46ch] leading-relaxed text-muted">
                الربح عشرة: خمسة له وخمسة لك. حدّد الطريقة كما اتفقتما، فتُجمَّد لحظة
                البيع ولا يمسّ تعديلها غدًا عمليةً ماضية.
              </p>
            </div>
            <div className="device mt-8 p-5 sm:p-7">
              <DistributionBar
                className="mx-auto max-w-[820px]"
                total={20_000}
                format={money}
                formatShare={(n) => formatPercent(n, { digits: 0 })}
                label="قسمة بيعة واحدة: التكلفة، حصّة المندوب، وما يبقى للتاجر"
                parts={[
                  { id: "cost", label: "تكلفة المنتج", amount: 10_000, kind: "spend" },
                  { id: "rep", label: "حصّة المندوب", amount: 5_000, kind: "spend" },
                  { id: "owner", label: "يبقى لك", amount: 5_000, kind: "keep" },
                ]}
              />
            </div>
          </motion.div>

          <NarrativeRow
            {...reveal}
            flip
            icon={<FolderOpen size={19} weight="bold" />}
            eyebrow="الإغلاق والتقارير"
            title="أغلق الشهر، وابقَ قادرًا على العودة إليه"
            body="الإغلاق يحفظ لقطة الشهر ويقفلها للقراءة فقط، فلا يتغيّر تقرير أُصدر. والملف يحمل ما أُودع فيه فعلًا: تقارير شهرية وسنوية وللمنتجات والمصاريف، وتصدير إلى PDF أو Excel أو CSV أو الطباعة."
            frame="w-[240px] py-10"
            object={<ReportFolder sheets={3} />}
          />
        </div>
      </section>

      {/* ───────────────────── How it works: a spine ───────────────────── */}
      <section id="how" className="border-y border-border-soft bg-sunken">
        <div className="mx-auto max-w-[1240px] px-5 py-20 md:px-8">
          <div className="grid gap-12 lg:grid-cols-[22rem_1fr]">
            <motion.h2
              {...reveal}
              className="font-display text-[clamp(1.9rem,3.4vw,2.6rem)] font-semibold leading-[1.18] tracking-[-0.02em] lg:sticky lg:top-24 lg:self-start"
            >
              ثلاث خطوات، ثم يعمل وحده.
            </motion.h2>
            <ol className="flex flex-col">
              {[
                {
                  t: "أضف منتجك",
                  d: "سعر البيع، ثم الشراء والتوصيل والتغليف ورسوم المنصّة ورسوم الدفع والضريبة وأي بند آخر. القيم الافتراضية تُملأ لك من الإعدادات.",
                },
                {
                  t: "سجّل البيعة",
                  d: "اختر المنتج والكمية والسعر الفعلي والمندوب. يُحسب صافي الربح والهامش والعائد ونقطة التعادل وحصّة المندوب في اللحظة نفسها.",
                },
                {
                  t: "أغلق الشهر وصدّر",
                  d: "أغلق الفترة، فتُحفظ لقطتها ويبدأ الشهر الجديد نظيفًا. سوّ حسابات مندوبيك من سجّل واحد.",
                },
              ].map((s, i) => (
                <motion.li
                  key={s.t}
                  {...reveal}
                  transition={{ duration: 0.6, ease, delay: i * 0.07 }}
                  className="grid gap-x-6 gap-y-2 border-t border-border py-8 first:border-t-0 first:pt-0 sm:grid-cols-[4rem_1fr]"
                >
                  <span className="font-mono text-sm font-semibold text-accent tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="text-xl font-semibold">{s.t}</h3>
                    <p className="mt-2 max-w-[52ch] leading-relaxed text-muted">{s.d}</p>
                  </div>
                </motion.li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ───────────────────────── Close ───────────────────────── */}
      <section id="start" className="mx-auto max-w-[1240px] px-5 py-24 md:px-8">
        <motion.div
          {...reveal}
          /* A solid graphite slab with a real rim, not a mesh-gradient panel: the
             page's one dark surface earns its depth from the mould, not from a
             multi-stop wash (`anti-slop-ui` #1, VISUAL-LAW §14). */
          className="molded-graphite relative overflow-hidden rounded-[var(--radius-xl)] px-8 py-20 text-center text-white md:py-24"
        >
          <div className="mx-auto max-w-2xl">
            <h2 className="font-display text-[clamp(2.1rem,4.4vw,3.2rem)] font-semibold leading-[1.16] tracking-[-0.02em]">
              ابدأ بأرقامك الحقيقية.
            </h2>
            <p className="mt-5 text-lg text-white/75">
              مجاني، ويعمل داخل متصفّحك. لا حساب، ولا خادم، ولا بيانات تغادر جهازك.
            </p>
            <Link
              href="/dashboard"
              className="mt-9 inline-flex h-12 items-center gap-2 rounded-full bg-white px-8 text-base font-semibold text-ink transition-colors hover:bg-white/90"
            >
              افتح رِتم <ArrowRight size={18} weight="bold" className="rtl:rotate-180" />
            </Link>
          </div>
        </motion.div>
      </section>

      <footer className="border-t border-border-soft">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-6 px-5 py-10 text-sm text-muted md:flex-row md:items-center md:px-8">
          <div className="flex items-center gap-2.5">
            <LogoMark />
            <span className="font-semibold text-fg">RITM</span>
          </div>
          <p className="md:max-w-[34ch]">صافي الربح الحقيقي للمتاجر الإلكترونية والأعمال الصغيرة.</p>
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 md:ms-auto">
            <Link href="/legal/terms" className="transition-colors hover:text-fg">
              شروط الاستخدام
            </Link>
            <Link href="/legal/privacy" className="transition-colors hover:text-fg">
              سياسة الخصوصية
            </Link>
            <Link href="/dashboard" className="font-medium text-accent hover:underline">
              فتح التطبيق
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

/* ---------------- Building blocks ---------------- */

/**
 * The dashboard's own headline panel, rendered from the same three objects the
 * dashboard renders. This is the product demo (`anti-slop-ui` #27): what stands
 * in the hero is not a picture of the app.
 */
function DashboardReading() {
  return (
    <div className="device p-4 sm:p-5">
      <p className="px-1 text-xs font-semibold text-muted">
        لوحة رِتم · شهر نموذجي
      </p>
      <div className="halftone mt-3 flex flex-col gap-6 rounded-[var(--radius-2xl)] p-5">
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-4">
          <div className="min-w-0">
            <span className="text-sm font-semibold text-fg/70">صافي الربح · هذا الشهر</span>
            <div className="mt-2 text-fg">
              <Odometer
                value={SAMPLE.netProfit}
                format={money}
                drumHeight={1.3}
                className="text-[28px] font-bold leading-none sm:text-[40px]"
              />
            </div>
            <span className="mt-3 flex items-center gap-2">
              <Delta value={SAMPLE.delta} label={formatSignedPercent(SAMPLE.delta)} />
              <span className="text-xs font-medium text-fg/70">مقابل الشهر السابق</span>
            </span>
          </div>
          <RingGauge
            value={SAMPLE.margin}
            label={formatPercent(SAMPLE.margin)}
            caption="الهامش"
            size={92}
            tone="success"
          />
        </div>

        <div className="rounded-[var(--radius-lg)] bg-surface/70 p-3">
          <span className="px-1 text-[11px] font-semibold text-fg/70">آخر 7 أيام</span>
          <WeekBars
            className="mt-7"
            height={64}
            days={SAMPLE.days}
            activeIndex={SAMPLE.days.length - 1}
            activeLabel={compact(SAMPLE.days[SAMPLE.days.length - 1].value)}
            activeCaption="السبت"
          />
        </div>
      </div>
    </div>
  );
}

/**
 * One claim, one object, at the size the app renders it. `flip` swaps which side
 * the object stands on so three rows do not read as a stack of identical cards
 * — the asymmetry the skill asks for in place of a 3-column grid (#13).
 */
function NarrativeRow({
  icon,
  eyebrow,
  title,
  body,
  object,
  frame,
  flip,
  ...motionProps
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  body: string;
  object: React.ReactNode;
  /** Width (and any extra padding) the housing gives this particular object. */
  frame?: string;
  flip?: boolean;
} & React.ComponentProps<typeof motion.div>) {
  return (
    <motion.div
      {...motionProps}
      className="grid items-center gap-10 border-t border-border-soft py-14 first:border-t-0 first:pt-0 lg:grid-cols-2 lg:gap-16"
    >
      <div className={cn(flip && "lg:order-2")}>
        <span className="inline-flex items-center gap-2.5 text-sm font-semibold text-accent">
          <span className="squircle size-9 text-accent">{icon}</span>
          {eyebrow}
        </span>
        <h3 className="mt-4 font-display text-[clamp(1.5rem,2.5vw,2.1rem)] font-semibold leading-[1.22] tracking-[-0.015em]">
          {title}
        </h3>
        <p className="mt-4 max-w-[46ch] leading-relaxed text-muted">{body}</p>
      </div>
      {/* The object sits in a moulded housing, sized to it. An earlier pass put it
          on a `.stage` light pool instead: the pool is an ellipse sized to its
          CONTAINER, so beside a small folder it rendered as a detached blue blob
          in empty space — the orb of `anti-slop-ui` #11, arrived at by accident.
          A pool needs a subject standing in it, and the housing is the honest
          frame when the subject is smaller than its column (VISUAL-LAW §7). */}
      <div className={cn("flex justify-center", flip && "lg:order-1")}>
        <div className={cn("device flex justify-center px-6 py-7", frame)}>{object}</div>
      </div>
    </motion.div>
  );
}
