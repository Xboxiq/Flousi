"use client";

import { useMemo, useState } from "react";
import { CalendarCheck, Lock, FileCsv, FileXls, FilePdf, Printer } from "@phosphor-icons/react";
import { useDataStore } from "@/presentation/stores/data-store";
import { computePeriodSummary, nextPeriodAfter } from "@/application/periods";
import { buildPeriodReport, toExportableTable } from "@/application/reports";
import { downloadReport, printReport } from "@/infrastructure/export/export-service";
import { PageHeader } from "@/presentation/components/layout/page-header";
import {
  Button,
  Dialog,
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
import { Grid, Panel, Toolbar, Metric, Chip } from "@/presentation/components/structure";
import type { Product, Sale } from "@/domain";
import { formatCurrency, formatDate, formatPercent } from "@/presentation/lib/format";
import { MagnitudeRings } from "@/presentation/components/objects/magnitude-rings";
import { SlideToCommit } from "@/presentation/components/interactive/slide-to-commit";
import { Ladder, Rung } from "@/presentation/features/dashboard/ladder";

export function PeriodsView() {
  const loaded = useDataStore((s) => s.loaded);
  const products = useDataStore((s) => s.products);
  const sales = useDataStore((s) => s.sales);
  const periods = useDataStore((s) => s.periods);
  const settings = useDataStore((s) => s.settings);
  const closePeriod = useDataStore((s) => s.closePeriod);
  const openPeriod = useDataStore((s) => s.openPeriod);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  /**
   * The month being sealed, PINNED at the moment the dialog opens. Committing
   * swaps the store's active period underneath the open dialog — without the
   * snapshot the sheet re-targets mid-close and asks about the new month.
   */
  const [closing, setClosing] = useState<{ label: string; summary: NonNullable<typeof liveSummary> } | null>(null);

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
    await closePeriod(active.id, {
      status: "closed",
      endDate: new Date().toISOString(),
      closedAt: new Date().toISOString(),
      summary: liveSummary,
    });
    const next = nextPeriodAfter(active);
    await openPeriod({ label: next.label, startDate: next.startDate, status: "open" });
    // the slide lands («أُغلق الشهر») and is SEEN landed before the sheet leaves
    setTimeout(() => {
      setConfirmOpen(false);
      setClosing(null);
    }, 900);
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
        <PageHeader title="الفترات المحاسبية" />
        <Grid>
          <Skeleton className="span-9 h-[260px] rounded-[var(--radius-md)]" />
          <Skeleton className="span-3 h-[260px] rounded-[var(--radius-md)]" />
          <Skeleton className="span-12 h-[320px] rounded-[var(--radius-md)]" />
        </Grid>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="الفترات المحاسبية"
        actions={
          active && liveSummary ? (
            <Button
              size="sm"
              leadingIcon={<Lock size={15} />}
              onClick={() => {
                setClosing({ label: active.label, summary: liveSummary });
                setConfirmOpen(true);
              }}
            >
              إغلاق الفترة
            </Button>
          ) : undefined
        }
      />

      <Grid>
        {/* ── the month still open ────────────────────────────────────────── */}
        {active && liveSummary ? (
          <Panel
            span={9}
            title={active.label}
            meta={<Chip tone="success">مفتوحة</Chip>}
            bodyClassName="flex flex-col gap-5"
          >
            <SummaryGrid summary={liveSummary} money={money} locale={settings.locale} live />
            {/* Six columns per product, one of them a percentage, standing open
                under the month's own four figures: «أي منتج ربّحني» is asked when
                it is asked, not every time the screen opens. Behind a latch the
                table keeps every column it had (VISUAL-LAW §15). */}
            <Ladder solo>
              <Rung
                flat
                title="الربح حسب المنتج"
                hint="الوحدات والإيراد والتكلفة والهامش، لكل منتج في هذه الفترة."
                open={breakdownOpen}
                onToggle={() => setBreakdownOpen((v) => !v)}
              >
                <BreakdownTable
                  periodLabel={active.label}
                  periodId={active.id}
                  products={products}
                  sales={sales}
                  money={money}
                  locale={settings.locale}
                />
              </Rung>
            </Ladder>
            <ExportButtons
              label={active.label}
              periodId={active.id}
              products={products}
              sales={sales}
            />
          </Panel>
        ) : (
          <Panel span={9} title="لا توجد فترة مفتوحة">
            <EmptyState
              icon={<CalendarCheck size={24} />}
              title="لا توجد فترة مفتوحة"
              action={<Button onClick={startFirstPeriod}>بدء فترة جديدة</Button>}
            />
          </Panel>
        )}

        {/* ── what closing actually does, which is the decision on this screen ── */}
        <Panel span={3} accent title="ما يعنيه الإغلاق" bodyClassName="flex h-full flex-col gap-3">
          {active && liveSummary ? (
            <>
              <Metric
                size="sm"
                amount={money(liveSummary.netProfit)}
                name={`صافي ${active.label} حتى الآن`}
              />
              <p className="text-[12px] leading-relaxed text-muted">
                الإغلاق يُجمّد أرقام الشهر ويفتح الذي يليه. بعده تُقرأ الفترة ولا تُعدَّل،
                وحصص المندوبين فيها تبقى على ما جُمّدت عليه.
              </p>
            </>
          ) : (
            <p className="text-[13px] leading-relaxed text-muted">
              ابدأ فترة حتى تُنسب إليها البيعات والطلبيات، وتصير للأرقام حدود شهر.
            </p>
          )}
        </Panel>

        {/* ── the archive ─────────────────────────────────────────────────── */}
        <Panel
          span={12}
          bare
          footer={
            <span className="text-[11px] text-subtle">
              {closed.length} فترة مغلقة · تُقرأ ولا تُعدَّل
            </span>
          }
        >
          <Toolbar title="الفترات المغلقة">
            <span className="r-spacer" />
          </Toolbar>

          {closed.length === 0 ? (
            <p className="p-6 text-center text-[13px] text-subtle">
              لا توجد فترات مغلقة بعد. ستظهر الأشهر المغلقة هنا للقراءة فقط.
            </p>
          ) : (
            <div className="r-tablewrap">
              <table className="r-tbl">
                <thead>
                  <tr>
                    <th>الفترة</th>
                    <th className="n">الإيراد</th>
                    <th className="n">التكاليف</th>
                    <th className="n">صافي الربح</th>
                    <th className="n">الهامش</th>
                    <th>أُغلقت</th>
                  </tr>
                </thead>
                <tbody>
                  {closed.map((period) => (
                    <tr key={period.id}>
                      <td className="font-bold">{period.label}</td>
                      <td className="n">{period.summary ? money(period.summary.revenue) : "—"}</td>
                      <td className="n">{period.summary ? money(period.summary.totalCost) : "—"}</td>
                      <td
                        className={`n font-bold ${
                          (period.summary?.netProfit ?? 0) < 0 ? "text-danger" : "text-fg"
                        }`}
                      >
                        {period.summary ? money(period.summary.netProfit) : "—"}
                      </td>
                      <td className="n text-muted">
                        {period.summary
                          ? formatPercent(period.summary.margin, { locale: settings.locale })
                          : "—"}
                      </td>
                      <td className="text-muted">
                        {period.closedAt
                          ? formatDate(period.closedAt, { locale: settings.locale })
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </Grid>

      {/* Confirm close */}
      <Dialog
        open={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setClosing(null);
        }}
        title={`إغلاق ${closing?.label ?? "الفترة"}؟`}
        /* the art is the DATA being sealed: the month's own magnitudes (R29+R47) */
        art={
          closing ? (
            <MagnitudeRings
              rings={[
                { label: "الإيراد", value: closing.summary.revenue, kind: "whole" },
                { label: "التكاليف", value: closing.summary.totalCost, kind: "cost" },
                { label: "صافي الربح", value: closing.summary.netProfit, kind: "keep" },
              ]}
              size={120}
              format={money}
            />
          ) : undefined
        }
      >
        {closing && (
          <div className="rounded-[var(--radius-md)] border border-border bg-surface-2 p-4">
            <SummaryGrid summary={closing.summary} money={money} locale={settings.locale} compact />
          </div>
        )}
        {/* closing a month is irreversible, so it costs a gesture (R25) */}
        <SlideToCommit
          className="mt-4"
          label="اسحب لإغلاق الشهر وقفله"
          doneLabel="أُغلق الشهر"
          onCommit={onClose}
        />
        <p className="mt-2 text-center text-[11px] text-subtle">
          الإفلات قبل النهاية يلغي، فلا يُغلق شهر بالخطأ.
        </p>
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
      <span className="me-1 text-xs font-medium text-subtle">
        تصدير أرباح الشهر
      </span>
      <Button variant="secondary" size="sm" leadingIcon={<FileCsv size={15} />} onClick={() => downloadReport("csv", table())}>
        CSV
      </Button>
      <Button variant="secondary" size="sm" leadingIcon={<FileXls size={15} />} onClick={() => downloadReport("xlsx", table())}>
        Excel
      </Button>
      <Button variant="secondary" size="sm" leadingIcon={<FilePdf size={15} />} onClick={() => printReport(table())}>
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
      <p className="text-sm text-muted">
        لا توجد مبيعات مسجّلة في هذه الفترة بعد. سجّل مبيعات من صفحة المنتج لبناء أرباح الشهر.
      </p>
    );
  }
  return (
    <div>
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
              <TR key={i} data-row className={isTotal ? "font-semibold" : ""}>
                <TD className={isTotal ? "font-semibold" : "font-medium"}>{String(row[0])}</TD>
                <TD className="text-start"><Money className="text-muted">{String(row[2])}</Money></TD>
                <TD className="text-start"><Money>{money(Number(row[3]))}</Money></TD>
                <TD className="text-start"><Money>{money(Number(row[4]))}</Money></TD>
                <TD className="text-start">
                  <Money polarity={net}>{money(net)}</Money>
                </TD>
                <TD className="text-start">
                  <Money className="text-muted">{formatPercent(Number(row[6]), { locale })}</Money>
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
  const items: { label: string; value: string; polarity?: number }[] = [
    { label: live ? "الإيراد (حتى الآن)" : "الإيراد", value: money(summary.revenue) },
    { label: "إجمالي التكلفة", value: money(summary.totalCost) },
    { label: "صافي الربح", value: money(summary.netProfit), polarity: summary.netProfit },
    { label: "الهامش", value: formatPercent(summary.margin, { locale }) },
  ];
  return (
    <div className={compact ? "grid grid-cols-2 gap-3" : "grid grid-cols-2 gap-4 sm:grid-cols-4"}>
      {items.map((it) => (
        <div key={it.label}>
          <div className="text-xs text-muted">{it.label}</div>
          <div className="mt-0.5 text-lg font-semibold text-fg">
            <Money polarity={it.polarity}>{it.value}</Money>
          </div>
        </div>
      ))}
    </div>
  );
}
