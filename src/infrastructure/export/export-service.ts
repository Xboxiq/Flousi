import type { ExportableTable, ExportFormat, ExportService } from "@/domain";

function csvEscape(value: string | number): string {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(table: ExportableTable): string {
  const lines = [table.columns.map(csvEscape).join(",")];
  for (const row of table.rows) lines.push(row.map(csvEscape).join(","));
  return lines.join("\n");
}

async function toXlsxBlob(table: ExportableTable): Promise<Blob> {
  const XLSX = await import("xlsx");
  const ws = XLSX.utils.aoa_to_sheet([table.columns, ...table.rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Report");
  const out = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
  return new Blob([out], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

async function toPdfBlob(table: ExportableTable): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(14);
  doc.text(table.title, 14, 16);
  autoTable(doc, {
    head: [table.columns],
    body: table.rows.map((r) => r.map((c) => String(c))),
    startY: 22,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [79, 70, 229] },
  });
  return doc.output("blob");
}

/** Browser-based export service implementing the domain ExportService port. */
export const localExportService: ExportService = {
  async export(format: ExportFormat, table: ExportableTable): Promise<Blob> {
    switch (format) {
      case "csv":
        return new Blob([toCsv(table)], { type: "text/csv;charset=utf-8" });
      case "xlsx":
        return toXlsxBlob(table);
      case "pdf":
        return toPdfBlob(table);
    }
  },
};

const EXT: Record<ExportFormat, string> = { csv: "csv", xlsx: "xlsx", pdf: "pdf" };

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Build the file and trigger a browser download. */
export async function downloadReport(format: ExportFormat, table: ExportableTable): Promise<void> {
  const blob = await localExportService.export(format, table);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slugify(table.title)}.${EXT[format]}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Open a clean, print-optimized window for the table and invoke print. */
export function printReport(table: ExportableTable): void {
  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) return;
  const head = table.columns.map((c) => `<th>${c}</th>`).join("");
  const body = table.rows
    .map((r) => `<tr>${r.map((c) => `<td>${String(c)}</td>`).join("")}</tr>`)
    .join("");
  win.document.write(`<!doctype html><html><head><title>${table.title}</title>
    <style>
      body{font-family:ui-sans-serif,system-ui,sans-serif;color:#0f172a;padding:32px;}
      h1{font-size:20px;margin:0 0 16px;}
      table{width:100%;border-collapse:collapse;font-size:13px;}
      th,td{text-align:left;padding:8px 10px;border-bottom:1px solid #e2e8f0;}
      th{text-transform:uppercase;font-size:11px;letter-spacing:.04em;color:#64748b;}
      td:not(:first-child),th:not(:first-child){text-align:right;}
    </style></head><body>
    <h1>${table.title}</h1>
    <table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>
    </body></html>`);
  win.document.close();
  win.focus();
  win.print();
}
