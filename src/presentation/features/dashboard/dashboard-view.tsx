"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, ChartBar, Package, Plus } from "@phosphor-icons/react";
import { ORDER_STATUS_LABELS, TargetCalculator, type OrderStatus } from "@/domain";
import { useDataStore } from "@/presentation/stores/data-store";
import { useAccess } from "@/presentation/hooks/use-access";
import { computeDashboard } from "@/application/analytics";
import { computeCash } from "@/application/cash";
import { computeOrders } from "@/application/orders";
import { computeTeamCommissions, toMajor } from "@/application/commissions";
import { PageHeader } from "@/presentation/components/layout/page-header";
import {
  Grid,
  Panel,
  Metric,
  Trend,
  SplitBar,
  SplitKey,
  HBar,
  Sparkbars,
  Progress,
  Chip,
  type Slice,
} from "@/presentation/components/structure";
import { Button, EmptyState, Skeleton } from "@/presentation/components/ui";
import { COST_LINE_LABELS } from "@/presentation/lib/labels";
import { formatCurrency, formatDate, formatNumber, formatPercent } from "@/presentation/lib/format";

/**
 * «لوحة التحكم» — the shape the artboards specify (p1).
 *
 * FIRST BAND, and it is the mark's own shape: a hero figure at span 9 beside a
 * decision at span 3. Blocks of descending reach with exactly one deliberately
 * short — which is why this screen does not, and structurally cannot, open with
 * the four identical KPI cards every finance dashboard opens with.
 *
 * SECOND BAND answers the three questions a merchant actually opens the app
 * with, one panel each and never more:
 *   أين ذهب الإيراد   the month taken apart, and the shape of its days
 *   حصص المندوبين     who earned what, ordered
 *   آخر الطلبات        what happened most recently
 *
 * The disclosure ladder this screen used to be is gone. It was a correct answer
 * to «التصميم تحسه صعب» — hide everything, reveal one rung at a time — but it
 * hid the month behind a click on a screen the merchant opens to READ the month.
 * The panels below are all at rest, and the density sweep holds them to the
 * quiet ceiling instead of a collapse doing it.
 */
