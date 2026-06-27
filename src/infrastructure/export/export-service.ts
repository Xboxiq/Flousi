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

/**
 * Open a branded, print-ready A4 report (RTL Arabic) and invoke print.
 * The browser shapes Arabic + RTL correctly, so "Save as PDF" yields a clean,
 * accurate Arabic PDF — far more reliable than client-side jsPDF for Arabic.
 */
export function printReport(table: ExportableTable): void {
  const win = window.open("", "_blank", "width=900,height=1000");
  if (!win) return;
  const today = new Date().toLocaleDateString("ar-IQ", { year: "numeric", month: "long", day: "numeric" });
  const head = table.columns.map((c) => `<th>${c}</th>`).join("");
  const body = table.rows
    .map((r) => {
      const isTotal = String(r[0]).trim() === "الإجمالي";
      const cells = r
        .map((c, i) => `<td class="${i === 0 ? "name" : "num"}">${String(c)}</td>`)
        .join("");
      return `<tr class="${isTotal ? "total" : ""}">${cells}</tr>`;
    })
    .join("");

  win.document.write(`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8" />
  <title>${table.title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;600;700&family=Baloo+Bhaijaan+2:wght@600;700&display=swap" rel="stylesheet" />
  <style>
    @page { size: A4; margin: 18mm; }
    * { box-sizing: border-box; }
    body { font-family: 'Rubik', system-ui, sans-serif; color: #1b1c22; margin: 0; }
    .head { display: flex; align-items: center; justify-content: space-between; padding-bottom: 16px; border-bottom: 2px solid #0a84ff; }
    .brand { display: flex; align-items: center; gap: 10px; }
    .mark { width: 34px; height: 34px; border-radius: 10px; background: linear-gradient(160deg,#2f6bff,#7c5cff); }
    .brand b { font-family: 'Baloo Bhaijaan 2', sans-serif; font-size: 22px; }
    .meta { text-align: left; color: #767b86; font-size: 12px; }
    h1 { font-family: 'Baloo Bhaijaan 2', sans-serif; font-size: 20px; margin: 22px 0 4px; }
    .sub { color: #767b86; font-size: 13px; margin: 0 0 18px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    thead th { background: #f2f4f8; color: #767b86; font-weight: 600; text-align: right; padding: 10px 12px; font-size: 11px; }
    th.num, td.num { text-align: left; font-variant-numeric: tabular-nums; }
    tbody td { padding: 11px 12px; border-bottom: 1px solid #eef0f4; }
    tbody tr.total td { border-top: 2px solid #0a84ff; border-bottom: none; font-weight: 700; background: #f7faff; }
    .foot { margin-top: 22px; color: #a7acb6; font-size: 11px; text-align: center; }
  </style></head><body>
    <div class="head">
      <div class="brand"><span class="mark"></span><b>فلوسي</b></div>
      <div class="meta">تاريخ الإصدار<br/>${today}</div>
    </div>
    <h1>${table.title}</h1>
    <p class="sub">تقرير صافي الأرباح — مُولّد من منصّة فلوسي</p>
    <table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>
    <div class="foot">فلوسي · حساب صافي أرباح المبيعات للمتاجر والأعمال الصغيرة</div>
    <script>window.onload=function(){setTimeout(function(){window.print();},350);};</script>
  </body></html>`);
  win.document.close();
  win.focus();
}
