import { BrowserRouter, Routes, Route } from "react-router-dom";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import RootRoute from "./components/RootRoute";
import Home from "./pages/Home";
import StudentCourses from "./pages/StudentCourses";
import StudentAssessments from "./pages/StudentAssessments";
import StudentPracticalWork from "./pages/StudentPracticalWork";
import StudentCertificates from "./pages/StudentCertificates";
import StudentGithub from "./pages/StudentGithub";
import StudentProfile from "./pages/StudentProfile";
import VerifyCertificate from "./pages/VerifyCertificate";
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
import Lessons from "./pages/Lessons";
import SignUp from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";
import SignOut from "./pages/SignOut";
import ProtectedRoute from "./components/ProtectedRoute";
import "./pages/Admin.css";
import Quizzes from "./pages/Quizzes";
import QuizzRunner from "./pages/QuizzRunner";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRoute />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route
          path="/verify/:certificateNumber"
          element={<VerifyCertificate />}
        />
        <Route path="/signout" element={<SignOut />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/home" element={<Home />} />
          <Route path="/student/courses" element={<StudentCourses />} />
          <Route path="/student/assessments" element={<Quizzes />} />
          <Route path="/quizzes" element={<Quizzes />} />
          <Route path="/quizzes" element={<Quizzes />} />
          <Route path="/quizzes/:quizId" element={<QuizzRunner />} />
          <Route path="/lessons/:lessonId/quiz" element={<QuizzRunner />} />
          <Route path="/student/assessments" element={<StudentAssessments />} />
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
          <Route path="/lessons" element={<Lessons />} />
          <Route path="/lessons/:lessonId" element={<Lessons />} />
          <Route path="/modules/:moduleId/lessons" element={<Lessons />} />
          <Route
            path="/modules/:moduleId/lessons/:lessonId"
            element={<Lessons />}
          />
          <Route path="/system-status" element={<SystemStatus />} />
        </Route>

        <Route element={<ProtectedRoute requiredRole="Admin" />}>
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/modules" element={<AdminModules />} />
          <Route path="/admin/lessons" element={<AdminLessons />} />
          <Route path="/admin/assessments" element={<AdminAssessments />} />
          <Route
            path="/admin/practical-exercises"
            element={<AdminPracticalExercises />}
          />
          <Route path="/admin/students" element={<AdminStudents />} />
          <Route
            path="/admin/administrators"
            element={<AdminAdministrators />}
          />
          <Route path="/admin/settings" element={<AdminSettings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}


export default App;
