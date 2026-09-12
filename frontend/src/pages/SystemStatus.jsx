import React from "react";

/**
 * BridgeTech — Admin: System status
 * Converted from system-status.html (static) to a React functional component.
 *
 * Notes on the conversion:
 * - `class` -> `className`, `stroke-width` -> `strokeWidth` (SVG attrs are
 *   camelCase in JSX).
 * - the original <style> block is kept as-is inside a <style> tag. Move it
 *   into a .css file and `import` it if your project prefers that.
 * - the uptime strip and services table are data-driven (mapped from arrays)
 *   instead of being hand-repeated <i>/<tr> tags, which makes it easy to
 *   wire up to a real status API later.
 * - "admin.html" / "index.html" links are left as plain <a href="..."> —
 *   swap for <Link to="..."> if you're using react-router.
 */

const STYLES = `
*{box-sizing:border-box}body{margin:0;font-family:Inter,Arial,sans-serif;color:#202733;background:#f5f6f8}.app{display:grid;grid-template-columns:242px 1fr;min-height:100vh}.side{background:#fff;border-right:1px solid #e6e9ee;padding:23px 16px}.brand{font-size:22px;font-weight:800;padding:0 11px 29px}.brand b{color:#315db6}.label{font-size:10px;font-weight:800;color:#9aa3af;letter-spacing:.08em;margin:23px 12px 8px}.nav{padding:12px;border-radius:9px;color:#596473;font-size:14px;margin:3px 0;display:block}.nav.active{background:#edf3ff;color:#274e9f;font-weight:700}.main{min-width:0}.top{height:112px;background:#fff;border-bottom:1px solid #e6e9ee;padding:0 42px;display:flex;align-items:center;justify-content:space-between}.greeting{font-size:29px;font-weight:400;color:#7d838c}.greeting b{color:#202733}.top p{color:#818995;margin:8px 0 0}.top-actions{display:flex;gap:10px;align-items:center}.select,.btn{border:1px solid #d8dee8;background:#fff;padding:11px 14px;border-radius:7px;font-size:13px}.btn.blue{background:#315db6;color:#fff;border-color:#315db6}.content{padding:22px 42px}.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:22px;margin-bottom:30px}.metric{padding:6px 0}.metric small{color:#7a8491}.metric b{font-size:29px;display:block;margin:8px 0}.change{font-size:12px;color:#16835d}.change.red{color:#ca5865}.change.amber{color:#a56a13}.grid{display:grid;grid-template-columns:1.7fr .85fr;gap:28px}.card{background:#fff;border:1px solid #e6e9ed;border-radius:17px;padding:25px}.card h3{margin:0;font-size:18px}.sub{color:#7b8490;margin:9px 0;font-size:13px}.chart{height:220px;margin-top:20px}.lower{display:grid;grid-template-columns:1fr .9fr;gap:28px;margin-top:28px}.table{width:100%;border-collapse:collapse;font-size:13px;margin-top:12px}.table th,.table td{text-align:left;padding:13px 8px;border-bottom:1px solid #edf0f3}.table th{color:#8a929e;font-weight:600}.pill{font-size:10px;background:#eaf8f1;color:#19815c;padding:5px 8px;border-radius:10px;font-weight:800}.pill.watch{background:#fdf1de;color:#a56a13}
.status-line{display:flex;align-items:center;gap:10px;margin-bottom:24px;font-size:13.5px;color:#5d6878}
.status-line .dot{width:8px;height:8px;border-radius:50%;background:#19815c;flex-shrink:0}
.status-line .dot.watch{background:#d99a1f}
.status-line b{color:#202733}
.status-line .updated{margin-left:auto;color:#9aa3af;font-size:12px}
.svc-name{display:flex;align-items:center;gap:9px}
.svc-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.svc-dot.ok{background:#19815c}
.svc-dot.watch{background:#d99a1f}
.uptime-strip{display:flex;gap:2px;margin-top:14px}
.uptime-strip i{flex:1;height:22px;border-radius:2px;background:#e3f3ea}
.uptime-strip i.watch{background:#f6dfae}
.uptime-caption{display:flex;justify-content:space-between;font-size:11px;color:#9aa3af;margin-top:6px}
.note{padding:14px 0;border-bottom:1px solid #edf0f3}
.note:last-child{border-bottom:none}
.note .t{font-size:13.5px;font-weight:700}
.note .d{font-size:12.5px;color:#7b8490;margin:3px 0}
.note .time{font-size:11.5px;color:#9aa3af}
@media(max-width:950px){.app{grid-template-columns:1fr}.side{display:none}.top,.content{padding-left:22px;padding-right:22px}.metrics{grid-template-columns:repeat(2,1fr)}.grid,.lower{grid-template-columns:1fr}}
@media(max-width:550px){.metrics{grid-template-columns:1fr}.greeting{font-size:23px}.top-actions{display:none}}
footer.admin-foot{border-top:1px solid #e6e9ee;background:#fff;padding:20px 42px;margin-top:8px;display:flex;justify-content:space-between;align-items:center;font-size:12.5px;color:#8a929e}
footer.admin-foot .fbrand{font-weight:800;color:#202733}
footer.admin-foot .fbrand b{color:#315db6}
footer.admin-foot .flinks{display:flex;gap:20px}
footer.admin-foot .flinks a{color:#8a929e}
footer.admin-foot .flinks a:hover{color:#315db6}
@media(max-width:550px){footer.admin-foot{flex-direction:column;gap:10px;align-items:flex-start;padding:20px 22px}}
`;

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
    <>
      <style>{STYLES}</style>

      <div className="app">
        <aside className="side">
          <div className="brand">
            Bridge<b>Tech</b>
          </div>
          <a className="nav" href="admin.html">
            ▦ &nbsp; Dashboard
          </a>
          <div className="label">LEARNING CONTENT</div>
          <a className="nav" href="#">
            ▣ &nbsp; Modules
          </a>
          <a className="nav" href="#">
            ☰ &nbsp; Lessons
          </a>
          <a className="nav" href="#">
            ✓ &nbsp; Assessments
          </a>
          <a className="nav" href="#">
            ↗ &nbsp; Practical exercises
          </a>
          <div className="label">PEOPLE</div>
          <a className="nav" href="#">
            ◉ &nbsp; Students
          </a>
          <a className="nav" href="#">
            ◌ &nbsp; Administrators
          </a>
          <div className="label">SYSTEM</div>
          <a className="nav active" href="system-status.html">
            ◆ &nbsp; System status
          </a>
          <a className="nav" href="#">
            ⚙ &nbsp; Settings
          </a>
          <a className="nav" href="index.html">
            ⌂ &nbsp; Public website
          </a>
        </aside>

        <main className="main">
          <header className="top">
            <div>
              <div className="greeting">
                System <b>status</b>
              </div>
              <p>Latency and uptime, checked every 5 minutes.</p>
            </div>
            <div className="top-actions">
              <button className="select">Last 24 hours ▾</button>
              <a className="btn blue" href="admin.html">
                Back to dashboard
              </a>
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
              <a href="index.html">Public website</a>
            </div>
            <div>© 2026 BridgeTech</div>
          </footer>
        </main>
      </div>
    </>
  );
}
