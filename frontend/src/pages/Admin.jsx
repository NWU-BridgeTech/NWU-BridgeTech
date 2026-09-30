import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import AppLayout from "../layouts/AppLayout";
import AdminUtilityBar from "../components/AdminUtilityBar";
import "./Admin.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5174";
const trendTones = {
  "active-students": "blue",
  "course-completions": "green",
  "average-quiz-score": "amber",
  "practical-verification-rate": "coral",
};

function getTrendPoints(values, width = 94, height = 36) {
  const pointsWithValues = (values ?? [])
    .map((value, index) =>
      value == null || !Number.isFinite(Number(value))
        ? null
        : { index, value: Number(value) },
    )
    .filter(Boolean);

  if (!pointsWithValues.length) return null;

  const numericValues = pointsWithValues.map((point) => point.value);
  const minimum = Math.min(...numericValues);
  const range = Math.max(...numericValues) - minimum || 1;
  const points = pointsWithValues
    .map(({ index, value }) => {
      const xCoordinate = (index / Math.max(values.length - 1, 1)) * width;
      const yCoordinate = height - ((value - minimum) / range) * (height - 6) - 3;
      return `${xCoordinate},${yCoordinate}`;
    })
    .join(" ");
  const lastPoint = pointsWithValues[pointsWithValues.length - 1];

  return {
    points,
    area: `0,36 ${points} 94,36`,
    lastPoint: {
      x: (lastPoint.index / Math.max(values.length - 1, 1)) * width,
      y: height - ((lastPoint.value - minimum) / range) * (height - 6) - 3,
    },
  };
}

function formatMetricValue(metric) {
  if (metric.value == null) return "No data";

  const value = Number(metric.value);
  if (!Number.isFinite(value)) return "No data";

  if (metric.unit === "percent") {
    return `${value.toLocaleString(undefined, { maximumFractionDigits: 1 })}%`;
  }

  return Math.round(value).toLocaleString();
}

function formatRelativeTime(timestamp) {
  const elapsedSeconds = (new Date(timestamp).getTime() - Date.now()) / 1000;
  if (!Number.isFinite(elapsedSeconds)) return "";

  const units = [
    { unit: "year", seconds: 31536000 },
    { unit: "month", seconds: 2592000 },
    { unit: "week", seconds: 604800 },
    { unit: "day", seconds: 86400 },
    { unit: "hour", seconds: 3600 },
    { unit: "minute", seconds: 60 },
    { unit: "second", seconds: 1 },
  ];
  const relativeTime = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  const selectedUnit = units.find(({ seconds }) => Math.abs(elapsedSeconds) >= seconds) ?? units[6];

  return relativeTime.format(Math.round(elapsedSeconds / selectedUnit.seconds), selectedUnit.unit);
}

