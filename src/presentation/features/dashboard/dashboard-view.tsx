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
  MeshSurface,
  Skeleton,
  Stat,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "@/presentation/components/ui";
import { formatCurrency, formatPercent, formatSignedPercent, currencySymbol } from "@/presentation/lib/format";
import { CountUp } from "@/presentation/components/interactive/count-up";

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
        <MeshSurface
          variant="aurora"
          className="flex min-h-[200px] flex-col justify-between rounded-[var(--radius-xl)] p-6 text-white shadow-md sm:col-span-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-white/80">صافي الربح · هذا الشهر</span>
            {profitDelta !== undefined && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                <TrendUp size={13} weight="bold" className={profitUp ? "" : "rotate-180"} />
                {formatSignedPercent(profitDelta)}
              </span>
            )}
          </div>
          <div>
            <div className="font-mono text-[44px] font-semibold leading-none tracking-tight tabular-nums" dir="ltr">
              <CountUp
                value={metrics.monthProfit}
                prefix={currencySymbol(settings.currency, settings.locale) + " "}
                decimals={settings.currency === "IQD" ? 0 : 2}
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-white/80">
              <span>الهامش {formatPercent(metrics.margin, { locale: settings.locale })}</span>
              <span>الإيراد {money(metrics.monthRevenue)}</span>
              <span>اليوم {money(metrics.todayProfit)}</span>
            </div>
          </div>
        </MeshSurface>

        <Stat
          label="الإيراد (هذا الشهر)"
          value={money(metrics.monthRevenue)}
          deltaLabel={revenueDelta !== undefined ? formatSignedPercent(revenueDelta) : undefined}
          delta={revenueDelta}
          icon={<Coins size={18} />}
        />
        <Stat label="إجمالي التكاليف" value={money(metrics.totalCost)} icon={<Receipt size={18} />} />
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
              const width = Math.max(6, Math.round((p.netProfit / max) * 100));
              return (
                <div key={p.productId} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate font-medium text-fg">{p.name}</span>
                    <span className="ms-3 shrink-0 font-mono tabular-nums text-success" dir="ltr">
                      {money(p.netProfit)}
                    </span>
                  </div>
                  <div className="neu-inset h-2 overflow-hidden rounded-full bg-sunken">
                    <div
                      className="h-full rounded-full [background-image:linear-gradient(90deg,var(--blue-400),var(--accent-strong))]"
                      style={{ width: `${width}%` }}
                    />
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
                <TD className="font-medium">{s.productName}</TD>
                <TD className="text-start font-mono tabular-nums text-muted" dir="ltr">{s.quantity}</TD>
                <TD className="text-start font-mono tabular-nums" dir="ltr">{money(s.revenue)}</TD>
                <TD
                  className={`text-start font-mono tabular-nums ${s.netProfit >= 0 ? "text-success" : "text-danger"}`}
                  dir="ltr"
                >
                  {money(s.netProfit)}
                </TD>
                <TD className="text-start text-muted">
                  {new Date(s.soldAt).toLocaleDateString(settings.locale, {
                    month: "short",
                    day: "numeric",
                  })}
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
