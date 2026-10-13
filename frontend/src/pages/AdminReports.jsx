
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

import "./Admin.css";
import "./AdminReports.css";

// The four report categories
const TABS = [
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

  // Shared chart axes, grid and tooltip
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
  // Currently selected report tab
  const [activeTab, setActiveTab] = useState(
    TABS[0].id
  );

  // API response and UI state
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [downloading, setDownloading] = useState(false);

  // ================================================
  // LOAD REPORT DATA
  // ================================================

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError("");
    setReport(null);

    apiFetch(
      `/admin/reports/analytics/${activeTab}`
    )
      .then((data) => {
        if (!cancelled) {
          setReport(data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err.message || "Unable to load report."
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeTab, retry]);

  // ================================================
  // DOWNLOAD SELECTED REPORT AS PDF
  // ================================================

  async function handleDownload() {
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

  // ================================================
  // RENDER
  // ================================================

  useEffect(() => {
    let role = "";
    try {
      role = JSON.parse(localStorage.getItem("user") || "{}").role || "";
    } catch {
      role = "";
    }
    if (role !== "SuperAdmin") return undefined;

    const controller = new AbortController();
    fetch(`${API_URL}/api/admin/reports/blui-usage`, {
      headers: { Authorization: `******"token")}` },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load Blui usage.");
        setBluiUsage(await response.json());
      })
      .catch((requestError) => {
        if (requestError.name !== "AbortError") setError(requestError.message);
      });
    return () => controller.abort();
  }, []);

  return (
    <AppLayout>

      {/* REPORTS PAGE HEADER */}
      <header className="top dashboard-header">
        <div>
          <h1>Reports</h1>

          <p>
            Learning activity and platform performance.
          </p>
        </div>

        <div className="dashboard-header-actions">
          <button
            className="btn blue"
            type="button"
            disabled={
              !report ||
              loading ||
              downloading
            }
            onClick={handleDownload}
          >
            {downloading
              ? "Generating PDF..."
              : "Download PDF"}
          </button>
        </div>
      </header>

      <div className="content admin-reports-page">

        {/* REPORT TABS */}
        <nav
          className="reports-tabs"
          aria-label="Report categories"
        >
          {TABS.map((tab) => (
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
              onClick={() => {
                setActiveTab(tab.id);
              }}
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
              onClick={() => {
                setRetry((value) => value + 1);
              }}
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
            {/* REPORT HEADING */}
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

            {/* GRAPH */}
            <section
              className="reports-panel"
              aria-label="Report chart"
            >
              <h3>{report.chartTitle}</h3>

              <ReportGraph report={report} />
            </section>

            {/* DATA TABLE */}
            <section
              className="reports-panel"
              aria-label="Report data table"
            >
              <div className="reports-table-heading">
                <h3>Report details</h3>

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
                  No records available for this report.
                </p>
              )}
            </section>
            {bluiUsage && (
              <section className="dashboard-panel recent-activity-panel" aria-labelledby="blui-usage-heading">
                <h2 className="attention-heading" id="blui-usage-heading">Blui usage · last 30 days</h2>
                <div className="learning-stats">
                  <article className="learning-stat"><h2>Student questions</h2><p className="learning-stat-value">{bluiUsage.studentQuestions}</p></article>
                  <article className="learning-stat"><h2>Unique students</h2><p className="learning-stat-value">{bluiUsage.uniqueStudents}</p></article>
                  <article className="learning-stat"><h2>Failed responses</h2><p className="learning-stat-value">{bluiUsage.failedResponses}</p></article>
                </div>
                <h3>Frequent questions</h3>
                {bluiUsage.frequentQuestions.length === 0 ? (
                  <p className="dashboard-message">No Blui questions have been recorded yet.</p>
                ) : (
                  <ol className="recent-activity-list">
                    {bluiUsage.frequentQuestions.map((question) => (
                      <li className="recent-activity-item" key={question.question}>
                        <span className="recent-activity-marker" aria-hidden="true" />
                        <div className="recent-activity-copy">
                          <p><strong>{question.count}×</strong> {question.question}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            )}
          </>
        )}

      </div>
    </AppLayout>
  );
}
