import { BrowserRouter, Routes, Route } from "react-router-dom";

import PublicHomepage from "./pages/PublicHomepage";
import Home from "./pages/Home";
import Admin from "./pages/Admin";
import SystemStatus from "./pages/SystemStatus";
import Login from "./pages/Login";

function AdminSection({ title }) {
  return (
    <div className="admin-page">
      <div className="app">
        <aside className="side">
          <div className="brand">
            Bridge<b>Tech</b>
          </div>

          <a className="nav" href="/admin">
            ▦ &nbsp; Dashboard
          </a>

          <div className="label">LEARNING CONTENT</div>

          <a className="nav" href="/admin/modules">
            ▣ &nbsp; Modules
          </a>

          <a className="nav" href="/admin/lessons">
            ☰ &nbsp; Lessons
          </a>

          <a className="nav" href="/admin/assessments">
            ✓ &nbsp; Assessments
          </a>

          <a className="nav" href="/admin/practical-exercises">
            ↗ &nbsp; Practical exercises
          </a>

          <div className="label">PEOPLE</div>

          <a className="nav" href="/admin/students">
            ◉ &nbsp; Students
          </a>

          <a className="nav" href="/admin/administrators">
            ◌ &nbsp; Administrators
          </a>

          <div className="label">SYSTEM</div>

          <a className="nav" href="/admin/settings">
            ⚙ &nbsp; Settings
          </a>

          <a className="nav" href="/">
            ⌂ &nbsp; Public website
          </a>
        </aside>

        <main className="main">
          <header className="top">
            <div>
              <div className="greeting">
                <b>{title}</b>
              </div>

              <p>BridgeTech Admin</p>
            </div>
          </header>

          <div className="content">
            <section className="card">
              <h3>{title}</h3>
              <p className="sub">This section will be built here.</p>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicHomepage />} />
        <Route path="/home" element={<Home />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/system-status" element={<SystemStatus />} />
        <Route path="/login" element={<Login />} />

        <Route
          path="/admin/modules"
          element={<AdminSection title="Modules" />}
        />

        <Route
          path="/admin/lessons"
          element={<AdminSection title="Lessons" />}
        />

        <Route
          path="/admin/assessments"
          element={<AdminSection title="Assessments" />}
        />

        <Route
          path="/admin/practical-exercises"
          element={<AdminSection title="Practical Exercises" />}
        />

        <Route
          path="/admin/students"
          element={<AdminSection title="Students" />}
        />

        <Route
          path="/admin/administrators"
          element={<AdminSection title="Administrators" />}
        />

        <Route
          path="/admin/settings"
          element={<AdminSection title="Settings" />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