export function DashboardView() {
  const loaded = useDataStore((s) => s.loaded);
  const products = useDataStore((s) => s.products);
  const sales = useDataStore((s) => s.sales);
  const orders = useDataStore((s) => s.orders);
  const periods = useDataStore((s) => s.periods);
  const settings = useDataStore((s) => s.settings);
  const targets = useDataStore((s) => s.targets);
  const reps = useDataStore((s) => s.reps);
  const schemes = useDataStore((s) => s.commissionSchemes);
  const assignments = useDataStore((s) => s.commissionAssignments);
  const settlements = useDataStore((s) => s.settlements);
  const access = useAccess();

  const money = (n: number) =>
    formatCurrency(n, { currency: settings.currency, locale: settings.locale });

  const activePeriod = useMemo(() => periods.find((p) => p.status === "open"), [periods]);
  const scoped = useMemo(
    () => ({
      orders: activePeriod ? orders.filter((o) => o.periodId === activePeriod.id) : orders,
      sales: activePeriod ? sales.filter((s) => s.periodId === activePeriod.id) : sales,
    }),
    [orders, sales, activePeriod],
  );

  const cash = useMemo(
    () =>
      computeCash({
        orders: scoped.orders,
        sales: scoped.sales,
        products,
        currency: settings.currency,
        scope: access.salesScope,
      }),
    [scoped, products, settings.currency, access.salesScope],
  );

  const metrics = useMemo(
    () => computeDashboard(products, sales, { currency: settings.currency, months: 12 }),
    [products, sales, settings.currency],
  );

  const ordersView = useMemo(
    () =>
      computeOrders({
        orders: scoped.orders,
        sales: scoped.sales,
        products,
        reps,
        scope: access.salesScope,
        limit: 6,
      }),
    [scoped, products, reps, access.salesScope],
  );

  const team = useMemo(
    () =>
      computeTeamCommissions(
        {
          sales: scoped.sales,
          products,
          reps,
          schemes,
          assignments,
          settlements,
          orders: scoped.orders,
          defaultCommissionSchemeId: settings.defaultCommissionSchemeId,
        },
        { currency: settings.currency },
      ),
    [scoped, products, reps, schemes, assignments, settlements, settings],
  );

  const m = metrics.monthly;
  const last = m[m.length - 1];
  const prev = m[m.length - 2];
  const profitDelta =
    prev && prev.netProfit && last
      ? (last.netProfit - prev.netProfit) / Math.abs(prev.netProfit)
      : undefined;

  const monthTarget =
    TargetCalculator.resolve(targets, {
      metric: "netProfit",
      month: new Date().toISOString().slice(0, 7),
    }).target?.amount ?? settings.monthlyProfitTarget ?? 0;

  /* «أين ذهب الإيراد»: the month's revenue taken apart. Profit is the first
     band because it is what the merchant kept; the cost lines follow, largest
     first. These sum to monthRevenue by construction — that identity is what
     makes the bar honest rather than illustrative. */
  const slices = useMemo<Slice[]>(() => {
    const bands: Slice[] = [
      {
        key: "profit",
        label: "ما بقي لك",
        value: Math.max(0, metrics.monthProfit),
        series: 1,
      },
    ];
    const lines = [...metrics.monthCostLines].sort((a, b) => b.amount - a.amount);
    /* Four bands is the whole vocabulary, so everything past the two biggest
       cost lines is one honest «كلف أخرى» rather than a rainbow of hairlines. */
    const [first, second, ...rest] = lines;
    if (first) bands.push({ key: first.line, label: COST_LINE_LABELS[first.line], value: first.amount, series: 2 });
    if (second) bands.push({ key: second.line, label: COST_LINE_LABELS[second.line], value: second.amount, series: 3 });
    const other = rest.reduce((sum, l) => sum + l.amount, 0);
    if (other > 0) bands.push({ key: "other", label: "كلف أخرى", value: other, series: 4 });
    return bands;
  }, [metrics]);

  const bestDay = useMemo(
    () => metrics.week.reduce((best, d) => (d.netProfit > (best?.netProfit ?? -Infinity) ? d : best), metrics.week[0]),
    [metrics.week],
  );

  const topShare = team.reps[0] ? toMajor(team.reps[0].repShareMinor, team.currency) : 0;

  if (!loaded) {
    return (
      <>
        <PageHeader title="لوحة التحكم" />
        <Grid>
          <Skeleton className="span-9 h-[200px] rounded-[var(--radius-md)]" />
          <Skeleton className="span-3 h-[200px] rounded-[var(--radius-md)]" />
          <Skeleton className="span-6 h-[320px] rounded-[var(--radius-md)]" />
          <Skeleton className="span-3 h-[320px] rounded-[var(--radius-md)]" />
          <Skeleton className="span-3 h-[320px] rounded-[var(--radius-md)]" />
        </Grid>
      </>
    );
  }

  if (products.length === 0) {
    return (
      <>
        <PageHeader title="لوحة التحكم" />
        <EmptyState
          icon={<Package size={24} />}
          title="لا توجد منتجات بعد"
          action={
            <Button asChild leadingIcon={<Plus size={16} weight="bold" />}>
              <Link href="/products/new">إضافة منتج</Link>
            </Button>
          }
        />
      </>
    );
  }

  const goalShare = monthTarget > 0 ? metrics.monthProfit / monthTarget : 0;
  const remaining = Math.max(0, monthTarget - metrics.monthProfit);

  return (
    <>
      <PageHeader
        title="لوحة التحكم"
        actions={
          <>
            <Button asChild variant="secondary" size="sm" className="hidden sm:inline-flex" leadingIcon={<ChartBar size={15} />}>
              <Link href="/reports">التقارير</Link>
            </Button>
            <Button asChild size="sm" leadingIcon={<Plus size={15} weight="bold" />}>
              <Link href="/orders">طلبية جديدة</Link>
            </Button>
          </>
        }
      />

      <Grid>
        {/* ── the hero. Not net profit: profit is a verdict about the month, and
            cash in hand against cash still out is the figure that changes what
            the merchant does today (gate P7/G1). ─────────────────────────── */}
        <Panel span={9} bodyClassName="flex flex-col gap-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            {/* No `unit`: `formatCurrency` already prints «د.ع.» after the
                figure, and passing one here rendered the currency twice. */}
            <Metric
              size="lead"
              amount={money(cash.spendable)}
              name={`بيدك · ${activePeriod?.label ?? "هذا الشهر"}`}
            >
              <span className="flex flex-wrap items-center gap-3 text-[11px] text-subtle">
                <Trend ratio={profitDelta} suffix="مقابل الشهر الماضي" />
                <span>
                  <bdi className="r-num text-fg">{formatNumber(ordersView.total, { locale: settings.locale })}</bdi>{" "}
                  طلبية
                </span>
                <span>
                  عند التوصيل{" "}
                  <bdi className="r-num text-fg">{money(cash.awaiting)}</bdi>
                </span>
              </span>
            </Metric>

            {monthTarget > 0 && (
              <div className="w-full min-w-[240px] max-w-[420px] flex-1">
                <div className="mb-1.5 flex items-baseline justify-between text-[11px]">
                  <span className="text-subtle">هدف الشهر</span>
                  <bdi className="r-num font-bold text-fg">
                    {formatPercent(Math.min(1, goalShare), { locale: settings.locale })}
                  </bdi>
                </div>
                <Progress share={goalShare} />
                <p className="mt-1.5 text-[11px] text-subtle">
                  {remaining > 0 ? (
                    <>
                      يتبقّى <bdi className="r-num text-fg">{money(remaining)}</bdi>
                    </>
                  ) : (
                    "بلغت الهدف."
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Two states, never summed: what is spendable and what is still out.
              An app that reports one figure answers a question nobody asked. */}
          <div className="r-steps grid items-start gap-3 sm:grid-cols-3">
            <StateTile label="عند التوصيل" value={money(cash.awaiting)} note="شُحنت ولم يوصلك مالها" trips={cash.withCourier.trips} locale={settings.locale} />
            <StateTile label="في الطريق" value={money(cash.inFlight.expected)} note="لم تخرج نتيجتها بعد" trips={cash.inFlight.trips} locale={settings.locale} />
            <StateTile label="راجعة أو ملغاة" value={money(Math.abs(cash.lost.netProfit))} note="أجرة توصيل خسرتها" trips={cash.lost.trips} locale={settings.locale} tone="danger" />
          </div>
        </Panel>

        {/* ── the decision. The one accent panel on the screen. ───────────── */}
        <Panel span={3} accent title="ما يحتاج قراراً" bodyClassName="flex h-full flex-col gap-3">
          {cash.withCourier.trips > 0 ? (
            <>
              <Metric
                size="sm"
                amount={money(cash.awaiting)}
                name={`${cash.withCourier.trips} طلبية مُسلَّمة ومالها لم يصلك`}
              />
              <p className="text-[12px] leading-relaxed text-muted">
                المال محسوب لك، لكنه ليس بيدك: حصّله من المندوب قبل أن يتقادم.
              </p>
              <div className="mt-auto flex items-center gap-2">
                <Button asChild size="sm" variant="secondary">
                  <Link href="/orders">افتح التحصيلات</Link>
                </Button>
              </div>
            </>
          ) : cash.lost.trips > 0 ? (
            <>
              <Metric size="sm" amount={money(Math.abs(cash.lost.netProfit))} name={`${cash.lost.trips} طلبية راجعة`} />
              <p className="text-[12px] leading-relaxed text-muted">
                أجرة التوصيل دُفعت ولم يقابلها بيع. راجع أسبابها قبل أن تتكرّر.
              </p>
              <div className="mt-auto">
                <Button asChild size="sm" variant="secondary">
                  <Link href="/orders">راجِعها</Link>
                </Button>
              </div>
            </>
          ) : (
            <p className="text-[13px] leading-relaxed text-muted">
              لا شيء معلّق: كل ما سُلّم وصل مالُه، ولا طلبية راجعة في هذه الفترة.
            </p>
          )}
        </Panel>

        {/* ── where the revenue went ──────────────────────────────────────── */}
        <Panel
          span={6}
          title="أين ذهب الإيراد"
          meta={<bdi className="r-num text-[13px] text-subtle">{money(metrics.monthRevenue)}</bdi>}
        >
          <SplitBar slices={slices} total={metrics.monthRevenue} />
          <SplitKey slices={slices} format={money} />
          <div className="mt-4">
            <p className="r-label mb-2">صافي كل يوم</p>
            <Sparkbars
              points={metrics.week.map((d) => ({ key: d.key, value: Math.max(0, d.netProfit) }))}
              label="صافي الربح لكل يوم في الأسبوع الأخير"
            />
            {bestDay && (
              <p className="mt-2 text-[11px] text-subtle">
                أعلى يوم في الأسبوع: <bdi className="r-num text-fg">{money(bestDay.netProfit)}</bdi>
              </p>
            )}
          </div>
        </Panel>

        {/* ── who earned what ─────────────────────────────────────────────── */}
        <Panel
          span={3}
          title="حصص المندوبين"
          meta={
            team.needsSchemeCount > 0 ? (
              <Chip tone="warning">{team.needsSchemeCount} بلا قاعدة</Chip>
            ) : (
              <Chip tone="accent">مجمَّد</Chip>
            )
          }
          footer={
            <>
              <span className="text-[11px] text-subtle">المجموع</span>
              <bdi className="r-num ms-auto text-[13px] font-bold text-fg">
                {money(toMajor(team.repShareMinor, team.currency))}
              </bdi>
            </>
          }
        >
          {team.reps.length === 0 ? (
            <p className="py-6 text-center text-[13px] text-subtle">لا مندوبين بعد.</p>
          ) : (
            <div className="flex flex-col">
              {team.reps.slice(0, 5).map((r, i) => (
                <HBar
                  key={r.repId}
                  label={r.repName}
                  value={toMajor(r.repShareMinor, team.currency)}
                  max={topShare}
                  display={money(toMajor(r.repShareMinor, team.currency))}
                  series={(Math.min(i + 1, 4) as 1 | 2 | 3 | 4)}
                />
              ))}
            </div>
          )}
        </Panel>

        {/* ── what happened most recently ─────────────────────────────────── */}
        <Panel
          span={3}
          title="آخر الطلبات"
          meta={
            <Link href="/orders" className="text-[12px] text-subtle transition-colors hover:text-fg">
              الكل
            </Link>
          }
          bare
        >
          {ordersView.rows.length === 0 ? (
            <p className="py-6 text-center text-[13px] text-subtle">لا طلبيات بعد.</p>
          ) : (
            <div className="flex flex-col">
              {ordersView.rows.map((row) => (
                <Link key={row.order.id} href="/orders" className="r-datarow">
                  <span className="tx">
                    <b>
                      <bdi className="r-num">{row.order.code ?? row.order.id.slice(0, 6)}</bdi>
                    </b>
                    <span>
                      {row.order.customerArea ?? row.repName ?? "بلا مندوب"} ·{" "}
                      {formatDate(row.order.placedAt, {
                        locale: settings.locale,
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </span>
                  <span className="end flex flex-col items-end gap-1">
                    <bdi className="r-num text-[13px] font-bold text-fg">{money(row.outcome.collected)}</bdi>
                    <Chip tone={toneForStatus(row.outcome.status)} className="h-[18px] text-[10px]">
                      {ORDER_STATUS_LABELS[row.outcome.status]}
                    </Chip>
                  </span>
                </Link>
              ))}
            </div>
          )}
        </Panel>
      </Grid>

      <p className="mt-4 text-end">
        <Link
          href="/products"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-fg"
        >
          كل المنتجات
          <ArrowLeft size={14} />
        </Link>
      </p>
    </>
  );
}

function toneForStatus(status: OrderStatus) {
  if (status === "delivered") return "success" as const;
  if (status === "returned" || status === "cancelled") return "danger" as const;
  return "info" as const;
}

/**
 * One cash state. Deliberately NOT a KPI card: no icon, no delta, no border of
 * its own — three of them read as one object with three readings, which is what
 * they are. Four identical bordered tiles in a row is the shape this system's
 * mark cannot make, and it is the shape this tile exists to avoid.
 */
function StateTile({
  label,
  value,
  note,
  trips,
  locale,
  tone,
}: {
  label: string;
  value: string;
  note: string;
  trips: number;
  locale: string;
  tone?: "danger";
}) {
  return (
    <div className="r-inset flex flex-col gap-1 p-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[11px] font-bold text-muted">{label}</span>
        <bdi className="r-num text-[10px] text-subtle">
          {formatNumber(trips, { locale })}
        </bdi>
      </div>
      <bdi className={`r-num text-[18px] font-medium ${tone === "danger" ? "text-danger" : "text-fg"}`}>
        {value}
      </bdi>
      <span className="text-[10px] text-subtle">{note}</span>
    </div>
  );
}
