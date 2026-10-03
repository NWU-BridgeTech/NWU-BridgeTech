import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Award,
  BookOpen,
  CircleCheck,
  ClipboardCheck,
} from "lucide-react";
import StudentLayout from "../layouts/StudentLayout";
import { apiFetch } from "../utils/apiClient";

const RING_RADIUS = 52;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function percentComplete(done, total) {
  return total > 0 ? Math.round((done / total) * 100) : 0;
}

function lessonLink(course) {
  return course.nextLessonId
    ? `/modules/${course.moduleId}/lessons/${course.nextLessonId}`
    : `/modules/${course.moduleId}/lessons`;
}

const QUIZ_PAGE_PATH = "/student/assessments";

function quizStatus(quiz) {
  if (quiz.bestScore == null) {
    return `Not attempted yet · Pass mark ${quiz.passingScore}%`;
  }
  return `Best score ${quiz.bestScore}% · Pass mark ${quiz.passingScore}%`;
}

function ProgressRing({ percent, lessonsDone, lessonsTotal }) {
  return (
    <div className="home-ring">
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle className="home-ring-track" cx="60" cy="60" r={RING_RADIUS} />
        <circle
          className="home-ring-value"
          cx="60"
          cy="60"
          r={RING_RADIUS}
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={RING_CIRCUMFERENCE * (1 - percent / 100)}
        />
      </svg>
      <div className="home-ring-label">
        <strong>
          {percent}
          <span>%</span>
        </strong>
        <span>overall</span>
      </div>
      <p className="visually-hidden">
        {lessonsDone} of {lessonsTotal} lessons completed across your courses.
      </p>
    </div>
  );
}

