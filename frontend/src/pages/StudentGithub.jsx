import StudentLayout from "../layouts/StudentLayout";
import { githubConnection } from "../data/studentDashboard";

export default function StudentGithub() {
  return (
    <StudentLayout title="GitHub activity">
      <div className="content">
        <section className="attention-card">
          <div className="action-heading">
            <h3>GitHub connection</h3>
            <span className="activity-status neutral">
              {githubConnection.username ? "Connected" : "Not connected"}
            </span>
          </div>
          <p>
            Connect your GitHub account to link repositories for your practical
            work.
          </p>
          <dl className="github-details">
            <div>
              <dt>Account</dt>
              <dd>{githubConnection.username || "Not connected"}</dd>
            </div>
            <div>
              <dt>Repository</dt>
              <dd>{githubConnection.repository || "Not linked"}</dd>
            </div>
          </dl>
          <div className="enrolment-preview">
            <p id="github-preview-note">
              GitHub linking is coming soon.
            </p>
            <button
              className="btn"
              disabled
              aria-describedby="github-preview-note"
            >
              Connect GitHub
            </button>
          </div>
        </section>
      </div>
    </StudentLayout>
  );
}
