import { Link } from "react-router-dom";
import StudentLayout from "../layouts/StudentLayout";
import {
  student,
  myCourses,
  lastActivity,
  attentionItems,
  practicalWork,
} from "../data/studentDashboard";

export default function Home() {
  const resumeCourse = myCourses.find(
    (course) => course.number === lastActivity.courseNumber,
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
  const overallProgress = lessonsTotal > 0
    ? Math.round((lessonsDone / lessonsTotal) * 100)
    : 0;
  const now = new Date();

  // Practical work is the source of truth when a task appears in both lists.
  const otherTasks = attentionItems.filter(
    (item) => !practicalWork.some((work) => work.id === item.id),
  );
  const upcomingTasks = [...practicalWork, ...otherTasks].filter(
    (item) => item.status !== "Passed" && item.status !== "Awaiting review",
  );

  function taskPriority(item) {
    if (item.dueAt && new Date(item.dueAt) < now) return 0;
    if (item.status === "Changes requested") return 1;
    if (item.dueAt) return 2;
    return 3;
  }

  upcomingTasks.sort((first, second) => {
    const priorityDifference = taskPriority(first) - taskPriority(second);
    if (priorityDifference !== 0) return priorityDifference;
    if (first.dueAt && second.dueAt) {
      return new Date(first.dueAt) - new Date(second.dueAt);
    }
    if (first.dueAt) return -1;
    if (second.dueAt) return 1;
    return 0;
  });

  function formatDeadline(dueAt) {
    return new Date(dueAt).toLocaleString("en-ZA", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Africa/Johannesburg",
    });
  }

  return (
    <StudentLayout title="Home">
      <div className="content">
        <section className="overview-progress" aria-labelledby="overall-progress-heading">
          <div className="overview-progress-heading">
            <div>
              <h2 id="overall-progress-heading">Your progress</h2>
              <p>{greeting}, {student.firstName}. Here’s how your learning is going.</p>
            </div>
            <strong>{overallProgress}<span>%</span></strong>
          </div>
          <progress
            aria-label="Overall lesson completion"
            value={lessonsDone}
            max={lessonsTotal || 1}
          />
          <div className="overview-progress-footer">
            <span>{lessonsDone} of {lessonsTotal} lessons completed</span>
            <Link to="/student/courses">View my courses →</Link>
          </div>
        </section>

        <section className="deadline-section" aria-labelledby="deadlines-heading">
          <div className="deadline-heading">
            <h2 id="deadlines-heading">Upcoming &amp; needs attention</h2>
            <span>All times SAST</span>
          </div>
          {upcomingTasks.length > 0 ? (
            <ul className="deadline-list">
              {upcomingTasks.map((item) => {
                const overdue = item.dueAt && new Date(item.dueAt) < now;
                const page = item.type === "assessment"
                  ? "/student/assessments"
                  : "/student/practical-work";

                return (
                  <li key={item.id}>
                    <div className="deadline-task">
                      <h3>{item.title}</h3>
                      <p>{item.course} · {item.type === "assessment" ? "Assessment" : "Practical work"}</p>
                      <span className={`activity-status ${item.tone}`}>{item.status}</span>
                    </div>
                    <div className="deadline-date">
                      {item.dueAt ? (
                        <>
                          <span className={overdue ? "deadline-overdue" : ""}>
                            {overdue ? "Overdue" : "Due"}
                          </span>
                          <time dateTime={item.dueAt}>{formatDeadline(item.dueAt)}</time>
                        </>
                      ) : <span>No deadline</span>}
                    </div>
                    <Link className="deadline-action" to={page} aria-label={`${item.action}: ${item.title}`}>
                      {item.action} <span aria-hidden="true">→</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="deadline-empty">
              <h3>You’re all caught up</h3>
              <p>No upcoming deadlines or tasks need your attention. Keep learning at your own pace.</p>
            </div>
          )}
        </section>

        <div className="activity-heading">
          <p>Lesson and task actions are coming soon.</p>
        </div>
        <div className="home-resume">
          <section className="resume-card" aria-labelledby="continue-heading">
            <div className="action-heading">
              <h3 id="continue-heading">Continue learning</h3>
              <span className="tag">LAST ACTIVE COURSE</span>
            </div>
            {resumeCourse ? (
              <>
                <p className="resume-course">{resumeCourse.title}</p>
                <h4>{lastActivity.lesson}</h4>
                <p className="lesson-meta">
                  Lesson {resumeCourse.lessonsDone + 1} of{" "}
                  {resumeCourse.lessonsTotal}
                  <span aria-hidden="true"> · </span>
                  About {lastActivity.minutes} minutes
                </p>
                <div className="resume-progress">
                  <div className="progress-label">
                    <span>
                      {resumeCourse.lessonsDone} of {resumeCourse.lessonsTotal}{" "}
                      lessons completed
                    </span>
                    <b>
                      {Math.round(
                        (resumeCourse.lessonsDone / resumeCourse.lessonsTotal) *
                          100,
                      )}
                      %
                    </b>
                  </div>
                  <progress
                    aria-label={`${resumeCourse.title} lesson completion`}
                    value={resumeCourse.lessonsDone}
                    max={resumeCourse.lessonsTotal}
                  />
                </div>
                <button className="btn blue resume-button" disabled>
                  Resume lesson <span aria-hidden="true">→</span>
                </button>
              </>
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

        <dl className="stats home-summary" aria-label="Learning progress summary">
          <div className="stat">
            <dt>Active courses</dt>
            <dd>{activeCourses.length}</dd>
            <span>Currently in progress</span>
          </div>
          <div className="stat">
            <dt id="certificates-summary">Certificates earned</dt>
            <dd>{student.certificatesEarned}</dd>
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
