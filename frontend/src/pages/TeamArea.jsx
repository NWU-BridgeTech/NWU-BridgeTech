import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  ChevronRight,
  ClipboardCheck,
  Library,
} from "lucide-react";
import AppLayout from "../layouts/AppLayout";
import { apiFetch } from "../utils/apiClient";
import "./TeamArea.css";

const quickAccessLinks = [
  {
    label: "Available courses",
    icon: BookOpen,
    description: "Browse every course on the platform.",
    to: "/instructor/modules",
  },
  {
    label: "Lessons and quizzes",
    icon: Library,
    description: "View lessons and the quizzes attached to them.",
    to: "/instructor/lessons",
  },
  {
    label: "Assessments",
    icon: ClipboardCheck,
    description: "Review and manage assessments.",
    to: "/instructor/assessments",
  },
];

function InstructorOverview() {
  const [counts, setCounts] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      apiFetch("/api/modules/admin"),
      apiFetch("/api/lessons/admin"),
      apiFetch("/api/admin/quizzes"),
    ])
      .then(([modules, lessons, quizzes]) => {
        if (cancelled) return;
        setCounts({
          courses: modules.length,
          lessons: lessons.length,
          quizzes: quizzes.length,
        });
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError.message);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const stats = [
    { label: "Courses", value: counts?.courses, icon: BookOpen },
    { label: "Lessons", value: counts?.lessons, icon: Library },
    { label: "Quizzes", value: counts?.quizzes, icon: ClipboardCheck },
  ];

  return (
    <>
      <section className="team-stats" aria-label="Platform totals">
        {stats.map((stat) => (
          <article className="team-stat" key={stat.label}>
            <span className="team-stat-label">
              <stat.icon size={16} aria-hidden="true" />
              {stat.label}
            </span>
            <strong>{stat.value ?? "—"}</strong>
            <small>On the platform</small>
          </article>
        ))}
      </section>
      {error && (
        <p className="team-message" role="alert">
          Could not load platform totals: {error}
        </p>
      )}

      <section className="team-quick-access" aria-labelledby="quick-access-heading">
        <h2 id="quick-access-heading">Quick access</h2>
        <div className="team-quick-links">
          {quickAccessLinks.map((link) => (
            <Link className="team-quick-link" to={link.to} key={link.to}>
              <link.icon size={20} aria-hidden="true" />
              <span>
                <strong>{link.label}</strong>
                <small>{link.description}</small>
              </span>
              <ChevronRight
                className="team-quick-link-arrow"
                size={20}
                aria-hidden="true"
              />
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}

export default function TeamArea({ role }) {
  const isInstructor = role === "Instructor";

  return (
    <AppLayout>
      <header className="top dashboard-header">
        <div>
          <h1>{role} area</h1>
          <p>Welcome to your BridgeTech team workspace.</p>
        </div>
        <div className="dashboard-header-actions">
          <Link
            className="btn blue"
            to={isInstructor ? "/instructor/modules" : "/admin"}
          >
            {isInstructor ? "View learning materials" : "Open administration"}
          </Link>
        </div>
      </header>
      {isInstructor && (
        <div className="content team-area-content">
          <InstructorOverview />
        </div>
      )}
    </AppLayout>
  );
}
