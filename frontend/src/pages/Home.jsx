import { Link } from "react-router-dom";
import StudentLayout from "../layouts/StudentLayout";
import {
  student,
  certificates,
  myCourses,
  lastActivity,
  assessments,
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
  const overallProgress =
    lessonsTotal > 0 ? Math.round((lessonsDone / lessonsTotal) * 100) : 0;

  // Learning is self-paced, so open tasks are ordered by what needs action
  // rather than by due dates.
  const openTasks = [...practicalWork, ...assessments]
    .filter(
      (item) =>
        item.status !== "Passed" &&
        item.status !== "Completed" &&
        item.status !== "Awaiting review",
    )
    .sort(
      (first, second) =>
        (second.status === "Changes requested") -
        (first.status === "Changes requested"),
    );

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
                {greeting}, {student.firstName}. Here’s how your learning is
                going.
              </p>
            </div>
            <strong>
              {overallProgress}
              <span>%</span>
            </strong>
          </div>
          <progress
            aria-label="Overall lesson completion"
            value={lessonsDone}
            max={lessonsTotal || 1}
          />
          <div className="overview-progress-footer">
            <span>
              {lessonsDone} of {lessonsTotal} lessons completed
            </span>
            <Link to="/student/courses">View my courses →</Link>
          </div>
        </section>

        <section className="task-section" aria-labelledby="tasks-heading">
          <div className="task-heading">
            <h2 id="tasks-heading">Needs your attention</h2>
            <span>Work through these at your own pace</span>
          </div>
          {openTasks.length > 0 ? (
            <ul className="task-list">
              {openTasks.map((item) => {
                const page =
                  item.type === "assessment"
                    ? "/student/assessments"
                    : "/student/practical-work";

                return (
                  <li key={item.id}>
                    <div className="task-details">
                      <h3>{item.title}</h3>
                      <p>
                        {item.course} ·{" "}
                        {item.type === "assessment"
                          ? "Assessment"
                          : "Practical work"}
                      </p>
                      <span className={`activity-status ${item.tone}`}>
                        {item.status}
                      </span>
                    </div>
                    <Link
                      className="task-action"
                      to={page}
                      aria-label={`${item.action}: ${item.title}`}
                    >
                      {item.action} <span aria-hidden="true">→</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="task-empty">
              <h3>You’re all caught up</h3>
              <p>
                Nothing needs your attention right now. Keep learning at your
                own pace.
              </p>
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

        <dl
          className="stats home-summary"
          aria-label="Learning progress summary"
        >
          <div className="stat">
            <dt>Active courses</dt>
            <dd>{activeCourses.length}</dd>
            <span>Currently in progress</span>
          </div>
          <div className="stat">
            <dt id="certificates-summary">Certificates earned</dt>
            <dd>{certificates.length}</dd>
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
