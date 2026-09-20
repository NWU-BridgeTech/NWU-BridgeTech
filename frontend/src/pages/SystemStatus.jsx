import { Link } from "react-router-dom";
import AppLayout from "../layouts/AppLayout";
import "./Admin.css";
import "./SystemStatus.css";

const METRICS = [
  { label: "Uptime, 30 days", value: "99.96%", change: "▲ 0.02%", tone: "" },
  { label: "Avg API latency", value: "142ms", change: "▼ 8ms", tone: "" },
  { label: "P95 latency", value: "310ms", change: "▲ 14ms", tone: "amber" },
  { label: "Error rate", value: "0.08%", change: "▼ 0.02%", tone: "" },
];

const UPTIME_DAYS = Array.from({ length: 30 }, (_, i) => ({
  watch: i === 17,
}));

const SERVICES = [
  { name: "Web app", status: "ok", pill: "OK", latency: "118ms", uptime: "99.99%" },
  { name: "API", status: "ok", pill: "OK", latency: "142ms", uptime: "99.97%" },
  { name: "Database", status: "ok", pill: "OK", latency: "21ms", uptime: "99.99%" },
  { name: "Auto-grading", status: "ok", pill: "OK", latency: "390ms", uptime: "99.92%" },
  { name: "GitHub verification", status: "watch", pill: "Slow", latency: "640ms", uptime: "99.61%" },
  { name: "AI video summaries", status: "ok", pill: "OK", latency: "1.2s", uptime: "99.88%" },
  { name: "Certificates", status: "ok", pill: "OK", latency: "210ms", uptime: "99.98%" },
];

const RECENT_NOTES = [
  {
    title: "GitHub verification running slow",
    body: "Hitting GitHub's API rate limit during peak hours. Watching it, may add caching if it keeps happening.",
    time: "ongoing, started 40 min ago",
  },
  {
    title: "Auto-grading was down for ~6 min",
    body: "Bad deploy. Rolled back.",
    time: "12 days ago",
  },
  {
    title: "DB maintenance",
    body: "Planned upgrade, no downtime for students.",
    time: "21 days ago",
  },
];

export default function SystemStatus() {
  return (
    <AppLayout>
      <div className="system-status-page">
        <header className="top">
          <div>
            <h1>System status</h1>
            <p>Latency and uptime, checked every 5 minutes.</p>
          </div>
          <div className="top-actions">
            <button className="select">Last 24 hours ▾</button>
            <Link className="btn blue" to="/admin">
              Back to dashboard
            </Link>
          </div>
        </header>

        <div className="content">
          <div className="status-line">
            <span className="dot watch" />
            <span>
              <b>Mostly operational</b> — GitHub verification is running
              slower than usual
            </span>
            <span className="updated">checked 32s ago</span>
          </div>

          <section className="metrics">
            {METRICS.map((m) => (
              <div className="metric" key={m.label}>
                <small>{m.label}</small>
                <b>{m.value}</b>
                <span className={`change${m.tone ? " " + m.tone : ""}`}>
                  {m.change}
                </span>
              </div>
            ))}
          </section>

          <div className="grid">
            <section className="card">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div>
                  <h3>Latency</h3>
                  <p className="sub">API response time, last 24h.</p>
                </div>
                <span className="sub">avg · p95</span>
              </div>
              <div className="chart">
                <svg
                  viewBox="0 0 900 220"
                  preserveAspectRatio="none"
                  style={{ width: "100%", height: "100%" }}
                >
                  <line x1="0" y1="55" x2="900" y2="55" stroke="#eef0f4" strokeWidth="1" />
                  <line x1="0" y1="110" x2="900" y2="110" stroke="#eef0f4" strokeWidth="1" />
                  <line x1="0" y1="165" x2="900" y2="165" stroke="#eef0f4" strokeWidth="1" />
                  <path
                    d="M0 190 C60 175,100 185,150 170 S230 150,280 175 S370 185,420 160 S500 140,560 165 S640 180,700 155 S790 145,900 170"
                    fill="none"
                    stroke="#c9c2ac"
                    strokeWidth="1.6"
                  />
                  <path
                    d="M0 205 C60 195,100 200,150 190 S230 180,280 195 S370 200,420 185 S500 175,560 190 S640 198,700 180 S790 175,900 192"
                    fill="none"
                    stroke="#315db6"
                    strokeWidth="2.2"
                  />
                </svg>
              </div>
            </section>

            <aside className="card">
              <h3>Uptime, 30 days</h3>
              <p className="sub">99.96% — one short incident, resolved.</p>
              <div className="uptime-strip">
                {UPTIME_DAYS.map((d, i) => (
                  <i className={d.watch ? "watch" : ""} key={i} />
                ))}
              </div>
              <div className="uptime-caption">
                <span>30 days ago</span>
                <span>today</span>
              </div>
            </aside>
          </div>

          <section className="card" style={{ marginTop: 28 }}>
            <h3>Services</h3>
            <table className="table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Status</th>
                  <th>Latency</th>
                  <th>Uptime</th>
                </tr>
              </thead>
              <tbody>
                {SERVICES.map((s) => (
                  <tr key={s.name}>
                    <td>
                      <div className="svc-name">
                        <span className={`svc-dot ${s.status}`} />
                        {s.name}
                      </div>
                    </td>
                    <td>
                      <span className={`pill${s.status === "watch" ? " watch" : ""}`}>
                        {s.pill}
                      </span>
                    </td>
                    <td>{s.latency}</td>
                    <td>{s.uptime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <div className="lower">
            <section className="card">
              <h3>Recent</h3>
              {RECENT_NOTES.map((n) => (
                <div className="note" key={n.title}>
                  <div className="t">{n.title}</div>
                  <div className="d">{n.body}</div>
                  <div className="time">{n.time}</div>
                </div>
              ))}
            </section>
          </div>
        </div>

        <footer className="admin-foot">
          <div className="fbrand">
            Bridge<b>Tech</b> — Faculty
          </div>
          <div className="flinks">
            <a href="#">Help centre</a>
            <a href="#">Contact support</a>
            <Link to="/">Public website</Link>
          </div>
          <div>© 2026 BridgeTech</div>
        </footer>
      </div>
    </AppLayout>
  );
}
