import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export type ExportColumn = { header: string; key: string };

export function exportToExcel(
  filename: string,
  sheetName: string,
  columns: ExportColumn[],
  rows: Record<string, unknown>[],
) {
  const headerRow = columns.map((c) => c.header);
  const dataRows = rows.map((r) => columns.map((c) => r[c.key] ?? ""));
  const ws = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows]);
  // RTL view
  (ws as unknown as { "!views"?: unknown[] })["!views"] = [{ RTL: true }];
  ws["!cols"] = columns.map(() => ({ wch: 18 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportToPDF(
  filename: string,
  title: string,
  columns: ExportColumn[],
  rows: Record<string, unknown>[],
) {
  // Arabic text via jsPDF needs a font. Use HTML print fallback for proper RTL rendering.
  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) {
    // fallback to a basic jsPDF (Arabic may not render)
    const doc = new jsPDF();
    doc.text(title, 14, 16);
    autoTable(doc, {
      head: [columns.map((c) => c.header)],
      body: rows.map((r) => columns.map((c) => String(r[c.key] ?? ""))),
      startY: 22,
    });
    doc.save(`${filename}.pdf`);
    return;
  }
  const now = new Date().toLocaleString("ar-EG");
  const tableHead = columns
    .map((c) => `<th>${escapeHtml(c.header)}</th>`)
    .join("");
  const tableBody = rows
    .map(
      (r) =>
        `<tr>${columns
          .map((c) => `<td>${escapeHtml(String(r[c.key] ?? ""))}</td>`)
          .join("")}</tr>`,
    )
    .join("");
  win.document.write(`<!doctype html>
<html dir="rtl" lang="ar">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<style>
  body { font-family: 'Cairo', 'Tajawal', Arial, sans-serif; padding: 24px; color:#0f172a; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  .meta { color:#64748b; font-size: 12px; margin-bottom: 16px; }
  table { width:100%; border-collapse: collapse; font-size: 12px; }
  th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: right; }
  thead { background: #f1f5f9; }
  tr:nth-child(even) td { background: #fafafa; }
  @media print { .noprint { display:none; } body { padding: 8px; } }
  .btn { background:#2563eb; color:#fff; border:0; padding:8px 16px; border-radius:8px; cursor:pointer; font-size:14px; }
</style>
</head>
<body>
  <div class="noprint" style="margin-bottom:16px; display:flex; gap:8px;">
    <button class="btn" onclick="window.print()">طباعة / حفظ PDF</button>
    <button class="btn" style="background:#64748b" onclick="window.close()">إغلاق</button>
  </div>
  <h1>${escapeHtml(title)}</h1>
  <div class="meta">تاريخ التقرير: ${escapeHtml(now)}</div>
  <table><thead><tr>${tableHead}</tr></thead><tbody>${tableBody}</tbody></table>
  <script>setTimeout(() => window.print(), 400);<\/script>
</body>
</html>`);
  win.document.close();
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
