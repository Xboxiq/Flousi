"use client";

import { useMemo, useState } from "react";
import { FileCsv, FilePdf, FileXls, Printer } from "@phosphor-icons/react";
import {
  buildReport,
  toExportableTable,
  type CellKind,
  type ReportType,
} from "@/application/reports";
import { useDataStore } from "@/presentation/stores/data-store";
import { downloadReport, printReport } from "@/infrastructure/export/export-service";
import { PageHeader } from "@/presentation/components/layout/page-header";
import { Button, EmptyState, Skeleton } from "@/presentation/components/ui";
import { Grid, Panel, Toolbar } from "@/presentation/components/structure";
import { formatCurrency, formatNumber, formatPercent } from "@/presentation/lib/format";
import { cn } from "@/presentation/lib/cn";

export function ReportView({ type }: { type: ReportType }) {
  const loaded = useDataStore((s) => s.loaded);
  const products = useDataStore((s) => s.products);
  const sales = useDataStore((s) => s.sales);
  const settings = useDataStore((s) => s.settings);
  const [busy, setBusy] = useState(false);

  const report = useMemo(() => buildReport(type, products, sales), [type, products, sales]);

  const fmt = (raw: string | number, kind: CellKind) => {
    switch (kind) {
      case "money":
      case "profit":
        return formatCurrency(Number(raw), {
          currency: settings.currency,
          locale: settings.locale,
        });
      case "percent":
        return formatPercent(Number(raw), { locale: settings.locale });
      case "number":
        return formatNumber(Number(raw), { locale: settings.locale, digits: 0 });
      default:
        return String(raw);
    }
  };

  const onDownload = async (format: "csv" | "xlsx" | "pdf") => {
    setBusy(true);
    try {
      await downloadReport(format, toExportableTable(report));
    } finally {
      setBusy(false);
    }
  };

  const actions = (
    <>
      <Button
        variant="secondary"
        size="sm"
        leadingIcon={<FileCsv size={16} />}
        onClick={() => onDownload("csv")}
        disabled={busy}
      >
        CSV
      </Button>
      <Button
        variant="secondary"
        size="sm"
        leadingIcon={<FileXls size={16} />}
        onClick={() => onDownload("xlsx")}
        disabled={busy}
      >
        Excel
      </Button>
      <Button
        variant="secondary"
        size="sm"
        leadingIcon={<FilePdf size={16} />}
        onClick={() => printReport(toExportableTable(report))}
        disabled={busy}
      >
        PDF
      </Button>
      <Button
        size="sm"
        leadingIcon={<Printer size={16} />}
        onClick={() => printReport(toExportableTable(report))}
      >
        طباعة
      </Button>
    </>
  );

  return (
    <>
      <PageHeader title={report.title} section="التقارير" actions={loaded ? actions : undefined} />

      <Grid>
        {!loaded ? (
          <Skeleton className="span-12 h-[420px] rounded-[var(--radius-md)]" />
        ) : (
          <Panel
            span={12}
            bare
            footer={
              <span className="text-[11px] text-subtle">
                {report.rows.length} سطر · الأرقام هي نفسها التي تراها في الشاشات، مرتّبةً
                للتصدير والطباعة.
              </span>
            }
          >
            <Toolbar title={report.title}>
              <span className="r-spacer" />
            </Toolbar>
            {report.rows.length === 0 ? (
              <EmptyState
                title="لا توجد بيانات بعد"
                description="سجّل بعض المبيعات لتعبئة هذا التقرير."
              />
            ) : (
              <div className="r-tablewrap">
                <table className="r-tbl">
                  <thead>
                    <tr>
                      {report.columns.map((c, i) => (
                        <th
                          key={c.label}
                          /* The first column names the row and never leaves; the
                             rest shed by position, because a report's columns
                             carry no priority of their own — they are whatever
                             the report type declares. */
                          className={cn(
                            c.kind === "text" ? "" : "n",
                            i > 2 && "pri-3",
                            i === 2 && "pri-2",
                          )}
                        >
                          {c.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {report.rows.map((row, i) => (
                      <tr key={i} data-row>
                        {row.map((cell, j) => {
                          const col = report.columns[j];
                          return (
                            <td
                              key={j}
                              className={cn(
                                col.kind === "text" ? "font-bold" : "n",
                                j > 2 && "pri-3",
                                j === 2 && "pri-2",
                                col.kind === "profit" &&
                                  (Number(cell) >= 0 ? "text-fg" : "text-danger"),
                              )}
                            >
                              {fmt(cell, col.kind)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        )}
      </Grid>
    </>
  );
}
