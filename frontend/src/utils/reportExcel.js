
import ExcelJS from "exceljs";

// ============================================
// BRIDGETECH REPORT COLOURS
// ============================================

const COLORS = {
  primary: "3159AD",
  primaryDark: "244582",
  white: "FFFFFF",
  background: "F4F7FB",
  lightBlue: "EAF0FB",
  border: "DCE4EF",
  text: "202733",
  muted: "687384",
};

// ============================================
// HELPERS
// ============================================

// Determines suitable column widths.
function getColumnWidth(column, rows = []) {
  const key = column?.key || "";
  const header = String(column?.label || "");

  // Minimum widths by column type
  const minimums = {
    module: 50,
    name: 30,
    email: 38,
    question: 80,
    registered: 22,
    status: 16,
    role: 18,
    share: 14,
    enrollments: 16,
    attempts: 18,
    passed: 14,
    failed: 14,
    rate: 14,
    completed: 16,
    average: 16,
    fastest: 16,
    slowest: 16,
    count: 14,
  };

  // Maximum widths by column type
  const maximums = {
    module: 60,
    name: 36,
    email: 45,
    question: 90,
    registered: 24,
    status: 18,
    role: 20,
    share: 16,
    enrollments: 18,
    attempts: 20,
    passed: 16,
    failed: 16,
    rate: 16,
    completed: 18,
    average: 18,
    fastest: 18,
    slowest: 18,
    count: 16,
  };

  // Calculate longest text in this column
  const longestValue = rows.reduce((max, row) => {
    const text = String(row?.[key] ?? "");
    return Math.max(max, text.length);
  }, header.length);

  // Add a little padding
  const suggested = longestValue + 4;

  const min = minimums[key] || 20;
  const max = maximums[key] || 28;

  return Math.max(min, Math.min(max, suggested));
}

// Keep numeric values as numbers in Excel.
// Percentages are converted into actual percentage values.
function formatCellValue(value) {
  if (typeof value === "number") {
    return {
      value,
      format: "#,##0.##",
    };
  }

  const text = String(value ?? "").trim();

  // Percentages
  if (/^-?\d+(\.\d+)?%$/.test(text)) {
    return {
      value: Number(text.replace("%", "")) / 100,
      format: "0.0%",
    };
  }

  // Numeric values
  if (/^-?\d+(\.\d+)?$/.test(text)) {
    return {
      value: Number(text),
      format: "#,##0.##",
    };
  }

  return {
    value: text,
    format: "@",
  };
}

// Prevent externally supplied text from being
// interpreted as spreadsheet formulas.
function safeText(value) {
  const text = String(value ?? "");

  if (/^[\s]*[=+\-@]/.test(text)) {
    return `'${text}`;
  }

  return text;
}

// ============================================
// MAIN EXCEL DOWNLOAD FUNCTION
// ============================================

