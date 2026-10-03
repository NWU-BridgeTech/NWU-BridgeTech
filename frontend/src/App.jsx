import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./layouts/AppLayout";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import PublicHomepage from "./pages/PublicHomepage";
import Home from "./pages/Home";
import StudentCourses from "./pages/StudentCourses";
import StudentPracticalWork from "./pages/StudentPracticalWork";
import StudentCertificates from "./pages/StudentCertificates";
import StudentGithub from "./pages/StudentGithub";
import StudentProfile from "./pages/StudentProfile";
import StudentNotifications from "./pages/StudentNotifications";
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
import TeamArea from "./pages/TeamArea";
import SignUp from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";
import AcceptInvitation from "./pages/AcceptInvitation";
import "./pages/Admin.css";
import Quizzes from "./pages/Quizzes";
import QuizzRunner from "./pages/QuizzRunner";
import Lessons from "./pages/Lessons";

function AdminSection({ children }) {
  return <AppLayout>{children}</AppLayout>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicHomepage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/team-login" element={<Login team />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/accept-invitation" element={<AcceptInvitation />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />

        <Route element={<ProtectedRoute requiredRole="Student" />}>
          <Route path="/home" element={<Home />} />
          <Route path="/student/courses" element={<StudentCourses />} />
          <Route path="/student/assessments" element={<Quizzes />} />
          <Route path="/quizzes" element={<Quizzes />} />
          <Route path="/quizzes/:quizId" element={<QuizzRunner />} />
          <Route path="/lessons/:lessonId/quiz" element={<QuizzRunner />} />
          <Route
            path="/student/practical-work"
            element={<StudentPracticalWork />}
          />
          <Route
            path="/student/certificates"
            element={<StudentCertificates />}
          />
          <Route path="/student/github" element={<StudentGithub />} />
          <Route path="/student/profile" element={<StudentProfile />} />
          <Route
            path="/student/notifications"
            element={<StudentNotifications />}
          />
        </Route>

        <Route
          element={
            <ProtectedRoute
              requiredRole={["Student", "Instructor", "Admin", "SuperAdmin"]}
            />
          }
        >
          <Route path="/lessons" element={<Lessons />} />
          <Route path="/modules/:moduleId/lessons" element={<Lessons />} />
          <Route
            path="/modules/:moduleId/lessons/:lessonId"
            element={<Lessons />}
          />
        </Route>

        <Route element={<ProtectedRoute requiredRole="Instructor" />}>
          <Route path="/instructor" element={<TeamArea role="Instructor" />} />
        </Route>

        <Route element={<ProtectedRoute requiredRole="SuperAdmin" />}>
          <Route
            path="/super-admin"
            element={<TeamArea role="Super Admin" />}
          />
        </Route>

        <Route
          element={<ProtectedRoute requiredRole={["Admin", "SuperAdmin"]} />}
        >
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

          <Route path="/system-status" element={<SystemStatus />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
