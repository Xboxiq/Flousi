"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Coins,
  Receipt,
  Percent,
  Package,
  Plus,
  ArrowLeft,
  TrendUp,
  Calculator,
} from "@phosphor-icons/react";
import { useDataStore } from "@/presentation/stores/data-store";
import { computeDashboard } from "@/application/analytics";
import { PageHeader } from "@/presentation/components/layout/page-header";
import { ProfitAreaChart } from "@/presentation/components/charts/profit-area-chart";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Money,
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

export function DashboardView() {
  const loaded = useDataStore((s) => s.loaded);
  const products = useDataStore((s) => s.products);
  const sales = useDataStore((s) => s.sales);
  const settings = useDataStore((s) => s.settings);

  const metrics = useMemo(
    () => computeDashboard(products, sales, { currency: settings.currency }),
    [products, sales, settings.currency],
  );

  const money = (n: number) =>
    formatCurrency(n, { currency: settings.currency, locale: settings.locale });

  const m = metrics.monthly;
  const last = m[m.length - 1];
  const prev = m[m.length - 2];
  const profitDelta =
    prev && prev.netProfit ? (last.netProfit - prev.netProfit) / Math.abs(prev.netProfit) : undefined;
  const revenueDelta =
    prev && prev.revenue ? (last.revenue - prev.revenue) / Math.abs(prev.revenue) : undefined;

  const actions = (
    <>
      <Button asChild variant="secondary" leadingIcon={<Calculator size={16} />}>
        <Link href="/calculator">حاسبة سريعة</Link>
      </Button>
      <Button asChild leadingIcon={<Plus size={16} weight="bold" />}>
        <Link href="/products/new">إضافة منتج</Link>
      </Button>
    </>
  );

  if (!loaded) {
    return (
      <>
        <PageHeader title="لوحة التحكم" description="أرباح متجرك في لمحة." />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-44 rounded-[var(--radius-xl)] sm:col-span-2" />
          <Skeleton className="h-44 rounded-[var(--radius-lg)]" />
          <Skeleton className="h-44 rounded-[var(--radius-lg)]" />
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

  const profitUp = (profitDelta ?? 0) >= 0;

  return (
    <>
      <PageHeader title="لوحة التحكم" description="أرباح متجرك في لمحة." actions={actions} />

      {/* شبكة المؤشرات */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
                  className="text-[26px] font-bold leading-none sm:text-[42px]"
                />
              </div>
              {profitDelta !== undefined && (
                <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-surface/85 px-2.5 py-1 text-xs font-bold text-fg shadow-sm">
                  <TrendUp size={13} weight="bold" className={profitUp ? "" : "rotate-180"} />
                  <bdi dir="ltr" className="font-mono tabular-nums">
                    {formatSignedPercent(profitDelta)}
                  </bdi>
                  <span className="font-medium text-fg/60">مقابل الشهر السابق</span>
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
            <div className="flex items-baseline justify-between px-1">
              <span className="text-[11px] font-semibold text-fg/70">آخر 7 أيام</span>
              <span className="text-[11px] text-fg/55">
                اليوم <bdi dir="ltr" className="font-mono tabular-nums">{money(metrics.todayProfit)}</bdi>
              </span>
            </div>
            <WeekBars
              className="mt-2"
              height={68}
              days={metrics.week.map((d) => ({
                mark: d.mark,
                value: d.netProfit,
                title: `${d.key}: ${money(d.netProfit)}`,
              }))}
            />
          </div>
        </div>

        <Stat
          label="الإيراد (هذا الشهر)"
          value={money(metrics.monthRevenue)}
          deltaLabel={revenueDelta !== undefined ? formatSignedPercent(revenueDelta) : undefined}
          delta={revenueDelta}
          accent="green"
          icon={<Coins size={18} weight="bold" />}
        />
        <Stat
          label="إجمالي التكاليف"
          value={money(metrics.totalCost)}
          accent="neutral"
          icon={<Receipt size={18} weight="bold" />}
        />
      </div>

      {/* الرسم + أفضل المنتجات */}
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>الإيراد وصافي الربح</CardTitle>
            <div className="flex items-center gap-4 text-xs text-muted">
              <Legend color="var(--accent)" label="الإيراد" />
              <Legend color="var(--success)" label="صافي الربح" />
            </div>
          </CardHeader>
          <CardContent>
            <ProfitAreaChart data={metrics.monthly} currency={settings.currency} locale={settings.locale} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>أفضل المنتجات</CardTitle>
            <Percent size={18} className="text-subtle" />
          </CardHeader>
          <CardContent className="flex flex-col gap-3.5">
            {metrics.topProducts.map((p) => {
              const max = metrics.topProducts[0]?.netProfit || 1;
              const share = Math.max(0.06, p.netProfit / max);
              const pct = Math.round(share * 100);
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
                      className="rail-fill absolute inset-y-0 start-0 rounded-full bg-accent"
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

      {/* أحدث المبيعات */}
      <Card className="mt-5">
        <CardHeader>
          <CardTitle>أحدث المبيعات</CardTitle>
          <Button asChild variant="ghost" size="sm" leadingIcon={<ArrowLeft size={14} />}>
            <Link href="/products">كل المنتجات</Link>
          </Button>
        </CardHeader>
        <Table>
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