export async function downloadReportExcel(
  report,
  slug = "report"
) {
  if (!report) {
    throw new Error("No report loaded.");
  }

  const workbook = new ExcelJS.Workbook();

  workbook.creator = "BridgeTech LMS";
  workbook.created = new Date();
  workbook.modified = new Date();

  const sheet = workbook.addWorksheet("Report", {
    views: [
      {
        state: "normal",
        showGridLines: false,
      },
    ],
    pageSetup: {
      paperSize: 9,
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
    },
  });

  const columns = report.columns || [];
  const rows = report.rows || [];
  const metrics = report.metrics || [];

  const totalColumns = Math.max(columns.length, 3);

  // ============================================
  // COLUMN WIDTHS
  // ============================================

for (let i = 1; i <= totalColumns; i++) {
  const column = columns[i - 1];

  sheet.getColumn(i).width = column
    ? getColumnWidth(column, rows)
    : 24;
}

  // ============================================
  // MAIN BLUE HEADER
  // ============================================

  sheet.mergeCells(1, 1, 2, totalColumns);

  const brandCell = sheet.getCell(1, 1);

  brandCell.value = "BRIDGETECH LMS";
  brandCell.font = {
    name: "Calibri",
    size: 19,
    bold: true,
    color: { argb: COLORS.white },
  };

  brandCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: COLORS.primary },
  };

  brandCell.alignment = {
    vertical: "middle",
    horizontal: "left",
    indent: 1,
  };

  sheet.getRow(1).height = 24;
  sheet.getRow(2).height = 19;

  // ============================================
  // REPORT TITLE
  // ============================================

  sheet.mergeCells(4, 1, 4, totalColumns);

  const titleCell = sheet.getCell(4, 1);

  titleCell.value = safeText(
    report.title || "Administrative Report"
  );

  titleCell.font = {
    name: "Calibri",
    size: 17,
    bold: true,
    color: { argb: COLORS.text },
  };

  sheet.getRow(4).height = 31;

  // ============================================
  // DESCRIPTION
  // ============================================

  sheet.mergeCells(5, 1, 5, totalColumns);

  const descriptionCell = sheet.getCell(5, 1);

  descriptionCell.value = safeText(
    report.description || ""
  );

  descriptionCell.font = {
    name: "Calibri",
    size: 11,
    color: { argb: COLORS.muted },
  };

  descriptionCell.alignment = {
    wrapText: true,
    vertical: "middle",
  };

  sheet.getRow(5).height = 38;

  // ============================================
  // GENERATION DATE
  // ============================================

  const generated = new Date(
    report.generatedAt || Date.now()
  );

  sheet.getCell(7, 1).value = "Generated on:";
  sheet.getCell(7, 1).font = {
    bold: true,
    color: { argb: COLORS.text },
  };

  sheet.getCell(7, 2).value =
    Number.isNaN(generated.getTime())
      ? "Unknown"
      : generated;

  if (!Number.isNaN(generated.getTime())) {
    sheet.getCell(7, 2).numFmt =
      "dd mmm yyyy hh:mm";
  }

  // ============================================
  // SUMMARY HEADING
  // ============================================

  const summaryHeadingRow = 9;

  sheet.mergeCells(
    summaryHeadingRow,
    1,
    summaryHeadingRow,
    totalColumns
  );

  const summaryHeading = sheet.getCell(
    summaryHeadingRow,
    1
  );

  summaryHeading.value = "REPORT SUMMARY";

  summaryHeading.font = {
    bold: true,
    size: 12,
    color: { argb: COLORS.primaryDark },
  };

  summaryHeading.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: COLORS.lightBlue },
  };

  summaryHeading.alignment = {
    vertical: "middle",
    indent: 1,
  };

  sheet.getRow(summaryHeadingRow).height = 28;

  // ============================================
  // SUMMARY STATISTICS
  // ============================================

  let rowNumber = 10;

  metrics.forEach((metric) => {
    const row = sheet.getRow(rowNumber);

    const labelCell = row.getCell(1);
    const valueCell = row.getCell(2);

    labelCell.value = safeText(metric.label);
    labelCell.font = {
      bold: true,
      color: { argb: COLORS.text },
    };

    const formatted = formatCellValue(metric.value);

    valueCell.value =
      typeof formatted.value === "string"
        ? safeText(formatted.value)
        : formatted.value;

    valueCell.numFmt = formatted.format;

    valueCell.font = {
      bold: true,
      color: { argb: COLORS.primary },
    };

    row.height = 25;

    rowNumber++;
  });

  // ============================================
  // TABLE SECTION TITLE
  // ============================================

  const tableTitleRow = rowNumber + 2;

  sheet.mergeCells(
    tableTitleRow,
    1,
    tableTitleRow,
    totalColumns
  );

  const sectionCell = sheet.getCell(
    tableTitleRow,
    1
  );

  sectionCell.value = "DETAILED REPORT";

  sectionCell.font = {
    bold: true,
    size: 12,
    color: { argb: COLORS.primaryDark },
  };

  sectionCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: COLORS.lightBlue },
  };

  sectionCell.alignment = {
    indent: 1,
    vertical: "middle",
  };

  sheet.getRow(tableTitleRow).height = 28;

  // ============================================
  // TABLE HEADER
  // ============================================

  const tableHeaderRow = tableTitleRow + 2;

  const headerRow = sheet.getRow(tableHeaderRow);

  columns.forEach((column, index) => {
    const cell = headerRow.getCell(index + 1);

    cell.value = safeText(column.label);

    cell.font = {
      name: "Calibri",
      size: 11,
      bold: true,
      color: { argb: COLORS.white },
    };

    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: COLORS.primaryDark },
    };

    cell.alignment = {
      vertical: "middle",
      horizontal: "left",
      wrapText: true,
      indent: 1,
    };

    cell.border = {
      bottom: {
        style: "thin",
        color: { argb: COLORS.border },
      },
    };
  });

  headerRow.height = 32;

  // ============================================
  // TABLE DATA
  // ============================================

  let dataRowNumber = tableHeaderRow + 1;

  rows.forEach((record, index) => {
    const excelRow = sheet.getRow(dataRowNumber);

    columns.forEach((column, columnIndex) => {
      const cell = excelRow.getCell(
        columnIndex + 1
      );

      const rawValue = record[column.key] ?? "";

      const formatted = formatCellValue(rawValue);

      cell.value =
        typeof formatted.value === "string"
          ? safeText(formatted.value)
          : formatted.value;

      cell.numFmt = formatted.format;

      cell.font = {
        name: "Calibri",
        size: 10,
        color: { argb: COLORS.text },
      };

      if (columnIndex === 0) {
        cell.font = {
        name: "Calibri",
        size: 10,
        bold: true,
        color: { argb: COLORS.text },
  };
}

      cell.alignment = {
  vertical: "middle",
  horizontal:
    typeof formatted.value === "number"
      ? "right"
      : "left",
  wrapText: column.key === "question",
  indent:
    typeof formatted.value === "number"
      ? 0
      : 1,
};

      if (index % 2 === 1) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: COLORS.background },
        };
      }

      cell.border = {
        bottom: {
          style: "hair",
          color: { argb: COLORS.border },
        },
      };
    });

    // Additional height for long Blui questions.
    const hasLongText = columns.some((column) => {
        const text = String(record[column.key] ?? "");
        return text.length > 80;
    });

    excelRow.height = hasLongText ? 42 : 24;

    dataRowNumber++;
  });

  // ============================================
  // FILTERS AND FREEZE PANES
  // ============================================

  if (columns.length > 0) {
    sheet.autoFilter = {
      from: {
        row: tableHeaderRow,
        column: 1,
      },
      to: {
        row: tableHeaderRow,
        column: columns.length,
      },
    };
  }

  // Freeze the report's header area so column
  // headings remain accessible when scrolling.
 
    sheet.views = [
    {
        state: "normal",
        showGridLines: false,
    },
    ];


  // ============================================
  // PRINT SETTINGS
  // ============================================

  sheet.pageSetup.printTitlesRow =
    `${tableHeaderRow}:${tableHeaderRow}`;

  sheet.pageSetup.margins = {
    left: 0.3,
    right: 0.3,
    top: 0.5,
    bottom: 0.5,
    header: 0.2,
    footer: 0.2,
  };

  sheet.headerFooter.oddFooter =
    "BridgeTech LMS | Page &P of &N";

  // ============================================
  // GENERATE EXCEL FILE
  // ============================================

  const buffer = await workbook.xlsx.writeBuffer();

  const blob = new Blob([buffer], {
    type:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;

  const date = new Date()
    .toISOString()
    .slice(0, 10);

  link.download =
    `BridgeTech_${slug.replace(/-/g, "_")}_${date}.xlsx`;

  document.body.appendChild(link);

  link.click();
  link.remove();

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}