export default function Admin() {
  const [dashboardData, setDashboardData] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState("");
  const [expandedItems, setExpandedItems] = useState({});

  useEffect(() => {
    const controller = new AbortController();

    async function loadDashboard() {
      const token = localStorage.getItem("token");
      if (!token) {
        setDashboardError("Sign in with an administrator account to view live dashboard data.");
        setDashboardLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/admin/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Your session has expired. Sign in again to load the dashboard.");
          }
          if (response.status === 403) {
            throw new Error("This dashboard is available to administrator accounts only.");
          }
          throw new Error("Could not load the admin dashboard. Please try again.");
        }

        setDashboardData(await response.json());
      } catch (error) {
        if (error.name !== "AbortError") setDashboardError(error.message);
      } finally {
        if (!controller.signal.aborted) setDashboardLoading(false);
      }
    }

    loadDashboard();
    return () => controller.abort();
  }, []);

  return (
    <AppLayout>
      <AdminUtilityBar />
      <section
        className="learning-overview learning-overview-top"
        aria-labelledby="learning-heading"
      >
        <div className="learning-overview-heading">
          <div>
            <h1 id="learning-heading">Learning overview</h1>
            <p>Student activity and performance from current platform records.</p>
          </div>
          <Link className="btn blue" to="/home">
            Student view
          </Link>
        </div>

        {dashboardLoading && (
          <p className="dashboard-message">Loading live learning data...</p>
        )}
        {dashboardError && (
          <p className="dashboard-message" role="alert">
            {dashboardError}
          </p>
        )}

        <div className="learning-stats">
          {(dashboardData?.learningOverview ?? []).map((stat) => {
            const trend = getTrendPoints(stat.trend);

            return (
              <article className="learning-stat" key={stat.label}>
                <h2>{stat.label}</h2>
                <div className="learning-stat-main">
                  <p className="learning-stat-value">{formatMetricValue(stat)}</p>
                  <div className="learning-stat-chart">
                    {trend ? (
                      <svg
                        viewBox="0 0 94 36"
                        role="img"
                        aria-label={`${stat.label} trend over the past seven days`}
                        data-tone={trendTones[stat.key]}
                      >
                        <polygon points={trend.area} />
                        <polyline points={trend.points} />
                        <circle cx={trend.lastPoint.x} cy={trend.lastPoint.y} r="2.5" />
                      </svg>
                    ) : (
                      <span className="learning-trend-empty">No recent data</span>
                    )}
                    {trend && <span>Past 7 days</span>}
                  </div>
                </div>
                <p className="learning-stat-description">{stat.description}</p>
              </article>
            );
          })}
        </div>
        {!dashboardLoading && !dashboardError && dashboardData?.learningOverview?.length === 0 && (
          <p className="dashboard-message">No learning data is available yet.</p>
        )}
      </section>

      <div className="content">
        <div className="dashboard-panels">
          <section
            className="dashboard-panel attention-panel"
            aria-labelledby="attention-heading"
          >
            <h2 className="attention-heading" id="attention-heading">
              Needs attention
            </h2>
            <p className="attention-intro">
              Expand a category to see the items needing action.
            </p>

            <div className="attention-cards">
              {(dashboardData?.needsAttention ?? []).map((item) => {
                const detailsId = `attention-details-${item.label
                  .toLowerCase()
                  .replaceAll(" ", "-")}`;
                const isExpanded = Boolean(expandedItems[item.key]);

                return (
                  <article
                    className={`attention-card${isExpanded ? " expanded" : ""}`}
                    key={item.label}
                  >
                    <button
                      type="button"
                      className="attention-card-toggle"
                      aria-expanded={isExpanded}
                      aria-controls={detailsId}
                      onClick={() =>
                        setExpandedItems((current) => ({
                          ...current,
                          [item.key]: !current[item.key],
                        }))
                      }
                    >
                      <span className="attention-card-copy">
                        <span className="attention-card-heading">
                          <span>{item.label}</span>
                          <b>{item.count}</b>
                        </span>
                        <span className="attention-card-note">{item.note}</span>
                      </span>
                      <ChevronDown
                        className="attention-chevron"
                        size={18}
                        aria-hidden="true"
                      />
                    </button>

                    <ul
                      className="attention-detail-list"
                      id={detailsId}
                      hidden={!isExpanded}
                    >
                      {item.items.map((detail) => (
                        <li key={detail.title}>
                          <strong>{detail.title}</strong>
                          <span>{detail.detail}</span>
                        </li>
                      ))}
                    </ul>
                  </article>
                );
              })}
            </div>
            {!dashboardLoading && !dashboardError && dashboardData?.needsAttention?.length === 0 && (
              <p className="dashboard-message">No attention items right now.</p>
            )}
          </section>

          <section
            className="dashboard-panel recent-activity-panel"
            aria-labelledby="recent-activity-heading"
          >
            <h2 className="attention-heading" id="recent-activity-heading">
              Recent activity
            </h2>
            <p className="attention-intro">Latest learner and course updates.</p>

            <ol className="recent-activity-list">
              {(dashboardData?.recentActivity ?? []).map((activity) => (
                <li className="recent-activity-item" key={activity.id}>
                  <span className="recent-activity-marker" aria-hidden="true" />
                  <div className="recent-activity-copy">
                    <p>
                      <strong>{activity.actor}</strong> {activity.action}
                    </p>
                    <span>{activity.subject}</span>
                  </div>
                  <span className="recent-activity-time">
                    {formatRelativeTime(activity.occurredAt)}
                  </span>
                </li>
              ))}
            </ol>
            {!dashboardLoading && !dashboardError && dashboardData?.recentActivity?.length === 0 && (
              <p className="dashboard-message">No recent student activity.</p>
            )}
          </section>
        </div>

        <section
          className={`platform-status status-${dashboardData?.platformStatus?.state ?? "unknown"}`}
          aria-label="Platform status"
        >
          <div>
            <p className="platform-status-heading">
              <span className="status-dot" aria-hidden="true" />
              {dashboardData?.platformStatus?.title ?? "Platform status unavailable"}
            </p>

            <p className="platform-status-details">
              {dashboardData?.platformStatus?.details ?? "Status is available when dashboard data loads."}
            </p>
          </div>

          <Link to="/system-status">
            View system status <span aria-hidden="true">→</span>
          </Link>
        </section>

      </div>
    </AppLayout>
  );
}