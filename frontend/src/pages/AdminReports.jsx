import { useEffect, useState } from "react";
import AppLayout from "../layouts/AppLayout";
import "./Admin.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5174";

function formatValue(metric) {
  if (metric.value == null) return "No data";
  const value = Number(metric.value);
  if (!Number.isFinite(value)) return "No data";
  return metric.unit === "percent"
    ? `${value.toLocaleString(undefined, { maximumFractionDigits: 1 })}%`
    : Math.round(value).toLocaleString();
}

export default function AdminReports() {
  const [report, setReport] = useState(null);
  const [bluiUsage, setBluiUsage] = useState(null);
  const [error, setError] = useState("");

  function downloadCsv(path, filename) {
    const token = localStorage.getItem("token");
    fetch(`${API_URL}/api/admin/reports/${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not download the report.");
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
      })
      .catch((downloadError) => setError(downloadError.message));
  }

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_URL}/api/admin/dashboard`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load reports.");
        setReport(await response.json());
      })
      .catch((requestError) => {
        if (requestError.name !== "AbortError") setError(requestError.message);
      });
    return () => controller.abort();
  }, []);

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
      <header className="top dashboard-header">
        <div>
          <h1>Reports</h1>
          <p>Current learning activity and platform performance.</p>
        </div>
        <div className="dashboard-header-actions">
          <button
            className="btn blue"
            type="button"
            onClick={() => downloadCsv("overview.csv", "platform-overview.csv")}
          >
            Download overview CSV
          </button>
          <button
            className="btn"
            type="button"
            onClick={() => downloadCsv("users.csv", "users-report.csv")}
          >
            Download users CSV
          </button>
        </div>
      </header>
      <div className="content">
        {error && <p className="dashboard-message" role="alert">{error}</p>}
        {!report && !error && <p className="dashboard-message">Loading reports...</p>}
        {report && (
          <>
            <section className="learning-stats" aria-label="Learning metrics">
              {report.learningOverview.map((metric) => (
                <article className="learning-stat" key={metric.key}>
                  <h2>{metric.label}</h2>
                  <p className="learning-stat-value">{formatValue(metric)}</p>
                  <p className="learning-stat-description">{metric.description}</p>
                </article>
              ))}
            </section>
            <section className="dashboard-panel recent-activity-panel" aria-labelledby="report-activity-heading">
              <h2 className="attention-heading" id="report-activity-heading">Recent activity</h2>
              <ol className="recent-activity-list">
                {report.recentActivity.map((activity) => (
                  <li className="recent-activity-item" key={activity.id}>
                    <span className="recent-activity-marker" aria-hidden="true" />
                    <div className="recent-activity-copy">
                      <p><strong>{activity.actor}</strong> {activity.action}</p>
                      <span>{activity.subject}</span>
                    </div>
                  </li>
                ))}
              </ol>
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
