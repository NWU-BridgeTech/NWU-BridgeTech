import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import AppLayout from "../layouts/AppLayout";
import InstructorCourseCard from "../components/InstructorCourseCard";
import { apiFetch } from "../utils/apiClient";
import "./TeamArea.css";

export default function InstructorCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    apiFetch("/instructor/dashboard")
      .then((dashboard) => {
        if (!cancelled) setCourses(dashboard.courses ?? []);
      })
      .catch((loadError) => {
        if (!cancelled) setError(`Could not load your modules: ${loadError.message}`);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AppLayout>
      <header className="top dashboard-header">
        <div>
          <h1>My courses</h1>
          <p>All courses created by you and their learner progress.</p>
        </div>
        <div className="dashboard-header-actions">
          <Link className="btn" to="/instructor">
            <ArrowLeft size={16} aria-hidden="true" />
            Back to overview
          </Link>
        </div>
      </header>
      <section className="content instructor-courses instructor-courses-page">
        <div className="instructor-courses-heading">
          <div>
            <h2>My modules</h2>
            <p>Modules created by you and their learner progress.</p>
          </div>
          {!loading && !error && courses.length > 0 && (
            <span className="instructor-owned-module-count">
              {courses.length} {courses.length === 1 ? "module" : "modules"}
            </span>
          )}
        </div>
        {loading && <p role="status">Loading your modules…</p>}
        {error && <p className="instructor-courses-error" role="alert">{error}</p>}
        {!loading && !error && courses.length === 0 && (
          <div className="instructor-courses-empty">
            <h3>Your teaching journey starts here</h3>
            <p>You haven’t created any modules yet. Create your first module to start building lessons for your learners.</p>
            <Link className="instructor-first-module-link" to="/instructor/lessons?createModule=1">
              Create your first module <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        )}
        {!loading && !error && courses.length > 0 && (
          <div className="instructor-course-grid">
            {courses.map((course) => (
              <InstructorCourseCard key={course.moduleId} course={course} />
            ))}
          </div>
        )}
      </section>
    </AppLayout>
  );
}
