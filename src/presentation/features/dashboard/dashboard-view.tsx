"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Coins,
  Receipt,
  Percent,
  Package,
  Plus,
  ArrowLeft,
  ArrowsSplit,
} from "@phosphor-icons/react";
import { useDataStore } from "@/presentation/stores/data-store";
import { computeDashboard } from "@/application/analytics";
import { PageHeader } from "@/presentation/components/layout/page-header";
import { QuickActions } from "./quick-actions";
import { SaleRows } from "./sale-rows";
import { ProfitAreaChart } from "@/presentation/components/charts/profit-area-chart";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Delta,
  EmptyState,
  Money,
  Segmented,
  Skeleton,
  Stat,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "@/presentation/components/ui";
import { formatCurrency, formatDate, formatPercent, formatSignedPercent } from "@/presentation/lib/format";
import { Odometer } from "@/presentation/components/objects/odometer";
import { RingGauge } from "@/presentation/components/objects/ring-gauge";
import { WeekBars } from "@/presentation/components/objects/week-bars";
import {
  DistributionBar,
  type DistributionPart,
} from "@/presentation/components/objects/distribution-bar";
import { COST_LINE_LABELS } from "@/presentation/lib/labels";
import { cn } from "@/presentation/lib/cn";

/** The chart's window — a real filter, not a decorative range switch (R38). */
const WINDOWS = [
  { label: "3 أشهر", value: "3" },
  { label: "6 أشهر", value: "6" },
  { label: "سنة", value: "12" },
] as const;