export default function Home() {
  const [myCourses, setMyCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // The profile supplies the greeting name and certificate count; the page
  // still works without it.
  const [profile, setProfile] = useState(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [pendingQuizzes, setPendingQuizzes] = useState([]);

  useEffect(() => {
    apiFetch("/user/quizzes/pending")
      .then((data) => setPendingQuizzes(Array.isArray(data) ? data : []))
      .catch(() => setPendingQuizzes([]));

    apiFetch("/user/enrollments")
      .then((data) => setMyCourses(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));

    apiFetch("/users/me")
      .then((data) => setProfile(data))
      .catch(() => setProfile(null))
      .finally(() => setProfileLoaded(true));
  }, []);

  const hour = new Date().getHours();
  let greeting = "Good evening";
  if (hour < 12) {
    greeting = "Good morning";
  } else if (hour < 18) {
    greeting = "Good afternoon";
  }
  const firstName = profile?.firstName;

  const activeCourses = myCourses.filter(
    (course) => course.lessonsDone < course.lessonsTotal,
  );
  // Resume the earliest-enrolled course that still has lessons left.
  const resumeCourse = activeCourses[0];
  const lessonsDone = myCourses.reduce(
    (total, course) => total + course.lessonsDone,
    0,
  );
  const lessonsTotal = myCourses.reduce(
    (total, course) => total + course.lessonsTotal,
    0,
  );
  const overallProgress = percentComplete(lessonsDone, lessonsTotal);
  const hasCourses = myCourses.length > 0;
  const hasLessons = lessonsTotal > 0;
  const allCoursesComplete = hasLessons && activeCourses.length === 0;
  const ready = !loading && !error;

  let hero;
  if (loading) {
    hero = <p className="home-hero-text">Loading your progress…</p>;
  } else if (error) {
    hero = (
      <p className="home-hero-text">
        We couldn’t load your progress. Please try again later.
      </p>
    );
  } else if (resumeCourse) {
    hero = (
      <>
        <p className="home-hero-eyebrow">
          Continue learning · {resumeCourse.moduleTitle}
        </p>
        <h2 id="home-hero-heading">
          {resumeCourse.nextLessonTitle || "Your next lesson"}
        </h2>
        <p className="home-hero-text">
          Lesson {resumeCourse.lessonsDone + 1} of {resumeCourse.lessonsTotal}
        </p>
        <Link className="home-hero-button" to={lessonLink(resumeCourse)}>
          Resume lesson <ArrowRight aria-hidden="true" size={18} />
        </Link>
      </>
    );
  } else if (allCoursesComplete) {
    hero = (
      <>
        <h2 id="home-hero-heading">You’ve finished all your courses</h2>
        <p className="home-hero-text">
          Great work! Explore the catalogue to find your next course.
        </p>
        <a className="home-hero-button" href="/student/courses#explore-courses">
          Explore courses <ArrowRight aria-hidden="true" size={18} />
        </a>
      </>
    );
  } else if (hasCourses) {
    hero = (
      <>
        <h2 id="home-hero-heading">Your lessons are on the way</h2>
        <p className="home-hero-text">
          Your courses don’t have any lessons yet. Check back soon.
        </p>
        <Link className="home-hero-button" to="/student/courses">
          View my courses <ArrowRight aria-hidden="true" size={18} />
        </Link>
      </>
    );
  } else {
    hero = (
      <>
        <h2 id="home-hero-heading">Your next step starts here</h2>
        <p className="home-hero-text">
          Enrol in a course to start learning and tracking your progress.
        </p>
        <a className="home-hero-button" href="/student/courses#explore-courses">
          Explore courses <ArrowRight aria-hidden="true" size={18} />
        </a>
      </>
    );
  }

  return (
    <StudentLayout title="Home">
      <div className="content">
        <section className="home-hero" aria-labelledby="home-hero-heading">
          <div className="home-hero-main">
            <p className="home-hero-greeting">
              {greeting}
              {firstName ? `, ${firstName}` : ""}
            </p>
            {(loading || error) && (
              <h2 id="home-hero-heading" className="visually-hidden">
                Your progress
              </h2>
            )}
            {hero}
          </div>
          {ready && hasLessons && (
            <ProgressRing
              percent={overallProgress}
              lessonsDone={lessonsDone}
              lessonsTotal={lessonsTotal}
            />
          )}
        </section>

        <dl className="stats" aria-label="Learning progress summary">
          <div className="stat">
            <dt>
              <BookOpen aria-hidden="true" size={16} /> Active courses
            </dt>
            <dd>{ready ? activeCourses.length : "–"}</dd>
            <span>Currently in progress</span>
          </div>
          <div className="stat">
            <dt>
              <CircleCheck aria-hidden="true" size={16} /> Lessons completed
            </dt>
            <dd>
              {ready ? lessonsDone : "–"}
              {ready && hasLessons && <small> / {lessonsTotal}</small>}
            </dd>
            <span>Across all your courses</span>
          </div>
          <div className="stat">
            <dt id="certificates-summary">
              <Award aria-hidden="true" size={16} /> Certificates earned
            </dt>
            <dd>
              {profileLoaded && profile ? profile.certificatesEarned : "–"}
            </dd>
            <span>Recognising your completed work</span>
          </div>
        </dl>

        <section className="home-next" aria-labelledby="next-up-heading">
          <div className="home-section-heading">
            <div>
              <h2 id="next-up-heading">Next up</h2>
              <p>Work through these at your own pace.</p>
            </div>
            <Link to="/student/courses">
              View all courses <ArrowRight aria-hidden="true" size={14} />
            </Link>
          </div>
          {!ready ? (
            <div className="home-next-empty">
              <p>
                {loading
                  ? "Loading…"
                  : "We couldn’t load your next steps right now."}
              </p>
            </div>
          ) : activeCourses.length > 0 || pendingQuizzes.length > 0 ? (
            <ul className="home-next-list">
              {activeCourses.map((course) => {
                const percent = percentComplete(
                  course.lessonsDone,
                  course.lessonsTotal,
                );
                return (
                  <li key={course.moduleId}>
                    <Link to={lessonLink(course)}>
                      <BookOpen
                        className="home-next-icon"
                        aria-hidden="true"
                        size={18}
                      />
                      <span className="home-next-details">
                        <span className="home-next-module">
                          {course.moduleTitle}
                        </span>
                        <strong>
                          {course.nextLessonTitle || "Next lesson"}
                        </strong>
                        <span className="home-next-meta">
                          Lesson {course.lessonsDone + 1} of{" "}
                          {course.lessonsTotal}
                        </span>
                      </span>
                      <span className="home-next-progress">
                        <progress
                          aria-label={`${course.moduleTitle} lesson completion`}
                          value={course.lessonsDone}
                          max={course.lessonsTotal}
                        />
                        <span>{percent}%</span>
                      </span>
                      <ArrowRight
                        className="home-next-arrow"
                        aria-hidden="true"
                        size={18}
                      />
                    </Link>
                  </li>
                );
              })}
              {pendingQuizzes.map((quiz) => (
                <li key={quiz.quizId}>
                  <Link to={QUIZ_PAGE_PATH}>
                    <ClipboardCheck
                      className="home-next-icon"
                      aria-hidden="true"
                      size={18}
                    />
                    <span className="home-next-details">
                      <span className="home-next-module">
                        {quiz.moduleTitle}
                      </span>
                      <strong>Quiz: {quiz.title}</strong>
                      <span className="home-next-meta">
                        {quizStatus(quiz)}
                      </span>
                    </span>
                    <span className="home-next-status">
                      <span>
                        {quiz.bestScore == null ? "Not started" : "Try again"}
                      </span>
                    </span>
                    <ArrowRight
                      className="home-next-arrow"
                      aria-hidden="true"
                      size={18}
                    />
                  </Link>
                </li>
              ))}
            </ul>
          ) : allCoursesComplete ? (
            <div className="home-next-empty">
              <h3>You’re all caught up</h3>
              <p>You’ve completed every lesson and passed every quiz.</p>
            </div>
          ) : (
            <div className="home-next-empty">
              <h3>Nothing here yet</h3>
              <p>Your next lessons and quizzes will show up here.</p>
            </div>
          )}
          </section>
      </div>

      <footer className="home-footer">
        <span>© {new Date().getFullYear()} BridgeTech</span>
        <nav aria-label="Legal information">
          <Link to="/terms">Terms of Service</Link>
          <Link to="/privacy-policy">Privacy Policy</Link>
        </nav>
      </footer>
    </StudentLayout>
  );
}
