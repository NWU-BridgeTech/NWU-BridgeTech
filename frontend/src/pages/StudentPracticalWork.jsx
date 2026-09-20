import formatDeadline from "../utils/formatDeadline";
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import StudentLayout from "../layouts/StudentLayout";
import { practicalWork, githubConnection } from "../data/studentDashboard";
import "./StudentPracticalWork.css";

export default function StudentPracticalWork() {
  const feedbackDialog = useRef(null);
  const [selectedPractical, setSelectedPractical] = useState(null);
  const [showAllPractical, setShowAllPractical] = useState(false);
  const changesRequested = practicalWork.filter(
    (work) => work.status === "Changes requested",
  ).length;
  const awaitingReview = practicalWork.filter(
    (work) => work.status === "Awaiting review",
  ).length;
  const passed = practicalWork.filter(
    (work) => work.status === "Passed",
  ).length;

  function priority(work) {
    if (work.status === "Changes requested") return 0;
    if (work.status === "Not submitted") return 1;
    if (work.status === "Awaiting review") return 2;
    return 3;
  }

  const sortedWork = [...practicalWork].sort((first, second) => {
    const difference = priority(first) - priority(second);
    if (difference !== 0) return difference;
    if (!first.dueAt) return second.dueAt ? 1 : 0;
    if (!second.dueAt) return -1;
    return new Date(first.dueAt) - new Date(second.dueAt);
  });
  const visibleWork = showAllPractical ? sortedWork : sortedWork.slice(0, 3);

  function openFeedback(practical) {
    setSelectedPractical(practical);
    feedbackDialog.current.showModal();
  }

  return (
    <StudentLayout title="Practical work">
      <div className="content student-practical">
        <section
          className="practical-section"
          aria-labelledby="student-page-title"
        >
          <div className="practical-heading">
            <div>
              <h2>Your submissions</h2>
              <p>
                Review feedback, check your progress, and see what’s due next.
              </p>
            </div>
            <Link className="github-indicator" to="/student/github">
              <span className="connection-dot" aria-hidden="true" />
              GitHub ·{" "}
              {githubConnection.username ? "Connected" : "Not connected"}
            </Link>
          </div>
          <div className="practical-summary">
            <p>
              {changesRequested} need changes · {awaitingReview} awaiting review
              · {passed} passed
            </p>
            <span>All deadlines in SAST</span>
          </div>
          {practicalWork.length > 0 ? (
            <div className="practical-table-wrap">
              <table className="practical-table" id="practical-list">
                <caption className="visually-hidden">
                  Practical exercises, submission status, deadlines and
                  available actions
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Exercise</th>
                    <th scope="col">Status</th>
                    <th scope="col">Deadline</th>
                    <th scope="col">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleWork.map((work) => {
                    const needsAction =
                      work.status === "Changes requested" ||
                      work.status === "Not submitted";
                    const overdue =
                      needsAction &&
                      work.dueAt &&
                      new Date(work.dueAt) < new Date();

                    return (
                      <tr key={work.id}>
                        <th scope="row">
                          {work.title}
                          <span className="exercise-course">{work.course}</span>
                        </th>
                        <td>
                          <span className={`activity-status ${work.tone}`}>
                            {work.status}
                          </span>
                        </td>
                        <td className="exercise-deadline">
                          {work.dueAt ? (
                            <>
                              {overdue && (
                                <span className="exercise-overdue">
                                  Overdue
                                </span>
                              )}
                              <time dateTime={work.dueAt}>
                                {formatDeadline(work.dueAt)}
                              </time>
                            </>
                          ) : (
                            <span>No deadline set</span>
                          )}
                        </td>
                        <td>
                          <button
                            className="text-action"
                            disabled={work.status === "Not submitted"}
                            aria-describedby={
                              work.status === "Not submitted"
                                ? "submission-availability"
                                : undefined
                            }
                            onClick={() => openFeedback(work)}
                            aria-label={`${work.action}: ${work.title}`}
                          >
                            {work.action}
                            <span aria-hidden="true"> →</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {practicalWork.length > 3 && (
                <div className="practical-list-footer">
                  <span>
                    Showing {visibleWork.length} of {practicalWork.length}{" "}
                    exercises
                  </span>
                  <button
                    className="text-action"
                    aria-expanded={showAllPractical}
                    aria-controls="practical-list"
                    onClick={() => setShowAllPractical(!showAllPractical)}
                  >
                    {showAllPractical
                      ? "Show fewer exercises"
                      : "View all practical work"}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="practical-empty">
              <h3>No practical work yet</h3>
              <p>Your exercises and submission updates will appear here.</p>
            </div>
          )}
          <p
            className="course-preview-note practical-note"
            id="submission-availability"
          >
            Exercise submissions are coming soon. You can view existing feedback
            and submission details.
          </p>
        </section>

        <dialog
          className="courses-dialog course-details-dialog"
          ref={feedbackDialog}
          aria-labelledby="feedback-dialog-heading"
        >
          <div className="action-heading">
            <h3 id="feedback-dialog-heading">
              {selectedPractical?.feedback ? "Feedback" : "Submission"}:{" "}
              {selectedPractical?.title}
            </h3>
            <button
              className="btn"
              onClick={() => feedbackDialog.current.close()}
              autoFocus
            >
              Close
            </button>
          </div>
          {selectedPractical && (
            <>
              <p>{selectedPractical.course}</p>
              <span className={`activity-status ${selectedPractical.tone}`}>
                {selectedPractical.status}
              </span>
              {selectedPractical.dueAt && (
                <p>
                  Deadline:{" "}
                  <time dateTime={selectedPractical.dueAt}>
                    {formatDeadline(selectedPractical.dueAt)}
                  </time>{" "}
                  SAST
                </p>
              )}
              {selectedPractical.feedback ? (
                <>
                  <h4>
                    {selectedPractical.status === "Passed"
                      ? "What went well"
                      : "What to improve"}
                  </h4>
                  <p>{selectedPractical.feedback.summary}</p>
                  <ul>
                    {selectedPractical.feedback.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </>
              ) : (
                <>
                  <h4>Submission status</h4>
                  <p>{selectedPractical.detail}</p>
                  <p>
                    Feedback will appear here once your work has been reviewed.
                  </p>
                </>
              )}
              <p className="course-preview-note">
                Exercise submissions are not available yet.
              </p>
            </>
          )}
        </dialog>
      </div>
    </StudentLayout>
  );
}
