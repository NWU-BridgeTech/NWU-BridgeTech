import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import "./pages/Admin.css";
import { ThemeProvider } from "./contexts/ThemeContext";

const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const PublicHomepage = lazy(() => import("./pages/PublicHomepage"));
const VerifyCertificate = lazy(() => import("./pages/VerifyCertificate"));
const Home = lazy(() => import("./pages/Home"));
const StudentCourses = lazy(() => import("./pages/StudentCourses"));
const StudentPracticalWork = lazy(() => import("./pages/StudentPracticalWork"));
const StudentCertificates = lazy(() => import("./pages/StudentCertificates"));
const StudentGithub = lazy(() => import("./pages/StudentGithub"));
const StudentAiSummary = lazy(() => import("./pages/StudentAiSummary"));
const StudentProfile = lazy(() => import("./pages/StudentProfile"));
const StudentNotifications = lazy(() => import("./pages/StudentNotifications"));
const StudentBadges = lazy(() => import("./pages/StudentBadges"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminModules = lazy(() => import("./pages/AdminModules"));
const AdminLessons = lazy(() => import("./pages/AdminLessons"));
const AdminAssessments = lazy(() => import("./pages/AdminAssessments"));
const AdminPracticalExercises = lazy(() => import("./pages/AdminPracticalExercises"));
const AdminStudents = lazy(() => import("./pages/AdminStudents"));
const AdminAdministrators = lazy(() => import("./pages/AdminAdministrators"));
const AdminSettings = lazy(() => import("./pages/AdminSettings"));
const AdminReports = lazy(() => import("./pages/AdminReports"));
const Login = lazy(() => import("./pages/Login"));
const SignUp = lazy(() => import("./pages/SignUp"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const AcceptInvitation = lazy(() => import("./pages/AcceptInvitation"));
const SignOut = lazy(() => import("./pages/SignOut"));
const Quizzes = lazy(() => import("./pages/Quizzes"));
const QuizzRunner = lazy(() => import("./pages/QuizzRunner"));
const TeamArea = lazy(() => import("./pages/TeamArea"));
const InstructorSettings = lazy(() => import("./pages/InstructorSettings"));
const InstructorCourses = lazy(() => import("./pages/InstructorCourses"));
const InstructorCalendar = lazy(() => import("./pages/InstructorCalendar"));
const InstructorLessonsQuizzes = lazy(() => import("./pages/InstructorLessonsQuizzes"));
const Lessons = lazy(() => import("./pages/Lessons"));

function AdminSection({ children }) {
  return children;
}

function PageLoading() {
  return (
    <main className="content" aria-live="polite" aria-busy="true">
      <p>Loading page...</p>
    </main>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <Suspense fallback={<PageLoading />}>
          <Routes>
        <Route path="/" element={<PublicHomepage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/team-login" element={<Login team />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/accept-invitation" element={<AcceptInvitation />} />
        <Route path="/signout" element={<SignOut />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route
          path="/verify/:certificateNumber"
          element={<VerifyCertificate />}
        />

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
          <Route path="/student/badges" element={<StudentBadges />} />
          <Route path="/student/github" element={<StudentGithub />} />
          <Route path="/student/ai-summary" element={<StudentAiSummary />} />
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
          <Route path="/lessons/:lessonId" element={<Lessons />} />
          <Route path="/modules/:moduleId/lessons" element={<Lessons />} />
          <Route
            path="/modules/:moduleId/lessons/:lessonId"
            element={<Lessons />}
          />
        </Route>

        <Route element={<ProtectedRoute requiredRole="Instructor" />}>
          <Route path="/instructor" element={<TeamArea role="Instructor" />} />
          <Route path="/instructor/modules" element={<AdminModules readOnly />} />
          <Route path="/instructor/lessons" element={<InstructorLessonsQuizzes />} />
          <Route path="/instructor/courses" element={<InstructorCourses />} />
          <Route path="/instructor/calendar" element={<InstructorCalendar />} />
          <Route
            path="/instructor/settings"
            element={<InstructorSettings />}
          />
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
          <Route
            path="/admin/reports"
            element={
              <AdminSection>
                <AdminReports />
              </AdminSection>
            }
          />

        </Route>
          </Routes>
        </Suspense>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
