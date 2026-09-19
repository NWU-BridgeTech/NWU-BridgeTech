import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import StudentLayout from "../layouts/StudentLayout";
import {
  practicalWork,
  githubConnection,
} from "../data/studentDashboard";

export default function StudentPracticalWork() {
  const feedbackDialog = useRef(null);
  const [selectedPractical, setSelectedPractical] = useState(null);

  function openFeedback(practical) {
    setSelectedPractical(practical);
    feedbackDialog.current.showModal();
  }
  const [showAllPractical, setShowAllPractical] = useState(false);
  const visibleWork = showAllPractical
    ? practicalWork
    : practicalWork.slice(0, 3);

  return (
    <StudentLayout title="Practical work">
      <div className="content">
        <section className="practical-section" aria-labelledby="student-page-title">
          <div className="welcome">
            <Link className="github-indicator" to="/student/github">
              <span className="connection-dot" aria-hidden="true" />
              GitHub · {githubConnection.username ? "Connected" : "Not connected"}
            </Link>
          </div>
          <p className="course-preview-note">
            Exercise submissions are coming soon.
          </p>
          <div className="practical-table-wrap">
            <table className="practical-table" id="practical-list">
              <caption className="visually-hidden">
                Practical exercises, submission status and available actions
              </caption>
              <thead>
                <tr>
                  <th scope="col">Exercise</th>
                  <th scope="col">Course</th>
                  <th scope="col">Status</th>
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {visibleWork.map((work) => (
                  <tr key={work.id}>
                    <th scope="row">{work.title}</th>
                    <td className="practical-course">{work.course}</td>
                    <td>
                      <span className={`activity-status ${work.tone}`}>
                        {work.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="text-action"
                        disabled={work.status === "Not submitted"}
                        onClick={() => openFeedback(work)}
                        aria-label={`${work.action}: ${work.title}`}
                      >
                        {work.action}
                        <span aria-hidden="true"> →</span>
                      </button>
                    </td>
                  </tr>
                ))}
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