export function DashboardView() {
  const loaded = useDataStore((s) => s.loaded);
  const products = useDataStore((s) => s.products);
  const sales = useDataStore((s) => s.sales);
  const settings = useDataStore((s) => s.settings);

  const [window, setWindow] = useState<"3" | "6" | "12">("6");

  const metrics = useMemo(
    () =>
      computeDashboard(products, sales, {
        currency: settings.currency,
        months: Number(window),
      }),
    [products, sales, settings.currency, window],
  );

  const money = (n: number) =>
    formatCurrency(n, { currency: settings.currency, locale: settings.locale });
  const share = (n: number) => formatPercent(n, { locale: settings.locale, digits: 0 });

  const m = metrics.monthly;
  const last = m[m.length - 1];
  const prev = m[m.length - 2];
  const profitDelta =
    prev && prev.netProfit ? (last.netProfit - prev.netProfit) / Math.abs(prev.netProfit) : undefined;
  const revenueDelta =
    prev && prev.revenue ? (last.revenue - prev.revenue) / Math.abs(prev.revenue) : undefined;


  if (!loaded) {
    return (
      <>
        <PageHeader title="لوحة التحكم" description="أرباح متجرك في لمحة." />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-64 rounded-[var(--radius-2xl)] sm:col-span-2" />
          <div className="flex flex-col gap-5 sm:col-span-2 sm:flex-row lg:col-span-1 lg:flex-col">
            <Skeleton className="h-[122px] flex-1 rounded-[var(--radius-xl)]" />
            <Skeleton className="h-[122px] flex-1 rounded-[var(--radius-xl)]" />
          </div>
        </div>
        <Skeleton className="mt-5 h-72 w-full rounded-[var(--radius-lg)]" />
      </>
    );
  }

  if (products.length === 0) {
    return (
      <>
        <PageHeader title="لوحة التحكم" description="أرباح متجرك في لمحة." />
        <EmptyState
          icon={<Package size={24} />}
          title="لا توجد منتجات بعد"
          description="أضِف أول منتج لتبدأ بحساب صافي الربح الحقيقي."
          action={
            <Button asChild leadingIcon={<Plus size={16} weight="bold" />}>
              <Link href="/products/new">إضافة منتج</Link>
            </Button>
          }
        />
      </>
    );
  }


  // The level this month is measured against: the merchant's own target when they
  // set one, otherwise their average over the window — never a round number
  // chosen because it looks tidy (RECIPES R35).
  const target = settings.monthlyProfitTarget;
  const threshold = target
    ? { value: target, met: metrics.monthProfit >= target, isTarget: true }
    : metrics.averageMonthProfit > 0
      ? {
          value: metrics.averageMonthProfit,
          met: metrics.monthProfit >= metrics.averageMonthProfit,
          isTarget: false,
        }
      : undefined;

  // «وين راح المال»: this month's revenue taken apart. Costs first, largest to
  // smallest, then whatever survived as the merchant's own.
  const spent = metrics.monthTotalCost;
  const costRatio = metrics.monthRevenue > 0 ? spent / metrics.monthRevenue : 0;
  const kept = metrics.monthProfit;
  const distributionTotal = Math.max(metrics.monthRevenue, spent);
  // Lines under 4% become one plate: six slivers of different texture side by
  // side read as stripes, not as a composition. They stay named in its tooltip,
  // and the product screen keeps the full breakdown.
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
  // A losing month: the whole becomes the costs, and the part revenue never
  // covered is marked across them instead of being added as an extra plate.
  const overrun = kept < 0 ? { amount: -kept, label: "تجاوز التكاليف" } : undefined;

  return (
    <>
      <PageHeader
        title="لوحة التحكم"
        description="أرباح متجرك في لمحة."
        actions={<QuickActions />}
      />

      {/* شبكة المؤشرات — البطل يقود الصف، والمؤشران يقفان بجانبه بحجمهما الطبيعي */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* The month's headline, printed on halftone ink: the figure rolls on
            drums, the margin sits on a dial, and the week stands beside it as
            seven capsules (client feedback batch → RECIPES R17/R21/R22). */}
        <div
          className="halftone flex flex-col justify-between rounded-[var(--radius-2xl)] p-6 shadow-card sm:col-span-2"
          data-part="hero"
        >
          <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-4">
            <div className="min-w-0">
              <span className="text-sm font-semibold text-fg/70">صافي الربح · هذا الشهر</span>
              <div className="mt-2 text-fg" aria-live="polite" aria-atomic="true">
                <Odometer
                  value={metrics.monthProfit}
                  format={money}
                  drumHeight={1.3}
                  className={cn(
                    "text-[26px] font-bold leading-none sm:text-[42px]",
                    // colour is code: a month that lost money says so in the figure
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
              size={92}
              tone={metrics.margin >= 0.2 ? "success" : metrics.margin > 0 ? "accent" : "danger"}
            />
          </div>

          <div className="mt-6 rounded-[var(--radius-lg)] bg-surface/70 p-3 backdrop-blur-[2px]">
            <span className="px-1 text-[11px] font-semibold text-fg/70">آخر 7 أيام</span>
            {/* today is the reading: it stays solid and carries its own figure, so
                the header above no longer repeats the number (R37) */}
            <WeekBars
              className="mt-7"
              height={68}
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

        {/* the pair stands in one column at its own height instead of being
            stretched to the hero's — matched widgets, not stretched panels */}
        <div className="flex flex-col gap-5 sm:col-span-2 sm:flex-row lg:col-span-1 lg:flex-col">
          <Stat
            className="flex-1"
            label="الإيراد (هذا الشهر)"
            value={money(metrics.monthRevenue)}
            deltaLabel={revenueDelta !== undefined ? formatSignedPercent(revenueDelta) : undefined}
            delta={revenueDelta}
            accent="green"
            icon={<Coins size={18} weight="bold" />}
          />
          {/* the same month as the card above it — a total from a different period
              beside it invited a comparison that was never true */}
          {/* the share is a real reading, so it gets an instrument: a comb of
              ticks you can count, with the rest left as carved slots (R40) */}
          <Stat
            className="flex-1"
            label="تكاليف هذا الشهر"
            value={money(metrics.monthTotalCost)}
            meter={
              metrics.monthRevenue > 0
                ? {
                    value: metrics.monthTotalCost / metrics.monthRevenue,
                    label: `التكاليف ${share(metrics.monthTotalCost / metrics.monthRevenue)} من الإيراد`,
                    tone: costRatio > 1 ? "danger" : "accent",
                  }
                : undefined
            }
            caption={
              metrics.monthRevenue > 0 ? (
                <>
                  <bdi dir="ltr" className="font-mono font-semibold tabular-nums text-fg">
                    {share(costRatio)}
                  </bdi>{" "}
                  من الإيراد
                </>
              ) : undefined
            }
            accent="neutral"
            icon={<Receipt size={18} weight="bold" />}
          />
        </div>
      </div>

      {/* الرسم + أفضل المنتجات */}
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
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
                    <bdi dir="ltr" className="font-mono tabular-nums text-fg">
                      {money(threshold.value)}
                    </bdi>
                  </span>
                )}
              </div>
            </div>
            {/* the window actually changes what is aggregated (R38) */}
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
              data={metrics.monthly}
              currency={settings.currency}
              locale={settings.locale}
              threshold={threshold}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>أفضل المنتجات</CardTitle>
            <Percent size={18} className="text-subtle" />
          </CardHeader>
          <CardContent className="flex flex-col gap-3.5">
            {metrics.topProducts.map((p) => {
              // Measured against the largest MAGNITUDE, so a month of losses draws
              // real bars instead of dividing two negatives into a full rail.
              const max = Math.max(...metrics.topProducts.map((t) => Math.abs(t.netProfit)), 1);
              const share = Math.max(0.06, Math.abs(p.netProfit) / max);
              const pct = Math.round(share * 100);
              const losing = p.netProfit < 0;
              return (
                <div key={p.productId} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate font-medium text-fg">{p.name}</span>
                    <Money polarity={p.netProfit} className="ms-3 shrink-0">
                      {money(p.netProfit)}
                    </Money>
                  </div>
                  {/* the share badge rides the fill's leading edge, so the rail
                      reports its own value instead of needing a legend */}
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
                      <bdi dir="ltr" className="font-mono tabular-nums">
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

      {/* وين راح المال — الشهر ككل واحد مقسوم */}
      {parts.length > 0 && (
        <Card className="mt-5">
          <CardHeader className="flex-col items-stretch gap-1 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <ArrowsSplit size={18} className="text-subtle" />
              <CardTitle>وين راح المال؟</CardTitle>
            </div>
            <span className="text-xs text-muted">
              {overrun ? "من تكاليف هذا الشهر" : "من إيراد هذا الشهر"}{" "}
              <bdi dir="ltr" className="font-mono font-semibold tabular-nums text-fg">
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

      {/* أحدث المبيعات */}
      <Card className="mt-5">
        <CardHeader>
          <CardTitle>أحدث المبيعات</CardTitle>
          <Button asChild variant="ghost" size="sm" leadingIcon={<ArrowLeft size={14} />}>
            <Link href="/products">كل المنتجات</Link>
          </Button>
        </CardHeader>
        {/* phones get rows, not a clipped five-column table */}
        <SaleRows
          rows={metrics.recentSales.map((s) => ({
            id: s.id,
            productName: s.productName,
            meta: `${formatDate(s.soldAt, { locale: settings.locale, month: "short", day: "numeric" })} · ${s.quantity} قطعة`,
            revenue: money(s.revenue),
            netProfit: money(s.netProfit),
            polarity: s.netProfit,
          }))}
        />
        <Table className="hidden sm:table">
          <THead>
            <TR>
              <TH>المنتج</TH>
              <TH className="text-start">الكمية</TH>
              <TH className="text-start">الإيراد</TH>
              <TH className="text-start">صافي الربح</TH>
              <TH className="text-start">التاريخ</TH>
            </TR>
          </THead>
          <TBody>
            {metrics.recentSales.map((s) => (
              <TR key={s.id}>
                <TD className="whitespace-nowrap font-medium">{s.productName}</TD>
                <TD className="text-start"><Money className="text-muted">{s.quantity}</Money></TD>
                <TD className="text-start"><Money>{money(s.revenue)}</Money></TD>
                <TD className="text-start">
                  <Money polarity={s.netProfit}>{money(s.netProfit)}</Money>
                </TD>
                <TD className="text-start text-muted">
                  {formatDate(s.soldAt, { locale: settings.locale, month: "short", day: "numeric" })}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>
    </>
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
