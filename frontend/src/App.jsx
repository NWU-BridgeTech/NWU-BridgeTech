import { BrowserRouter, Routes, Route } from "react-router-dom";

import PublicHomepage from "./pages/PublicHomepage";
import Home from "./pages/Home";
import Admin from "./pages/Admin";
import AdminModules from "./pages/AdminModules";
import AdminLessons from "./pages/AdminLessons";
import AdminAssessments from "./pages/AdminAssessments";
import AdminPracticalExercises from "./pages/AdminPracticalExercises";
import SystemStatus from "./pages/SystemStatus";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";
import AppLayout from "./layouts/AppLayout";
import "./pages/Admin.css";

function AdminSection({ title }) {
  return (
    <AppLayout>
      <header className="top">
        <div>
          <h1>{title}</h1>

          <p>BridgeTech Admin</p>
        </div>
      </header>

      <div className="content">
        <section className="card">
          <p className="sub">
            This section will be built here.
          </p>
        </section>
      </div>
    </AppLayout>
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
        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route path="/signup" element={<SignUp />} />

        <Route
          path="/admin/modules"
          element={<AdminModules />}
        />

        <Route
          path="/admin/lessons"
          element={<AdminLessons />}
        />

        <Route
          path="/admin/assessments"
          element={<AdminAssessments />}
        />

        <Route
          path="/admin/practical-exercises"
          element={<AdminPracticalExercises />}
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
