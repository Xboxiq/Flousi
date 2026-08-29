"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { ArrowsSplit } from "@phosphor-icons/react";
import type { DashboardMetrics } from "@/application/analytics";
import type { AppSettings } from "@/domain";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Delta,
  Money,
  Segmented,
  Skeleton,
} from "@/presentation/components/ui";
import { Odometer } from "@/presentation/components/objects/odometer";
import { RingGauge } from "@/presentation/components/objects/ring-gauge";
import { WeekBars } from "@/presentation/components/objects/week-bars";
import {
  DistributionBar,
  type DistributionPart,
} from "@/presentation/components/objects/distribution-bar";
import { COST_LINE_LABELS } from "@/presentation/lib/labels";
import {
  formatCurrency,
  formatPercent,
  formatSignedPercent,
} from "@/presentation/lib/format";
import { cn } from "@/presentation/lib/cn";

/**
 * Recharts is the dashboard's single heaviest import, and P7 moved it BEHIND the
 * rung: this module — and the chart inside it — is not fetched until «الشهر
 * بالتفصيل» opens (gate P7/G3). The skeleton is the exact chart height so nothing
 * shifts when it lands.
 */
const ProfitAreaChart = dynamic(
  () =>
    import("@/presentation/components/charts/profit-area-chart").then((m) => m.ProfitAreaChart),
  { ssr: false, loading: () => <Skeleton className="h-[260px] rounded-[var(--radius-lg)]" /> },
);

/** The chart's window — a real filter, not a decorative range switch (R38). */
const WINDOWS = [
  { label: "3 أشهر", value: "3" },
  { label: "6 أشهر", value: "6" },
  { label: "سنة", value: "12" },
] as const;

/**
 * «التفصيل مرئياً» — the second rung of the ladder: the month's reading as it was
 * before P7, now BEHIND a latch instead of open on arrival. The figure, its margin
 * and week; the curve; the month as one divided whole; the best products.
 */
