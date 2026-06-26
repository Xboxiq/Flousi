"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Coins,
  Receipt,
  Percent,
  Package,
  Plus,
  ArrowRight,
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
import { formatCurrency, formatPercent, formatSignedPercent } from "@/presentation/lib/format";

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
        <Link href="/calculator">Quick calc</Link>
      </Button>
      <Button asChild leadingIcon={<Plus size={16} weight="bold" />}>
        <Link href="/products/new">Add product</Link>
      </Button>
    </>
  );

  if (!loaded) {
    return (
      <>
        <PageHeader title="Dashboard" description="Your store's profit at a glance." />
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
        <PageHeader title="Dashboard" description="Your store's profit at a glance." />
        <EmptyState
          icon={<Package size={24} />}
          title="No products yet"
          description="Add your first product to start tracking real net profit."
          action={
            <Button asChild leadingIcon={<Plus size={16} weight="bold" />}>
              <Link href="/products/new">Add product</Link>
            </Button>
          }
        />
      </>
    );
  }

  const profitUp = (profitDelta ?? 0) >= 0;

  return (
    <>
      <PageHeader title="Dashboard" description="Your store's profit at a glance." actions={actions} />

      {/* KPI bento */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Hero — net profit on a grainient aurora */}
        <MeshSurface
          variant="aurora"
          className="flex min-h-[200px] flex-col justify-between rounded-[var(--radius-xl)] p-6 text-white shadow-md sm:col-span-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-white/80">Net profit · this month</span>
            {profitDelta !== undefined && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                <TrendUp size={13} weight="bold" className={profitUp ? "" : "rotate-180"} />
                {formatSignedPercent(profitDelta)}
              </span>
            )}
          </div>
          <div>
            <div className="font-mono text-[44px] font-semibold leading-none tracking-tight tabular-nums">
              {money(metrics.monthProfit)}
            </div>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-white/80">
              <span>Margin {formatPercent(metrics.margin, { locale: settings.locale })}</span>
              <span>Revenue {money(metrics.monthRevenue)}</span>
              <span>Today {money(metrics.todayProfit)}</span>
            </div>
          </div>
        </MeshSurface>

        <Stat
          label="Revenue (this month)"
          value={money(metrics.monthRevenue)}
          deltaLabel={revenueDelta !== undefined ? formatSignedPercent(revenueDelta) : undefined}
          delta={revenueDelta}
          icon={<Coins size={18} />}
        />
        <Stat label="Total expenses" value={money(metrics.totalCost)} icon={<Receipt size={18} />} />
      </div>

      {/* Chart + top products */}
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue &amp; net profit</CardTitle>
            <div className="flex items-center gap-4 text-xs text-muted">
              <Legend color="var(--accent)" label="Revenue" />
              <Legend color="var(--success)" label="Net profit" />
            </div>
          </CardHeader>
          <CardContent>
            <ProfitAreaChart data={metrics.monthly} currency={settings.currency} locale={settings.locale} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top products</CardTitle>
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
                    <span className="ms-3 shrink-0 font-mono tabular-nums text-success">
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

      {/* Recent sales */}
      <Card className="mt-5">
        <CardHeader>
          <CardTitle>Recent sales</CardTitle>
          <Button asChild variant="ghost" size="sm" trailingIcon={<ArrowRight size={14} />}>
            <Link href="/products">All products</Link>
          </Button>
        </CardHeader>
        <Table>
          <THead>
            <TR>
              <TH>Product</TH>
              <TH className="text-end">Qty</TH>
              <TH className="text-end">Revenue</TH>
              <TH className="text-end">Net profit</TH>
              <TH className="text-end">Date</TH>
            </TR>
          </THead>
          <TBody>
            {metrics.recentSales.map((s) => (
              <TR key={s.id}>
                <TD className="font-medium">{s.productName}</TD>
                <TD className="text-end font-mono tabular-nums text-muted">{s.quantity}</TD>
                <TD className="text-end font-mono tabular-nums">{money(s.revenue)}</TD>
                <TD
                  className={`text-end font-mono tabular-nums ${s.netProfit >= 0 ? "text-success" : "text-danger"}`}
                >
                  {money(s.netProfit)}
                </TD>
                <TD className="text-end text-muted">
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
