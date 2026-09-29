import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import StudentLayout from "../layouts/StudentLayout";
import { apiFetch } from "../utils/apiClient";

export default function Home() {
  const [myCourses, setMyCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // The profile supplies the greeting name and certificate count; the page
  // still works without it.
  const [profile, setProfile] = useState(null);
  const [profileLoaded, setProfileLoaded] = useState(false);

  useEffect(() => {
    apiFetch("/user/enrollments")
      .then((data) => setMyCourses(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));

    apiFetch("/users/me")
      .then((data) => setProfile(data))
      .catch(() => setProfile(null))
      .finally(() => setProfileLoaded(true));
  }, []);

  // Resume the earliest-enrolled course that still has lessons left.
  const resumeCourse = myCourses.find(
    (course) => course.lessonsDone < course.lessonsTotal,
  );
  const hour = new Date().getHours();
  let greeting = "Good evening";
  if (hour < 12) {
    greeting = "Good morning";
  } else if (hour < 18) {
    greeting = "Good afternoon";
  }
  const lessonsDone = myCourses.reduce(
    (total, course) => total + course.lessonsDone,
    0,
  );
  const lessonsTotal = myCourses.reduce(
    (total, course) => total + course.lessonsTotal,
    0,
  );
  const activeCourses = myCourses.filter(
    (course) => course.lessonsDone < course.lessonsTotal,
  );
  const overallProgress =
    lessonsTotal > 0 ? Math.round((lessonsDone / lessonsTotal) * 100) : 0;
  const hasCourses = myCourses.length > 0;
  const allCoursesComplete = lessonsTotal > 0 && activeCourses.length === 0;
  const firstName = profile?.firstName;

  return (
    <StudentLayout title="Home">
      <div className="content">
        <section
          className="overview-progress"
          aria-labelledby="overall-progress-heading"
        >
          <div className="overview-progress-heading">
            <div>
              <h2 id="overall-progress-heading">Your progress</h2>
              <p>
                {greeting}
                {firstName ? `, ${firstName}` : ""}. Here’s how your learning is
                going.
              </p>
            </div>
            {!loading && !error && lessonsTotal > 0 && (
              <strong>
                {overallProgress}
                <span>%</span>
              </strong>
            )}
          </div>
          {loading && <p>Loading your progress…</p>}
          {error && (
            <p className="error-message visible">
              We couldn’t load your progress. Please try again later.
            </p>
          )}
          {!loading && !error && !hasCourses && (
            <div className="overview-progress-footer">
              <span>
                You haven’t enrolled in a course yet. Pick one to start tracking
                your progress.
              </span>
              <a href="/student/courses#explore-courses">Explore courses →</a>
            </div>
          )}
          {!loading && !error && hasCourses && lessonsTotal === 0 && (
            <div className="overview-progress-footer">
              <span>
                Your courses don’t have any lessons yet. Check back soon.
              </span>
              <Link to="/student/courses">View my courses →</Link>
            </div>
          )}
          {!loading && !error && lessonsTotal > 0 && (
            <>
              <progress
                aria-label="Overall lesson completion"
                value={lessonsDone}
                max={lessonsTotal}
              />
              <div className="overview-progress-footer">
                <span>
                  {lessonsDone} of {lessonsTotal}{" "}
                  {lessonsTotal === 1 ? "lesson" : "lessons"} completed
                </span>
                <Link to="/student/courses">View my courses →</Link>
              </div>
            </>
          )}
        </section>

        <section className="task-section" aria-labelledby="tasks-heading">
          <div className="task-heading">
            <h2 id="tasks-heading">Needs your attention</h2>
            <span>Work through these at your own pace</span>
          </div>
          {/* Open quizzes will be listed here */}
          <div className="task-empty">
            <h3>You’re all caught up</h3>
            <p>
              Nothing needs your attention right now. Keep learning at your own
              pace.
            </p>
          </div>
        </section>

        <div className="home-resume">
          <section className="resume-card" aria-labelledby="continue-heading">
            <div className="action-heading">
              <h3 id="continue-heading">Continue learning</h3>
              <span className="tag">UP NEXT</span>
            </div>
            {loading ? (
              <p>Loading…</p>
            ) : error ? (
              <p>Your courses couldn’t be loaded right now.</p>
            ) : resumeCourse ? (
              <>
                <p className="resume-course">{resumeCourse.moduleTitle}</p>
                <h4>{resumeCourse.nextLessonTitle}</h4>
                <p className="lesson-meta">
                  Lesson {resumeCourse.lessonsDone + 1} of{" "}
                  {resumeCourse.lessonsTotal}
                </p>
                <div className="resume-progress">
                  <div className="progress-label">
                    <span>
                      {resumeCourse.lessonsDone} of {resumeCourse.lessonsTotal}{" "}
                      lessons completed
                    </span>
                    <b>{resumeCourse.progressPercent}%</b>
                  </div>
                  <progress
                    aria-label={`${resumeCourse.moduleTitle} lesson completion`}
                    value={resumeCourse.lessonsDone}
                    max={resumeCourse.lessonsTotal}
                  />
                </div>
                <Link
                  className="btn blue resume-button"
                  to={`/modules/${resumeCourse.moduleId}/lessons`}
                >
                  Resume lesson <span aria-hidden="true">→</span>
                </Link>
              </>
            ) : allCoursesComplete ? (
              <div className="activity-empty">
                <h4>You’ve finished all your courses</h4>
                <p>
                  Great work! Explore the catalogue to find your next course.
                </p>
                <a className="btn blue" href="/student/courses#explore-courses">
                  Explore courses
                </a>
              </div>
            ) : (
              <div className="activity-empty">
                <h4>Your next step starts here</h4>
                <p>
                  Explore the course catalogue to find something you’d like to
                  learn.
                </p>
                <a className="btn blue" href="/student/courses#explore-courses">
                  Explore courses
                </a>
              </div>
            )}
          </section>
        </div>

        <dl
          className="stats home-summary"
          aria-label="Learning progress summary"
        >
          <div className="stat">
            <dt>Active courses</dt>
            <dd>{loading || error ? "–" : activeCourses.length}</dd>
            <span>Currently in progress</span>
          </div>
          <div className="stat">
            <dt id="certificates-summary">Certificates earned</dt>
            <dd>
              {profileLoaded && profile ? profile.certificatesEarned : "–"}
            </dd>
            <span>Recognising your completed work</span>
          </div>
        </dl>
      </div>

      <footer className="home-footer">
        <span>© {new Date().getFullYear()} BridgeTech</span>
        <nav aria-label="Help and legal information">
          <button type="button">Help</button>
          <button type="button">Terms &amp; Privacy</button>
        </nav>
      </footer>
    </StudentLayout>
  );
}
