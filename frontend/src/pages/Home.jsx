import { Link } from "react-router-dom";
import StudentLayout from "../layouts/StudentLayout";
import {
  student,
  myCourses,
  lastActivity,
  attentionItems,
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

  return (
    <StudentLayout>
      <div className="content">
        <div className="welcome">
          <div>
            <h1>{greeting}, {student.firstName}</h1>
            <p>Keep building your skills. Pick up where you left off.</p>
          </div>
        </div>

        <dl className="stats" aria-label="Learning progress summary">
          <div className="stat">
            <dt>Active courses</dt>
            <dd>{activeCourses.length}</dd>
            <span>Currently in progress</span>
          </div>
          <div className="stat">
            <dt>Lessons completed</dt>
            <dd>
              {lessonsDone}
              <small> / {lessonsTotal}</small>
            </dd>
            <span>Across your registered courses</span>
          </div>
          <div className="stat">
            <dt id="certificates-summary">Certificates earned</dt>
            <dd>{student.certificatesEarned}</dd>
            <span>Recognising your completed work</span>
          </div>
        </dl>

        <div className="activity-heading">
          <p>Lesson and task actions are coming soon.</p>
        </div>
        <div className="next-actions">
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

          <section
            className="attention-card"
            aria-labelledby="attention-heading"
          >
            <div className="action-heading">
              <h3 id="attention-heading">Needs attention</h3>
              <span
                className="attention-count"
                aria-label={`${attentionItems.length} pending items`}
              >
                {attentionItems.length}
              </span>
            </div>
            {attentionItems.length > 0 ? (
              <ul className="attention-list">
                {attentionItems.map((item) => {
                  const page =
                    item.type === "practical"
                      ? "/student/practical-work"
                      : "/student/assessments";
                  return (
                    <li key={item.id}>
                      <span className={`activity-status ${item.tone}`}>
                        {item.status}
                      </span>
                      <h4>{item.title}</h4>
                      <p className="attention-course">{item.course}</p>
                      <p>{item.detail}</p>
                      <Link className="attention-action" to={page}>
                        {item.action} <span aria-hidden="true">→</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="activity-empty">
                <h4>You’re all caught up</h4>
                <p>
                  No assessments or practical work need your attention right
                  now.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>

      <footer className="site">
        <div className="foot-inner">
          <div className="foot-grid">
            <div className="foot-brand">
              <div className="brand">
                Bridge<b>Tech</b>
              </div>
              <p>
                Bridging the university-industry gap — hands-on modules in Git,
                APIs, CI/CD and cloud, verified by GitHub, not a quiz.
              </p>
              <div className="foot-social">
                <a href="#">in</a>
                <a href="#">gh</a>
                <a href="#">x</a>
              </div>
            </div>
            <div className="foot-col">
              <h5>LEARNING</h5>
              <a href="/home">Home</a>
              <Link to="/student/courses">My courses</Link>
              <Link to="/student/assessments">Assessments</Link>
              <Link to="/student/practical-work">Practical work</Link>
            </div>
            <div className="foot-col">
              <h5>PROGRESS</h5>
              <Link to="/student/certificates">Certificates</Link>
              <Link to="/student/github">GitHub activity</Link>
              <a href="#">Transcripts</a>
            </div>
            <div className="foot-col">
              <h5>SUPPORT</h5>
              <a href="#">Help centre</a>
              <a href="#">Contact us</a>
              <a href="/">Public website</a>
            </div>
          </div>
          <div className="foot-bottom">
            <span>© 2026 BridgeTech. All rights reserved.</span>
            <div className="legal">
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </StudentLayout>
  );
}
