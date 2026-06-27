"use client";

import { useMemo, useState } from "react";
import { CalendarCheck, Lock, FileCsv, FileXls, FilePdf, Printer } from "@phosphor-icons/react";
import { useDataStore } from "@/presentation/stores/data-store";
import { computePeriodSummary, nextPeriodAfter } from "@/application/periods";
import { buildPeriodReport, toExportableTable } from "@/application/reports";
import { downloadReport, printReport } from "@/infrastructure/export/export-service";
import { PageHeader } from "@/presentation/components/layout/page-header";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  EmptyState,
  Skeleton,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "@/presentation/components/ui";
import type { Product, Sale } from "@/domain";
import { formatCurrency, formatPercent } from "@/presentation/lib/format";

export function PeriodsView() {
  const loaded = useDataStore((s) => s.loaded);
  const products = useDataStore((s) => s.products);
  const sales = useDataStore((s) => s.sales);
  const periods = useDataStore((s) => s.periods);
  const settings = useDataStore((s) => s.settings);
  const closePeriod = useDataStore((s) => s.closePeriod);
  const openPeriod = useDataStore((s) => s.openPeriod);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [working, setWorking] = useState(false);

  const active = periods.find((p) => p.status === "open");
  const closed = useMemo(
    () =>
      periods
        .filter((p) => p.status === "closed")
        .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()),
    [periods],
  );

  const money = (n: number) =>
    formatCurrency(n, { currency: settings.currency, locale: settings.locale });

  const liveSummary = active ? computePeriodSummary(active, products, sales) : null;

  const onClose = async () => {
    if (!active || !liveSummary) return;
    setWorking(true);
    try {
      await closePeriod(active.id, {
        status: "closed",
        endDate: new Date().toISOString(),
        closedAt: new Date().toISOString(),
        summary: liveSummary,
      });
      const next = nextPeriodAfter(active);
      await openPeriod({ label: next.label, startDate: next.startDate, status: "open" });
      setConfirmOpen(false);
    } finally {
      setWorking(false);
    }
  };

  const startFirstPeriod = async () => {
    const now = new Date();
    await openPeriod({
      label: new Intl.DateTimeFormat("ar", { month: "long", year: "numeric" }).format(now),
      startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
      status: "open",
    });
  };

  if (!loaded) {
    return (
      <>
        <PageHeader
          title="Accounting periods"
          description="Close months and lock historical reports."
        />
        <Skeleton className="h-48 w-full" />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="الفترات المحاسبية"
        description="أغلق الأشهر واحفظ التقارير التاريخية للقراءة فقط."
      />

      {/* الفترة المفتوحة */}
      {active && liveSummary ? (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>{active.label}</CardTitle>
              <Badge tone="success" dot>
                مفتوحة
              </Badge>
            </div>
            <Button leadingIcon={<Lock size={16} />} onClick={() => setConfirmOpen(true)}>
              إغلاق الفترة
            </Button>
          </CardHeader>
          <CardContent>
            <SummaryGrid summary={liveSummary} money={money} locale={settings.locale} live />
            <ExportButtons label={active.label} periodId={active.id} products={products} sales={sales} />
            <BreakdownTable
              periodLabel={active.label}
              periodId={active.id}
              products={products}
              sales={sales}
              money={money}
              locale={settings.locale}
            />
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          icon={<CalendarCheck size={24} />}
          title="لا توجد فترة مفتوحة"
          description="ابدأ فترة محاسبية جديدة لتتبّع أرباح هذا الشهر."
          action={<Button onClick={startFirstPeriod}>بدء فترة جديدة</Button>}
        />
      )}

      {/* السجل */}
      <h2 className="mt-8 mb-3 text-sm font-medium uppercase tracking-wide text-subtle">
        الفترات المغلقة
      </h2>
      {closed.length === 0 ? (
        <p className="text-sm text-muted">
          لا توجد فترات مغلقة بعد. ستظهر الأشهر المغلقة هنا للقراءة فقط.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {closed.map((period) => (
            <Card key={period.id}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle>{period.label}</CardTitle>
                  <Badge tone="neutral">مقفلة</Badge>
                </div>
                {period.closedAt && (
                  <span className="text-xs text-subtle">
                    أُغلقت {new Date(period.closedAt).toLocaleDateString(settings.locale)}
                  </span>
                )}
              </CardHeader>
              <CardContent>
                {period.summary && (
                  <SummaryGrid summary={period.summary} money={money} locale={settings.locale} />
                )}
                <ExportButtons label={period.label} periodId={period.id} products={products} sales={sales} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Confirm close */}
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={`إغلاق ${active?.label ?? "الفترة"}؟`}
        description="سيتم قفل الفترة. يصبح تقريرها للقراءة فقط وتُفتح فترة جديدة."
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)} disabled={working}>
              إلغاء
            </Button>
            <Button onClick={onClose} loading={working} leadingIcon={<Lock size={16} />}>
              إغلاق وقفل
            </Button>
          </>
        }
      >
        {liveSummary && (
          <div className="rounded-[var(--radius-md)] border border-border bg-surface-2 p-4">
            <SummaryGrid summary={liveSummary} money={money} locale={settings.locale} compact />
          </div>
        )}
      </Dialog>
    </>
  );
}

function ExportButtons({
  label,
  periodId,
  products,
  sales,
}: {
  label: string;
  periodId: string;
  products: Product[];
  sales: Sale[];
}) {
  const table = () => toExportableTable(buildPeriodReport(label, periodId, products, sales));
  const has = sales.some((s) => s.periodId === periodId);
  if (!has) return null;
  return (
    <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border pt-4">
      <span className="me-1 text-xs font-medium uppercase tracking-wide text-subtle">
        تصدير أرباح الشهر
      </span>
      <Button variant="secondary" size="sm" leadingIcon={<FileCsv size={15} />} onClick={() => downloadReport("csv", table())}>
        CSV
      </Button>
      <Button variant="secondary" size="sm" leadingIcon={<FileXls size={15} />} onClick={() => downloadReport("xlsx", table())}>
        Excel
      </Button>
      <Button variant="secondary" size="sm" leadingIcon={<FilePdf size={15} />} onClick={() => downloadReport("pdf", table())}>
        PDF
      </Button>
      <Button variant="ghost" size="sm" leadingIcon={<Printer size={15} />} onClick={() => printReport(table())}>
        طباعة
      </Button>
    </div>
  );
}

function BreakdownTable({
  periodLabel,
  periodId,
  products,
  sales,
  money,
  locale,
}: {
  periodLabel: string;
  periodId: string;
  products: Product[];
  sales: Sale[];
  money: (n: number) => string;
  locale: string;
}) {
  const report = buildPeriodReport(periodLabel, periodId, products, sales);
  if (report.rows.length === 0) {
    return (
      <p className="mt-5 border-t border-border pt-4 text-sm text-muted">
        لا توجد مبيعات مسجّلة في هذه الفترة بعد. سجّل مبيعات من صفحة المنتج لبناء أرباح الشهر.
      </p>
    );
  }
  return (
    <div className="mt-5 border-t border-border pt-4">
      <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-subtle">
        الربح حسب المنتج
      </h3>
      <Table>
        <THead>
          <TR>
            <TH>المنتج</TH>
            <TH className="text-start">الوحدات</TH>
            <TH className="text-start">الإيراد</TH>
            <TH className="text-start">التكلفة</TH>
            <TH className="text-start">صافي الربح</TH>
            <TH className="text-start">الهامش</TH>
          </TR>
        </THead>
        <TBody>
          {report.rows.map((row, i) => {
            const isTotal = row[0] === "الإجمالي";
            const net = Number(row[5]);
            return (
              <TR key={i} className={isTotal ? "font-semibold" : ""}>
                <TD className={isTotal ? "font-semibold" : "font-medium"}>{String(row[0])}</TD>
                <TD className="text-start font-mono tabular-nums text-muted" dir="ltr">{String(row[2])}</TD>
                <TD className="text-start font-mono tabular-nums" dir="ltr">{money(Number(row[3]))}</TD>
                <TD className="text-start font-mono tabular-nums" dir="ltr">{money(Number(row[4]))}</TD>
                <TD className={`text-start font-mono tabular-nums ${net >= 0 ? "text-success" : "text-danger"}`} dir="ltr">
                  {money(net)}
                </TD>
                <TD className="text-start font-mono tabular-nums text-muted" dir="ltr">
                  {formatPercent(Number(row[6]), { locale })}
                </TD>
              </TR>
            );
          })}
        </TBody>
      </Table>
    </div>
  );
}

function SummaryGrid({
  summary,
  money,
  locale,
  live,
  compact,
}: {
  summary: {
    revenue: number;
    totalCost: number;
    netProfit: number;
    margin: number;
    saleCount: number;
  };
  money: (n: number) => string;
  locale: string;
  live?: boolean;
  compact?: boolean;
}) {
  const items = [
    { label: live ? "الإيراد (حتى الآن)" : "الإيراد", value: money(summary.revenue) },
    { label: "إجمالي التكلفة", value: money(summary.totalCost) },
    {
      label: "صافي الربح",
      value: money(summary.netProfit),
      tone: summary.netProfit >= 0 ? "text-success" : "text-danger",
    },
    { label: "الهامش", value: formatPercent(summary.margin, { locale }) },
  ];
  return (
    <div className={compact ? "grid grid-cols-2 gap-3" : "grid grid-cols-2 gap-4 sm:grid-cols-4"}>
      {items.map((it) => (
        <div key={it.label}>
          <div className="text-xs text-muted">{it.label}</div>
          <div
            className={`mt-0.5 font-mono text-lg font-semibold tabular-nums ${it.tone ?? "text-fg"}`}
            dir="ltr"
          >
            {it.value}
          </div>
        </div>
      ))}
    </div>
  );
}
