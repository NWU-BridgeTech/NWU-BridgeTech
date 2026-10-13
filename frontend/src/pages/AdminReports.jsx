
import { useEffect, useState } from "react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

import AppLayout from "../layouts/AppLayout";
import { apiFetch } from "../utils/apiClient";
import { downloadReportPdf } from "../utils/reportPdf";
import { downloadReportExcel } from "../utils/reportExcel";
import "./Admin.css";
import "./AdminReports.css";

// ================================================
// REPORT TABS
// ================================================

const REPORT_TABS = [
  {
    id: "course-applications",
    label: "Course Applications",
  },
  {
    id: "quiz-pass-rates",
    label: "Quiz Pass Rates",
  },
  {
    id: "registered-users",
    label: "Registered Students",
  },
  {
    id: "completion-times",
    label: "Completion Times",
  },
];

const BLUI_TAB = {
  id: "blui-usage",
  label: "Blui Usage",
};

// ================================================
// CHECK SUPERADMIN ROLE
// ================================================

function checkSuperAdmin() {
  try {
    const user = JSON.parse(
      localStorage.getItem("user") || "{}"
    );

    return user.role === "SuperAdmin";
  } catch {
    return false;
  }
}

// ================================================
// CONVERT BLUI RESPONSE INTO REPORT FORMAT
// ================================================

function buildBluiReport(data) {
  const frequentQuestions = Array.isArray(
    data?.frequentQuestions
  )
    ? data.frequentQuestions
    : [];

  return {
    title: "Blui Usage Report",

    description:
      "Blui assistant usage statistics from the last 30 days.",

    generatedAt: new Date().toISOString(),

    chartTitle: "Most frequently asked questions",
    chartType: "bar",
    chartUnit: "Questions",

    metrics: [
      {
        label: "Student questions",
        value: String(data?.studentQuestions ?? 0),
      },
      {
        label: "Unique students",
        value: String(data?.uniqueStudents ?? 0),
      },
      {
        label: "Failed responses",
        value: String(data?.failedResponses ?? 0),
      },
    ],

    columns: [
      {
        key: "question",
        label: "Question",
      },
      {
        key: "count",
        label: "Times asked",
      },
    ],

    rows: frequentQuestions.map((item) => ({
      question: item.question ?? "",
      count: String(item.count ?? 0),
    })),

    chart: frequentQuestions.map((item) => ({
      label: item.question ?? "",
      value: Number(item.count ?? 0),
    })),
  };
}

// ================================================
// REUSABLE REPORT GRAPH
// ================================================

