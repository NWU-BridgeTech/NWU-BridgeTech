import { BrowserRouter, Routes, Route } from "react-router-dom";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import PublicHomepage from "./pages/PublicHomepage";
import Home from "./pages/Home";
import StudentCourses from "./pages/StudentCourses";
import StudentAssessments from "./pages/StudentAssessments";
import StudentPracticalWork from "./pages/StudentPracticalWork";
import StudentCertificates from "./pages/StudentCertificates";
import StudentGithub from "./pages/StudentGithub";
import Admin from "./pages/Admin";
import AdminModules from "./pages/AdminModules";
import AdminLessons from "./pages/AdminLessons";
import AdminAssessments from "./pages/AdminAssessments";
import AdminPracticalExercises from "./pages/AdminPracticalExercises";
import AdminStudents from "./pages/AdminStudents";
import AdminAdministrators from "./pages/AdminAdministrators";
import AdminSettings from "./pages/AdminSettings";
import SystemStatus from "./pages/SystemStatus";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";
import AppLayout from "./layouts/AppLayout";
import "./pages/Admin.css";

function AdminSection({ children }) {
  return <AppLayout>{children}</AppLayout>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicHomepage />} />
        <Route path="/home" element={<Home />} />

        <Route
          path="/student/courses"
          element={<StudentCourses />}
        />
        <Route
          path="/student/assessments"
          element={<StudentAssessments />}
        />
        <Route
          path="/student/practical-work"
          element={<StudentPracticalWork />}
        />
        <Route
          path="/student/certificates"
          element={<StudentCertificates />}
        />
        <Route
          path="/student/github"
          element={<StudentGithub />}
        />

        <Route path="/admin" element={<Admin />} />

        <Route
          path="/admin/modules"
          element={
            <AdminSection>
              <AdminModules />
            </AdminSection>
          }
        />

        <Route
          path="/admin/lessons"
          element={
            <AdminSection>
              <AdminLessons />
            </AdminSection>
          }
        />

        <Route
          path="/admin/assessments"
          element={
            <AdminSection>
              <AdminAssessments />
            </AdminSection>
          }
        />

        <Route
          path="/admin/practical-exercises"
          element={
            <AdminSection>
              <AdminPracticalExercises />
            </AdminSection>
          }
        />

        <Route
          path="/admin/students"
          element={
            <AdminSection>
              <AdminStudents />
            </AdminSection>
          }
        />

        <Route
          path="/admin/administrators"
          element={
            <AdminSection>
              <AdminAdministrators />
            </AdminSection>
          }
        />

        <Route
          path="/admin/settings"
          element={
            <AdminSection>
              <AdminSettings />
            </AdminSection>
          }
        />

        <Route
          path="/system-status"
          element={<SystemStatus />}
        />

        <Route path="/login" element={<Login />} />

        <Route path="/signup" element={<SignUp />} />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        <Route
          path="/privacy-policy"
          element={<PrivacyPolicy />}
        />

        <Route
          path="/terms"
          element={<TermsOfService />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;