import { Link } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import AppLayout from "../layouts/AppLayout";
import InstructorCourseCard from "../components/InstructorCourseCard";
import InstructorPlanner from "../components/InstructorPlanner";
import { apiFetch } from "../utils/apiClient";
import "./TeamArea.css";

const RING_RADIUS = 52;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export default function TeamArea({ role }) {
  const isInstructor = role === "Instructor";
  const [coursesExpanded, setCoursesExpanded] = useState(true);
  const [overviewDashboard, setOverviewDashboard] = useState(null);
  const [overviewCourses, setOverviewCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(isInstructor);
  const [coursesError, setCoursesError] = useState("");
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  useEffect(() => {
    if (!isInstructor) return undefined;
    let cancelled = false;
    apiFetch("/instructor/dashboard")
      .then((dashboard) => {
        if (!cancelled) {
          setOverviewDashboard(dashboard);
          setOverviewCourses((dashboard.courses ?? []).slice(0, 3));
        }
      })
      .catch((error) => {
        if (!cancelled) setCoursesError(`Could not load your modules: ${error.message}`);
      })
      .finally(() => {
        if (!cancelled) setCoursesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isInstructor]);

  const averageCompletion = overviewDashboard?.averageCompletion ?? 0;
  const overviewMetrics = [
    {
      label: "Students enrolled",
      value: overviewDashboard?.studentsEnrolled ?? "—",
      detail: overviewDashboard?.studentsEnrolled === 0
        ? "No learners yet. Publish a module to welcome your first students."
        : "Active students across your modules",
      icon: Users,
    },
    {
      label: "Modules you created",
      value: overviewDashboard?.modulesCreated ?? "—",
      detail: overviewDashboard?.modulesCreated === 0
        ? "Nothing created yet. Start with your first module."
        : "Modules attributed to your account",
      icon: BookOpen,
    },
    {
      label: "Submissions to review",
      value: overviewDashboard?.submissionsToReview ?? "—",
      detail: overviewDashboard?.submissionsToReview === 0
        ? "Nothing to review yet. Student submissions will appear here."
        : "Practical work awaiting verification",
      icon: ClipboardCheck,
    },
    {
      label: "Average completion",
      value: overviewDashboard ? `${averageCompletion}%` : "—",
      detail: overviewDashboard?.studentsEnrolled === 0
        ? "No learner progress yet. Your snapshot will grow as students join."
        : "Across active student enrollments",
      icon: Activity,
    },
    {
      label: "Students on track",
      value: overviewDashboard?.studentsOnTrack ?? "—",
      detail: overviewDashboard?.studentsEnrolled === 0
        ? "Your learners’ progress will appear here once they enroll."
        : "Progressing or enrolled within 14 days",
      icon: CheckCircle2,
    },
    {
      label: "Average quiz score",
      value: overviewDashboard?.averageQuizScore == null
        ? "—"
        : `${Math.round(overviewDashboard.averageQuizScore)}%`,
      detail: overviewDashboard?.averageQuizScore == null
        ? "No quiz attempts yet. Add a quiz to get started."
        : "Completed quizzes in your modules",
      icon: Award,
    },
  ];

  return (
    <AppLayout>
      {isInstructor && (
        <div className="home-page instructor-home">
          <main className="content instructor-dashboard-content">
            <section className="home-hero instructor-hero" aria-labelledby="instructor-hero-heading">
              <div className="home-hero-main">
                <p className="home-hero-greeting">{greeting}</p>
                <p className="home-hero-eyebrow">Instructor workspace</p>
                <h1 id="instructor-hero-heading">Your teaching overview</h1>
                <p className="home-hero-text">
                  Track your courses, support your students, and keep learning
                  moving forward.
                </p>
                <Link className="home-hero-button" to="/instructor/courses">
                  View my courses <ArrowRight size={18} aria-hidden="true" />
                </Link>
              </div>
              <div
                className="home-ring"
                aria-label={overviewDashboard
                  ? `${averageCompletion}% average student completion`
                  : "Average student completion is loading"}
              >
                <svg viewBox="0 0 120 120" aria-hidden="true">
                  <circle className="home-ring-track" cx="60" cy="60" r={RING_RADIUS} />
                  <circle
                    className="home-ring-value"
                    cx="60"
                    cy="60"
                    r={RING_RADIUS}
                    strokeDasharray={RING_CIRCUMFERENCE}
                    strokeDashoffset={RING_CIRCUMFERENCE * (1 - averageCompletion / 100)}
                  />
                </svg>
                <div className="home-ring-label">
                  <strong>
                    {overviewDashboard ? averageCompletion : "—"}
                    <span>%</span>
                  </strong>
                  <span>average completion</span>
                </div>
              </div>
            </section>
            <div className="instructor-overview-row">
              <section
                className="instructor-glance"
                aria-labelledby="instructor-glance-heading"
              >
                <div className="instructor-glance-header">
                  <div>
                    <h2 id="instructor-glance-heading">Teaching at a glance</h2>
                    <p>A snapshot of your modules and learners.</p>
                  </div>
                </div>
                {coursesLoading && <p role="status">Loading your teaching snapshot…</p>}
                {coursesError && <p className="instructor-courses-error" role="alert">{coursesError}</p>}
                {!coursesLoading && !coursesError && overviewDashboard?.modulesCreated === 0 && (
                  <div className="instructor-courses-empty">
                    <h3>Your teaching journey starts here</h3>
                    <p>Create your first module and begin building learning experiences for your students.</p>
                    <Link className="instructor-first-module-link" to="/instructor/lessons?createModule=1">
                      Create your first module <ArrowRight size={16} aria-hidden="true" />
                    </Link>
                  </div>
                )}
                <div className="instructor-metric-grid">
                  {overviewMetrics.map(({ label, value, detail, icon: Icon }) => (
                    <article className="instructor-metric-card" key={label}>
                      <div className="instructor-metric-icon">
                        <Icon size={19} aria-hidden="true" />
                      </div>
                      <strong>{value}</strong>
                      <span>{label}</span>
                      <small>{detail}</small>
                    </article>
                  ))}
                </div>
              </section>
              <InstructorPlanner />
            </div>
            <section
              className="instructor-courses"
              aria-labelledby="instructor-courses-heading"
            >
              <div className="instructor-courses-heading">
                <div className="instructor-courses-title">
                  <button
                    className="instructor-courses-toggle"
                    type="button"
                    aria-label={coursesExpanded ? "Collapse my courses" : "Expand my courses"}
                    aria-expanded={coursesExpanded}
                    aria-controls="instructor-course-list"
                    onClick={() => setCoursesExpanded((expanded) => !expanded)}
                  >
                    <ChevronDown
                      size={19}
                      aria-hidden="true"
                      className={coursesExpanded ? "" : "is-collapsed"}
                    />
                  </button>
                  <div>
                    <h2 id="instructor-courses-heading">My courses</h2>
                    <p>Your modules and their learner progress.</p>
                  </div>
                </div>
                <div className="instructor-courses-controls">
                  <Link className="instructor-view-all" to="/instructor/courses">
                    View all
                    <ArrowRight size={15} aria-hidden="true" />
                  </Link>
                </div>
              </div>
              <div
                className="instructor-course-grid"
                id="instructor-course-list"
                hidden={!coursesExpanded}
              >
                {coursesLoading && <p role="status">Loading your modules…</p>}
                {!coursesLoading && !coursesError && overviewCourses.length === 0 && (
                  <div className="instructor-courses-empty">
                    <h3>Your teaching journey starts here</h3>
                    <p>Create your first module and it will appear here with learner progress.</p>
                    <Link className="instructor-first-module-link" to="/instructor/lessons?createModule=1">
                      Create your first module <ArrowRight size={16} aria-hidden="true" />
                    </Link>
                  </div>
                )}
                {overviewCourses.map((course) => (
                  <InstructorCourseCard
                    key={course.moduleId}
                    course={course}
                    showStudentProgressAction={false}
                  />
                ))}
              </div>
            </section>
          </main>
        </div>
      )}
      {!isInstructor && (
        <header className="top dashboard-header">
          <div>
            <h1>{role} area</h1>
            <p>Welcome to your BridgeTech team workspace.</p>
          </div>
          <div className="dashboard-header-actions">
            <Link className="btn blue" to="/admin">
              Open administration
            </Link>
          </div>
        </header>
      )}
    </AppLayout>
  );
}