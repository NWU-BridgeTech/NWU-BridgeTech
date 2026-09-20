import formatDeadline from "../utils/formatDeadline";
import StudentLayout from "../layouts/StudentLayout";
import { assessments } from "../data/studentDashboard";
import "./StudentAssessments.css";

function isCompleted(assessment) {
  return assessment.status === "Completed" || assessment.status === "Passed";
}

function AssessmentCard({ assessment }) {
  const completed = isCompleted(assessment);
  const dueDate = assessment.dueAt ? new Date(assessment.dueAt) : null;
  const overdue = dueDate && dueDate < new Date() && !completed;
  const deadline = dueDate
    ? formatDeadline(assessment.dueAt)
    : "No deadline set";

  return (
    <li className="assessment-card">
      <div className="assessment-details">
        <span className={`activity-status ${assessment.tone}`}>
          {assessment.status}
        </span>
        <h3>{assessment.title}</h3>
        <p className="assessment-course">{assessment.course}</p>
        <p>{assessment.detail}</p>
      </div>
      <div className="assessment-deadline">
        <span className={overdue ? "is-overdue" : ""}>
          {overdue ? "Overdue" : "Due date"}
        </span>
        {dueDate ? (
          <time dateTime={assessment.dueAt}>{deadline}</time>
        ) : (
          <span>No deadline set</span>
        )}
      </div>
      <button
        className={`btn${completed ? "" : " blue"}`}
        disabled
        aria-describedby="assessment-availability"
      >
        {completed ? "View results" : assessment.action}
      </button>
    </li>
  );
}

export default function StudentAssessments() {
  const pendingAssessments = assessments.filter((item) => !isCompleted(item));
  const completedAssessments = assessments.filter(isCompleted);

  // Show the earliest deadline first, with undated work at the end.
  pendingAssessments.sort((first, second) => {
    if (!first.dueAt) return second.dueAt ? 1 : 0;
    if (!second.dueAt) return -1;
    return new Date(first.dueAt) - new Date(second.dueAt);
  });

  return (
    <StudentLayout title="Assessments">
      <div className="content student-assessments">
        <section aria-labelledby="pending-assessments">
          <div className="assessment-section-heading">
            <div>
              <h2 id="pending-assessments">Pending assessments</h2>
              <p>
                Finish what you’ve started and keep track of what’s due next.
              </p>
            </div>
            <span className="assessment-count">
              {pendingAssessments.length} pending
            </span>
          </div>
          <p className="assessment-timezone">
            All deadlines are shown in SAST.
          </p>
          {pendingAssessments.length > 0 ? (
            <ul className="assessment-list">
              {pendingAssessments.map((assessment) => (
                <AssessmentCard key={assessment.id} assessment={assessment} />
              ))}
            </ul>
          ) : (
            <div className="assessment-empty">
              <h3>You’re all caught up</h3>
              <p>No assessments need your attention right now.</p>
            </div>
          )}
        </section>

        <section
          className="completed-assessments"
          aria-labelledby="completed-assessments"
        >
          <div className="assessment-section-heading">
            <div>
              <h2 id="completed-assessments">Completed assessments</h2>
              <p>Your finished work, all in one place.</p>
            </div>
            <span className="assessment-count">
              {completedAssessments.length} completed
            </span>
          </div>
          {completedAssessments.length > 0 ? (
            <ul className="assessment-list">
              {completedAssessments.map((assessment) => (
                <AssessmentCard key={assessment.id} assessment={assessment} />
              ))}
            </ul>
          ) : (
            <div className="assessment-empty">
              <h3>No completed assessments yet</h3>
              <p>Completed assessments will appear here.</p>
            </div>
          )}
        </section>
        <p
          className="course-preview-note assessment-note"
          id="assessment-availability"
        >
          Assessment actions and results are coming soon.
        </p>
      </div>
    </StudentLayout>
  );
}