export function MonthDetail({
  metrics,
  settings,
  monthTarget,
}: {
  metrics: DashboardMetrics;
  settings: AppSettings;
  monthTarget: number;
}) {
  const [window, setWindow] = useState<"3" | "6" | "12">("6");

  const money = (n: number) =>
    formatCurrency(n, { currency: settings.currency, locale: settings.locale });
  const share = (n: number) => formatPercent(n, { locale: settings.locale, digits: 0 });

  const m = metrics.monthly;
  const windowed = useMemo(() => m.slice(-Number(window)), [m, window]);
  const last = m[m.length - 1];
  const prev = m[m.length - 2];
  const profitDelta =
    prev && prev.netProfit
      ? (last.netProfit - prev.netProfit) / Math.abs(prev.netProfit)
      : undefined;

  // The level this month is measured against: the merchant's own target when they
  // set one, otherwise their average over the window — never a round number chosen
  // because it looks tidy (RECIPES R35).
  const windowAverage =
    windowed.length > 0
      ? windowed.reduce((s, p) => s + p.netProfit, 0) / windowed.length
      : 0;
  const threshold = monthTarget
    ? { value: monthTarget, met: metrics.monthProfit >= monthTarget, isTarget: true }
    : windowAverage > 0
      ? { value: windowAverage, met: metrics.monthProfit >= windowAverage, isTarget: false }
      : undefined;

  // «وين راح المال»: this month's revenue taken apart. Lines under 4% become one
  // plate — six slivers of different texture read as stripes, not a composition.
  const spent = metrics.monthTotalCost;
  const kept = metrics.monthProfit;
  const distributionTotal = Math.max(metrics.monthRevenue, spent);
  const MINOR = 0.04;
  const major = metrics.monthCostLines.filter((c) => c.share >= MINOR);
  const minor = metrics.monthCostLines.filter((c) => c.share < MINOR);
  const minorTotal = minor.reduce((sum, c) => sum + c.amount, 0);
  const parts: DistributionPart[] = [
    ...major.map((c) => ({
      id: c.line,
      label: COST_LINE_LABELS[c.line],
      amount: c.amount,
      kind: "spend" as const,
    })),
    ...(minorTotal > 0
      ? [
          {
            id: "minor",
            label: `بنود أخرى (${minor.length})`,
            hint: minor.map((c) => COST_LINE_LABELS[c.line]).join(" · "),
            amount: minorTotal,
            kind: "spend" as const,
          },
        ]
      : []),
    ...(kept >= 0
      ? [{ id: "keep", label: "صافي ربحك", amount: kept, kind: "keep" as const }]
      : []),
  ];
  const overrun = kept < 0 ? { amount: -kept, label: "تجاوز التكاليف" } : undefined;

  return (
    <div className="flex flex-col gap-5">
      {/* the month's headline: drums, dial and the week's capsules (R17/R21/R22) */}
      <div className="halftone rounded-[var(--radius-xl)] p-5" data-part="month-hero">
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-4">
          <div className="min-w-0">
            <span className="text-sm font-semibold text-fg/70">صافي الربح · هذا الشهر</span>
            <div className="mt-2 text-fg" aria-live="polite" aria-atomic="true">
              <Odometer
                value={metrics.monthProfit}
                format={money}
                drumHeight={1.3}
                className={cn(
                  "text-[24px] font-bold leading-none sm:text-[36px]",
                  metrics.monthProfit < 0 && "text-danger",
                )}
              />
            </div>
            {profitDelta !== undefined && (
              <span className="mt-3 flex items-center gap-2">
                <Delta value={profitDelta} label={formatSignedPercent(profitDelta)} />
                <span className="text-xs font-medium text-fg/70">مقابل الشهر السابق</span>
              </span>
            )}
          </div>
          <RingGauge
            value={metrics.margin}
            label={formatPercent(metrics.margin, { locale: settings.locale })}
            caption="الهامش"
            size={88}
            tone={metrics.margin >= 0.2 ? "success" : metrics.margin > 0 ? "accent" : "danger"}
          />
        </div>

        <div className="mt-5 rounded-[var(--radius-lg)] bg-surface/70 p-3 backdrop-blur-[2px]">
          <span className="px-1 text-[11px] font-semibold text-fg/70">آخر 7 أيام</span>
          <WeekBars
            className="mt-7"
            height={64}
            activeIndex={metrics.week.length - 1}
            activeLabel={money(metrics.todayProfit)}
            activeCaption="اليوم"
            days={metrics.week.map((d) => ({
              mark: d.mark,
              value: d.netProfit,
              title: `${d.key}: ${money(d.netProfit)}`,
            }))}
          />
        </div>
      </div>

      {/* the curve */}
      <Card>
        <CardHeader className="flex-col items-stretch gap-3 sm:flex-row sm:items-start">
          <div className="min-w-0">
            <CardTitle>الإيراد وصافي الربح</CardTitle>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted">
              <Legend color="var(--accent)" label="الإيراد" />
              <Legend color="var(--success)" label="صافي الربح" />
              {threshold && (
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-0 w-4 border-t-[1.5px] border-dashed border-success/70" />
                  {threshold.isTarget ? "الهدف" : "معدّلك"}
                  <bdi dir="ltr" className="font-figure tabular-nums text-fg">
                    {money(threshold.value)}
                  </bdi>
                </span>
              )}
            </div>
          </div>
          <Segmented
            className="self-start"
            aria-label="نافذة القراءة"
            options={WINDOWS.map((w) => ({ label: w.label, value: w.value }))}
            value={window}
            onChange={(v) => setWindow(v)}
          />
        </CardHeader>
        <CardContent>
          <ProfitAreaChart
            data={windowed}
            currency={settings.currency}
            locale={settings.locale}
            threshold={threshold}
          />
        </CardContent>
      </Card>

      {/* the month as one divided whole */}
      {parts.length > 0 && (
        <Card>
          <CardHeader className="flex-col items-stretch gap-1 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <ArrowsSplit size={18} className="text-subtle" />
              <CardTitle>وين راح المال؟</CardTitle>
            </div>
            <span className="text-xs text-muted">
              {overrun ? "من تكاليف هذا الشهر" : "من إيراد هذا الشهر"}{" "}
              <bdi dir="ltr" className="font-figure font-semibold tabular-nums text-fg">
                {money(overrun ? spent : metrics.monthRevenue)}
              </bdi>
            </span>
          </CardHeader>
          <CardContent>
            <DistributionBar
              parts={parts}
              total={distributionTotal}
              overrun={overrun}
              format={money}
              formatShare={share}
            />
          </CardContent>
        </Card>
      )}

      {/* the best products, measured against the largest magnitude so a month of
          losses draws real bars instead of dividing two negatives into a full rail */}
      <Card>
        <CardHeader>
          <CardTitle>أفضل المنتجات</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3.5">
          {metrics.topProducts.map((p) => {
            const max = Math.max(...metrics.topProducts.map((t) => Math.abs(t.netProfit)), 1);
            const ratio = Math.max(0.06, Math.abs(p.netProfit) / max);
            const pct = Math.round(ratio * 100);
            const losing = p.netProfit < 0;
            return (
              <div key={p.productId} className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="truncate font-medium text-fg">{p.name}</span>
                  <Money polarity={p.netProfit} className="ms-3 shrink-0">
                    {money(p.netProfit)}
                  </Money>
                </div>
                <div className="rail relative h-6 overflow-hidden rounded-full">
                  <div
                    className={cn(
                      "rail-fill absolute inset-y-0 start-0 rounded-full",
                      losing ? "bg-danger" : "bg-accent",
                    )}
                    style={{ width: `${pct}%` }}
                  />
                  <span
                    className="rail-badge px-1.5 py-[3px] text-[10px] font-bold text-fg"
                    style={{ insetInlineStart: `calc(${pct}% - 34px)` }}
                  >
                    <bdi dir="ltr" className="font-figure tabular-nums">
                      {pct}%
                    </bdi>
                  </span>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="size-2 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}
