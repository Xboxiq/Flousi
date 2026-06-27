"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileCsv, FilePdf, FileXls, Printer } from "@phosphor-icons/react";
import {
  buildReport,
  toExportableTable,
  REPORT_META,
  type CellKind,
  type ReportType,
} from "@/application/reports";
import { useDataStore } from "@/presentation/stores/data-store";
import { downloadReport, printReport } from "@/infrastructure/export/export-service";
import { PageHeader } from "@/presentation/components/layout/page-header";
import {
  Button,
  Card,
  EmptyState,
  Skeleton,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "@/presentation/components/ui";
import { formatCurrency, formatNumber, formatPercent } from "@/presentation/lib/format";

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
      <div className="mb-2">
        <Button asChild variant="ghost" size="sm" leadingIcon={<ArrowLeft size={16} />}>
          <Link href="/reports">التقارير</Link>
        </Button>
      </div>
      <PageHeader
        title={report.title}
        description={REPORT_META[type].description}
        actions={loaded ? actions : undefined}
      />

      {!loaded ? (
        <Skeleton className="h-80 w-full" />
      ) : report.rows.length === 0 ? (
        <EmptyState title="لا توجد بيانات بعد" description="سجّل بعض المبيعات لتعبئة هذا التقرير." />
      ) : (
        <Card>
          <Table>
            <THead>
              <TR>
                {report.columns.map((c) => (
                  <TH key={c.label} className={c.kind === "text" ? "" : "text-end"}>
                    {c.label}
                  </TH>
                ))}
              </TR>
            </THead>
            <TBody>
              {report.rows.map((row, i) => (
                <TR key={i}>
                  {row.map((cell, j) => {
                    const col = report.columns[j];
                    const profitTone =
                      col.kind === "profit"
                        ? Number(cell) >= 0
                          ? "text-success"
                          : "text-danger"
                        : "";
                    return (
                      <TD
                        key={j}
                        className={`${col.kind === "text" ? "font-medium" : "text-end font-mono tabular-nums"} ${profitTone}`}
                      >
                        {fmt(cell, col.kind)}
                      </TD>
                    );
                  })}
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      )}
    </>
  );
}
