
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export function downloadReportPdf(
  report,
  slug = "report"
) {
  if (!report) {
    throw new Error("No report loaded.");
  }

  // Create a landscape A4 PDF.
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth =
    pdf.internal.pageSize.getWidth();

  // ==========================================
  // REPORT HEADER
  // ==========================================

  const generated = report.generatedAt
    ? new Date(report.generatedAt)
    : new Date();

  const generatedText = Number.isNaN(
    generated.getTime()
  )
    ? "Unknown"
    : generated.toLocaleString();

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(17);

  pdf.text(
    "BridgeTech LMS",
    14,
    17
  );

  pdf.setFontSize(14);

  pdf.text(
    report.title || "Administrative Report",
    14,
    27
  );

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);

  pdf.text(
    `Generated: ${generatedText}`,
    14,
    35
  );

  // ==========================================
  // SUMMARY STATISTICS
  // ==========================================

  const summary = (report.metrics || []).map(
    (metric) =>
      `${metric.label}: ${metric.value}`
  );

  const summaryLines = pdf.splitTextToSize(
    summary.join("   |   "),
    pageWidth - 28
  );

  pdf.text(
    summaryLines,
    14,
    44
  );

  const tableStartY =
    46 + summaryLines.length * 4.5;

  // ==========================================
  // REPORT TABLE
  // ==========================================

  const columns = report.columns || [];
  const rows = report.rows || [];

  const tableHead = [
    columns.map((column) => column.label),
  ];

  const tableBody = rows.map((row) =>
    columns.map((column) =>
      String(row[column.key] ?? "")
    )
  );

  autoTable(pdf, {
    startY: tableStartY,

    head: tableHead,

    body: tableBody,

    theme: "striped",

    headStyles: {
      fillColor: [49, 89, 173],
    },

    styles: {
      fontSize: 8,
      cellPadding: 3,
      overflow: "linebreak",
    },

    margin: {
      left: 14,
      right: 14,
      bottom: 16,
    },

    // Footer displayed on each PDF page.
    didDrawPage: (data) => {
      const pageHeight =
        pdf.internal.pageSize.getHeight();

      pdf.setFontSize(8);
      pdf.setTextColor(110);

      pdf.text(
        "BridgeTech LMS - Administrative report",
        14,
        pageHeight - 8
      );

      pdf.text(
        `Page ${data.pageNumber}`,
        pageWidth - 28,
        pageHeight - 8
      );

      pdf.setTextColor(0);
    },
  });

  // ==========================================
  // DOWNLOAD FILE
  // ==========================================

  const date = new Date()
    .toISOString()
    .slice(0, 10);

  const filename =
    `BridgeTech_${slug.replace(/-/g, "_")}_${date}.pdf`;

  pdf.save(filename);
}
