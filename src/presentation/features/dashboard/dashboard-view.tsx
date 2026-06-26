"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Coins, TrendUp, Receipt, Percent, Package, Plus, ArrowRight } from "@phosphor-icons/react";
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

  // Month-over-month deltas from the trailing series.
  const m = metrics.monthly;
  const last = m[m.length - 1];
  const prev = m[m.length - 2];
  const profitDelta =
    prev && prev.netProfit
      ? (last.netProfit - prev.netProfit) / Math.abs(prev.netProfit)
      : undefined;
  const revenueDelta =
    prev && prev.revenue ? (last.revenue - prev.revenue) / Math.abs(prev.revenue) : undefined;

  const actions = (
    <>
      <Button asChild variant="secondary" leadingIcon={<Receipt size={16} />}>
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-3 h-8 w-32" />
            </Card>
          ))}
        </div>
        <Skeleton className="mt-4 h-64 w-full" />
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

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Your store's profit at a glance."
        actions={actions}
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Net profit (this month)"
          value={money(metrics.monthProfit)}
          tone={metrics.monthProfit >= 0 ? "success" : "danger"}
          deltaLabel={profitDelta !== undefined ? formatSignedPercent(profitDelta) : undefined}
          delta={profitDelta}
          icon={<TrendUp size={18} />}
        />
        <Stat
          label="Revenue (this month)"
          value={money(metrics.monthRevenue)}
          deltaLabel={revenueDelta !== undefined ? formatSignedPercent(revenueDelta) : undefined}
          delta={revenueDelta}
          icon={<Coins size={18} />}
        />
        <Stat
          label="Total expenses"
          value={money(metrics.totalCost)}
          icon={<Receipt size={18} />}
        />
        <Stat
          label="Overall margin"
          value={formatPercent(metrics.margin, { locale: settings.locale })}
          tone={metrics.margin >= 0 ? "success" : "danger"}
          icon={<Percent size={18} />}
        />
      </div>

      {/* Chart + Top products */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue & net profit</CardTitle>
            <div className="flex items-center gap-4 text-xs text-muted">
              <Legend color="var(--accent)" label="Revenue" />
              <Legend color="var(--success)" label="Net profit" />
            </div>
          </CardHeader>
          <CardContent>
            <ProfitAreaChart
              data={metrics.monthly}
              currency={settings.currency}
              locale={settings.locale}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top products</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {metrics.topProducts.map((p) => {
              const max = metrics.topProducts[0]?.netProfit || 1;
              const width = Math.max(4, Math.round((p.netProfit / max) * 100));
              return (
                <div key={p.productId} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate font-medium text-fg">{p.name}</span>
                    <span className="ms-3 shrink-0 font-mono tabular-nums text-success">
                      {money(p.netProfit)}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${width}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Recent sales */}
      <Card className="mt-4">
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
