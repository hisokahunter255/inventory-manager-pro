import { Button } from "@/components/ui/button";
import { FileSpreadsheet, FileText } from "lucide-react";
import { exportToExcel, exportToPDF, type ExportColumn } from "@/lib/export";

type Props = {
  filename: string;
  title: string;
  columns: ExportColumn[];
  rows: Record<string, unknown>[];
  disabled?: boolean;
};

export function ExportButtons({ filename, title, columns, rows, disabled }: Props) {
  return (
    <div className="flex gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || rows.length === 0}
        onClick={() => exportToExcel(filename, title, columns, rows)}
      >
        <FileSpreadsheet className="ml-2 h-4 w-4" /> Excel
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || rows.length === 0}
        onClick={() => exportToPDF(filename, title, columns, rows)}
      >
        <FileText className="ml-2 h-4 w-4" /> PDF
      </Button>
    </div>
  );
}