function ReportGraph({ report }) {
  const chartData = report.chart || [];

  if (chartData.length === 0) {
    return (
      <p className="reports-empty">
        No chart data available yet.
      </p>
    );
  }

  const chartProps = {
    data: chartData,
    margin: {
      top: 15,
      right: 18,
      left: 0,
      bottom: 10,
    },
  };

  const chartContent = (
    <>
      <CartesianGrid
        strokeDasharray="3 3"
        vertical={false}
      />

      <XAxis
        dataKey="label"
        tick={{ fontSize: 11 }}
        interval={0}
        angle={-20}
        textAnchor="end"
        height={80}
      />

      <YAxis
        width={48}
        domain={
          report.chartUnit === "%"
            ? [0, 100]
            : [0, "auto"]
        }
      />

      <Tooltip
        formatter={(value) =>
          `${Number(value).toLocaleString()}${
            report.chartUnit === "%" ? "%" : ""
          }`
        }
      />
    </>
  );

  return (
    <div
      className="reports-chart-area"
      role="img"
      aria-label={report.chartTitle}
    >
      <ResponsiveContainer
        width="100%"
        height="100%"
      >
        {report.chartType === "line" ? (
          <LineChart {...chartProps}>
            {chartContent}

            <Line
              dataKey="value"
              name={report.chartUnit}
              type="monotone"
              stroke="#3159ad"
              strokeWidth={3}
              dot={{ r: 3 }}
            />
          </LineChart>
        ) : (
          <BarChart {...chartProps}>
            {chartContent}

            <Bar
              dataKey="value"
              name={report.chartUnit}
              fill="#3159ad"
              maxBarSize={56}
              radius={[5, 5, 0, 0]}
            />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

// ================================================
// MAIN REPORTS PAGE
// ================================================

export default function AdminReports() {
  const [isSuperAdmin] = useState(checkSuperAdmin);

  const tabs = isSuperAdmin
    ? [...REPORT_TABS, BLUI_TAB]
    : REPORT_TABS;

  const [activeTab, setActiveTab] = useState(
    REPORT_TABS[0].id
  );

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [downloading, setDownloading] = useState(false);

  const isBluiTab = activeTab === BLUI_TAB.id;

  // ================================================
  // LOAD THE CURRENTLY SELECTED REPORT
  // ================================================

  useEffect(() => {
    let cancelled = false;

    async function loadReport() {
      setLoading(true);
      setError("");
      setReport(null);

      try {
        let data;

        if (activeTab === "blui-usage") {
          if (!isSuperAdmin) {
            throw new Error(
              "You do not have permission to view Blui usage."
            );
          }

          // Existing Blui API endpoint
          const bluiData = await apiFetch(
            "/admin/reports/blui-usage"
          );

          // Convert to the same structure as other reports
          data = buildBluiReport(bluiData);
        } else {
          // Existing analytics endpoints
          data = await apiFetch(
            `/admin/reports/analytics/${activeTab}`
          );
        }

        if (!cancelled) {
          setReport(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message || "Unable to load report."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadReport();

    return () => {
      cancelled = true;
    };
  }, [activeTab, retry, isSuperAdmin]);

  // ================================================
  // DOWNLOAD REPORT AS PDF
  // ================================================

  function handleDownload() {
    if (!report || downloading) {
      return;
    }

    setDownloading(true);
    setError("");

    try {
      downloadReportPdf(report, activeTab);
    } catch (err) {
      console.error(
        "PDF generation failed:",
        err
      );

      setError(
        err.message || "Could not generate PDF."
      );
    } finally {
      setDownloading(false);
    }
  }

  
async function handleExcelDownload() {
  if (!report || downloading || loading) {
    return;
  }

  setDownloading(true);
  setError("");

  try {
    await downloadReportExcel(report, activeTab);
  } catch (err) {
    console.error("Excel generation failed:", err);

    setError(
      err.message || "Could not generate Excel report."
    );
  } finally {
    setDownloading(false);
  }
}


  // ================================================
  // CHANGE TABS
  // ================================================

  function selectTab(tabId) {
    if (tabId === activeTab) {
      return;
    }

    setActiveTab(tabId);
  }

  // ================================================
  // RETRY LOADING
  // ================================================

  function retryReport() {
    setRetry((value) => value + 1);
  }

  // ================================================
  // PAGE RENDER
  // ================================================

  return (
    <AppLayout>

      {/* PAGE HEADER */}
      <header className="top dashboard-header">
        <div>
          <h1>Reports</h1>

          <p>
            Learning activity and platform performance.
          </p>
        </div>

      <div className="dashboard-header-actions">
        {/* DOWNLOAD PDF */}
        <button
          className="btn blue"
          type="button"
          disabled={!report || loading || downloading}
          onClick={handleDownload}
        >
          {downloading
            ? "Preparing download..."
            : "Download PDF"}
        </button>

        {/* DOWNLOAD EXCEL */}
        <button
          className="btn"
          type="button"
          disabled={!report || loading || downloading}
          onClick={handleExcelDownload}
        >
          {downloading
            ? "Preparing download..."
            : "Download Excel"}
        </button>
      </div>

      </header>

      <div className="content admin-reports-page">

        {/* REPORT TABS */}
        <nav
          className="reports-tabs"
          aria-label="Report categories"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`reports-tab ${
                activeTab === tab.id
                  ? "is-active"
                  : ""
              }`}
              aria-current={
                activeTab === tab.id
                  ? "page"
                  : undefined
              }
              onClick={() => selectTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* ERROR MESSAGE */}
        {error && (
          <div
            className="reports-alert"
            role="alert"
          >
            {error}

            <button
              type="button"
              onClick={retryReport}
            >
              Retry
            </button>
          </div>
        )}

        {/* LOADING STATE */}
        {loading && (
          <p className="reports-message">
            Loading report...
          </p>
        )}

        {/* SELECTED REPORT */}
        {!loading && report && (
          <>
            {/* REPORT TITLE */}
            <div className="reports-title-block">
              <h2>{report.title}</h2>

              <p>{report.description}</p>
            </div>

            {/* SUMMARY STATISTICS */}
            <section
              className="reports-metrics"
              aria-label="Report summary"
            >
              {(report.metrics || []).map(
                (metric) => (
                  <article
                    className="reports-metric"
                    key={metric.label}
                  >
                    <p>{metric.label}</p>

                    <strong
                      title={metric.value}
                    >
                      {metric.value}
                    </strong>
                  </article>
                )
              )}
            </section>

            {/* GRAPH - STANDARD REPORTS ONLY */}
            {!isBluiTab && (
              <section
                className="reports-panel"
                aria-label="Report chart"
              >
                <h3>{report.chartTitle}</h3>

                <ReportGraph report={report} />
              </section>
            )}

            {/* DATA TABLE */}
            <section
              className="reports-panel"
              aria-label="Report data table"
            >
              <div className="reports-table-heading">
                <h3>
                  {isBluiTab
                    ? "Frequently Asked Questions"
                    : "Report details"}
                </h3>

                <span>
                  {report.rows?.length || 0} rows
                </span>
              </div>

              {report.rows?.length ? (
                <div className="reports-table-scroll">
                  <table className="reports-table">
                    <thead>
                      <tr>
                        {report.columns.map(
                          (column) => (
                            <th
                              key={column.key}
                              scope="col"
                            >
                              {column.label}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>

                    <tbody>
                      {report.rows.map(
                        (row, index) => (
                          <tr key={index}>
                            {report.columns.map(
                              (column) => (
                                <td key={column.key}>
                                  {row[column.key] ?? "—"}
                                </td>
                              )
                            )}
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="reports-empty">
                  {isBluiTab
                    ? "No Blui questions have been recorded yet."
                    : "No records available for this report."}
                </p>
              )}
            </section>
          </>
        )}

      </div>
    </AppLayout>
  );
}
