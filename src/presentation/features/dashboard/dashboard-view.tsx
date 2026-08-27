"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Package, Plus } from "@phosphor-icons/react";
import { TargetCalculator } from "@/domain";
import { useDataStore } from "@/presentation/stores/data-store";
import { useAccess } from "@/presentation/hooks/use-access";
import { computeDashboard, profitForSale } from "@/application/analytics";
import { computeCash } from "@/application/cash";
import { PageHeader } from "@/presentation/components/layout/page-header";
import { QuickActions } from "./quick-actions";
import { Ladder, Rung } from "./ladder";
import { MonthDetail } from "./month-detail";
import { SaleRows } from "./sale-rows";
import {
  Button,
  EmptyState,
  Money,
  Skeleton,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "@/presentation/components/ui";
import { CashTill } from "@/presentation/components/objects/cash-till";
import {
  NOUNS,
  countedNoun,
  formatCurrency,
  formatDate,
  formatSignedPercent,
} from "@/presentation/lib/format";
import { cn } from "@/presentation/lib/cn";

/**
 * The export rung's machinery rides the same dynamic boundary as its file writers:
 * xlsx and jspdf are already `await import`ed inside the service, and the service
 * module itself is loaded only when the rung is used.
 */
const exportMonth = async (
  format: "csv" | "xlsx" | "pdf",
  table: { title: string; columns: string[]; rows: (string | number)[][] },
) => {
  const { downloadReport } = await import("@/infrastructure/export/export-service");
  await downloadReport(format, table);
};

const RAW_PAGE = 12;

type RungId = "detail" | "raw" | "export";

/**
 * «رقم واحد ثم سلّم كشف» — the client's chosen shape, by name.
 *
 * The screen opens on ONE object: what is in the merchant's hand against what is
 * still out with the couriers — the figure that changes what he DOES today, which
 * net profit (a verdict, not a decision) never was. Everything else hangs below it
 * on one rail: the month's visual reading, then the raw rows, then the export.
 * Tufte's criterion picked the number; the research picked the ladder
 * (docs/PLAN-ORDERS §6); P3's roles keep the whole screen behind «يرى التكاليف».
 */
export function DashboardView() {
  const loaded = useDataStore((s) => s.loaded);
  const products = useDataStore((s) => s.products);
  const sales = useDataStore((s) => s.sales);
  const orders = useDataStore((s) => s.orders);
  const periods = useDataStore((s) => s.periods);
  const settings = useDataStore((s) => s.settings);
  const targets = useDataStore((s) => s.targets);
  const access = useAccess();

  /* One rung at a time: a ladder is stood on one step, and «open everything» would
     quietly rebuild the wall this screen used to be. */
  const [open, setOpen] = useState<RungId | null>(null);
  const [shown, setShown] = useState(RAW_PAGE);
  const [exporting, setExporting] = useState<"csv" | "xlsx" | "pdf" | null>(null);

  const money = (n: number) =>
    formatCurrency(n, { currency: settings.currency, locale: settings.locale });

  const activePeriod = useMemo(() => periods.find((p) => p.status === "open"), [periods]);
  const cash = useMemo(
    () =>
      computeCash({
        orders: activePeriod ? orders.filter((o) => o.periodId === activePeriod.id) : orders,
        sales: activePeriod ? sales.filter((s) => s.periodId === activePeriod.id) : sales,
        products,
        currency: settings.currency,
        scope: access.salesScope,
      }),
    [orders, sales, products, activePeriod, settings.currency, access.salesScope],
  );

  const metrics = useMemo(
    () => computeDashboard(products, sales, { currency: settings.currency, months: 12 }),
    [products, sales, settings.currency],
  );
  const m = metrics.monthly;
  const last = m[m.length - 1];
  const prev = m[m.length - 2];
  const profitDelta =
    prev && prev.netProfit
      ? (last.netProfit - prev.netProfit) / Math.abs(prev.netProfit)
      : undefined;

  /* The raw rung: this calendar month's sales, newest first — the rows the detail
     rung summarises, so the two can never disagree about which window they read. */
  const monthRows = useMemo(() => {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const productById = new Map(products.map((p) => [p.id, p]));
    return sales
      .filter((s) => new Date(s.soldAt).getTime() >= from)
      .sort((a, b) => (b.soldAt ?? "").localeCompare(a.soldAt ?? ""))
      .map((s) => {
        const p = profitForSale(s, productById.get(s.productId));
        return {
          id: s.id,
          productName: p.product?.name ?? "منتج محذوف",
          soldAt: s.soldAt,
          quantity: s.quantity,
          revenue: p.revenue,
          netProfit: p.netProfit,
        };
      });
  }, [sales, products]);

  const monthTarget =
    TargetCalculator.resolve(targets, {
      metric: "netProfit",
      month: new Date().toISOString().slice(0, 7),
    }).target?.amount ?? 0;

  const runExport = async (format: "csv" | "xlsx" | "pdf") => {
    setExporting(format);
    try {
      await exportMonth(format, {
        title: `مبيعات ${activePeriod?.label ?? "الشهر"}`,
        columns: ["التاريخ", "المنتج", "الكمية", "الإيراد", "صافي الربح"],
        rows: monthRows.map((r) => [
          r.soldAt.slice(0, 10),
          r.productName,
          r.quantity,
          r.revenue,
          r.netProfit,
        ]),
      });
    } finally {
      setExporting(null);
    }
  };

  if (!loaded) {
    return (
      <>
        <PageHeader title="لوحة التحكم" description="رقمك الأول، وتحت كل درجة تفصيلها." />
        <div className="flex flex-col gap-5">
          <Skeleton className="h-72 rounded-[var(--radius-2xl)]" />
          <Skeleton className="h-16 rounded-[var(--radius-2xl)]" />
          <Skeleton className="h-16 rounded-[var(--radius-2xl)]" />
          <Skeleton className="h-16 rounded-[var(--radius-2xl)]" />
        </div>
      </>
    );
  }

  if (products.length === 0) {
    return (
      <>
        <PageHeader title="لوحة التحكم" description="رقمك الأول، وتحت كل درجة تفصيلها." />
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

  const toggle = (id: RungId) => setOpen((cur) => (cur === id ? null : id));

  return (
    <>
      <PageHeader
        title="لوحة التحكم"
        description="رقمك الأول، وتحت كل درجة تفصيلها."
        actions={<QuickActions />}
      />

      <div className="flex flex-col gap-6">
        {/* THE number. Not net profit — profit is a verdict about the month; cash in
            hand against cash still out is the figure that changes what the merchant
            does today (gate P7/G1). */}
        <CashTill
          reading={cash}
          money={money}
          showLoss
          windowLabel={activePeriod?.label}
          audience={access.salesScope === undefined ? "owner" : "rep"}
        />

        <Ladder>
          <Rung
            title="الشهر بالتفصيل"
            hint="صافي الربح والهامش والمنحنى، وأين راح المال."
            open={open === "detail"}
            onToggle={() => toggle("detail")}
            summary={
              <span className="flex items-center gap-2">
                {profitDelta !== undefined && (
                  <bdi
                    dir="ltr"
                    className={cn(
                      "font-mono text-[11px] tabular-nums",
                      profitDelta < 0 ? "text-danger" : "text-success",
                    )}
                  >
                    {formatSignedPercent(profitDelta, { locale: settings.locale })}
                  </bdi>
                )}
                <Money polarity={metrics.monthProfit} className="font-semibold">
                  {money(metrics.monthProfit)}
                </Money>
              </span>
            }
          >
            <MonthDetail
              metrics={metrics}
              settings={settings}
              monthTarget={monthTarget}
            />
          </Rung>

          <Rung
            title="الكشف الخام"
            hint="مبيعات هذا الشهر سطراً سطراً، بلا تلخيص."
            open={open === "raw"}
            onToggle={() => toggle("raw")}
            summary={
              <span className="text-muted">
                {countedNoun(monthRows.length, NOUNS.sale, { locale: settings.locale })}
              </span>
            }
          >
            {monthRows.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted">لا مبيعات في هذا الشهر بعد.</p>
            ) : (
              <>
                {/* phones get rows, not a clipped five-column table */}
                <SaleRows
                  rows={monthRows.slice(0, shown).map((s) => ({
                    id: s.id,
                    productName: s.productName,
                    meta: `${formatDate(s.soldAt, { locale: settings.locale, month: "short", day: "numeric" })} · ${countedNoun(s.quantity, NOUNS.piece, { locale: settings.locale })}`,
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
                    {monthRows.slice(0, shown).map((s) => (
                      <TR key={s.id}>
                        <TD className="whitespace-nowrap font-medium">{s.productName}</TD>
                        <TD className="text-start">
                          <Money className="text-muted">{s.quantity}</Money>
                        </TD>
                        <TD className="text-start">
                          <Money>{money(s.revenue)}</Money>
                        </TD>
                        <TD className="text-start">
                          <Money polarity={s.netProfit}>{money(s.netProfit)}</Money>
                        </TD>
                        <TD className="text-start text-muted">
                          {formatDate(s.soldAt, {
                            locale: settings.locale,
                            month: "short",
                            day: "numeric",
                          })}
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border-soft pt-3">
                  <p className="text-xs text-muted">
                    ظهر {Math.min(shown, monthRows.length)} من {monthRows.length}
                  </p>
                  {shown < monthRows.length && (
                    <Button variant="secondary" size="sm" onClick={() => setShown((n) => n + RAW_PAGE)}>
                      عرض المزيد
                    </Button>
                  )}
                </div>
              </>
            )}
          </Rung>

          <Rung
            title="التصدير"
            hint="الكشف نفسه، ملفاً تعطيه لمحاسب أو تحفظه."
            open={open === "export"}
            onToggle={() => toggle("export")}
          >
            <div className="flex flex-col gap-3">
              <p className="text-xs leading-relaxed text-muted">
                يُصدَّر كشف مبيعات {activePeriod?.label ?? "الشهر"} بالأعمدة نفسها المعروضة في
                «الكشف الخام»: التاريخ، المنتج، الكمية، الإيراد، صافي الربح.
              </p>
              <div className="flex flex-wrap gap-2.5">
                {(["csv", "xlsx", "pdf"] as const).map((format) => (
                  <Button
                    key={format}
                    variant="secondary"
                    size="sm"
                    disabled={exporting !== null || monthRows.length === 0}
                    onClick={() => void runExport(format)}
                  >
                    {exporting === format ? "يُجهَّز…" : format.toUpperCase()}
                  </Button>
                ))}
              </div>
              {monthRows.length === 0 && (
                <p className="text-xs text-subtle">لا شيء يُصدَّر: لا مبيعات في هذا الشهر.</p>
              )}
            </div>
          </Rung>
        </Ladder>

        {/* The one road that used to end here: the wall's «كل المنتجات» link survives
            as a quiet line, because the catalogue is a screen of its own. */}
        <p className="text-end">
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-fg"
          >
            كل المنتجات
            <ArrowLeft size={14} />
          </Link>
        </p>
      </div>
    </>
  );
}
