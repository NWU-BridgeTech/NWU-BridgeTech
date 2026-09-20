import formatDeadline from "../utils/formatDeadline";
import { Link } from "react-router-dom";
import { GitBranch } from "lucide-react";
import StudentLayout from "../layouts/StudentLayout";
import { githubConnection } from "../data/studentDashboard";
import "./StudentGithub.css";

export default function StudentGithub() {
  const connected = Boolean(githubConnection.username);
  const repository = connected ? githubConnection.repository : null;
  let lastSynced = "Not synced yet";

  if (connected && githubConnection.lastSyncedAt) {
    lastSynced = formatDeadline(githubConnection.lastSyncedAt) + " SAST";
  }

  return (
    <StudentLayout title="GitHub activity">
      <div className="content student-github">
        <div className="github-intro">
          <h2>Your code and practical work</h2>
          <p>
            Use your GitHub account and repository to keep your practical work
            connected to the code you write.
          </p>
        </div>

        <div className="github-connection-grid">
          <section
            className="github-card"
            aria-labelledby="github-account-heading"
          >
            <div className="github-card-heading">
              <h3 id="github-account-heading">GitHub account</h3>
              <span
                className={`activity-status ${connected ? "success" : "neutral"}`}
              >
                {connected ? "Connected" : "Not connected"}
              </span>
            </div>
            <div className="github-account-summary">
              <div className="github-account-icon" aria-hidden="true">
                <GitBranch size={26} strokeWidth={1.5} />
              </div>
              <div>
                {connected ? (
                  <>
                    <h4>@{githubConnection.username}</h4>
                    <a
                      href={`https://github.com/${encodeURIComponent(githubConnection.username)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View GitHub profile ↗
                    </a>
                  </>
                ) : (
                  <>
                    <h4>No account connected</h4>
                    <p>Connect your account before linking a repository.</p>
                  </>
                )}
              </div>
            </div>
            <dl className="github-sync">
              <dt>Last synced</dt>
              <dd>{lastSynced}</dd>
            </dl>
            <div className="github-card-footer">
              <button
                className="btn blue"
                disabled
                aria-describedby="github-account-note"
              >
                {connected ? "Manage connection" : "Connect GitHub"}
              </button>
              <p id="github-account-note">
                GitHub account linking and sync are coming soon.
              </p>
            </div>
          </section>

          <section
            className="github-card"
            aria-labelledby="github-repository-heading"
          >
            <div className="github-card-heading">
              <h3 id="github-repository-heading">Practical repository</h3>
              <span
                className={`activity-status ${repository ? "success" : "neutral"}`}
              >
                {repository ? "Linked" : "Not linked"}
              </span>
            </div>
            <div className="github-repository-summary">
              {repository ? (
                <>
                  <h4>{repository}</h4>
                  <p>The repository linked to your practical work.</p>
                  {githubConnection.repositoryUrl && (
                    <a
                      href={githubConnection.repositoryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open repository ↗
                    </a>
                  )}
                </>
              ) : (
                <>
                  <h4>No repository linked</h4>
                  <p>
                    {connected
                      ? "Link the repository where you keep your practical exercises."
                      : "Once your account is connected, you can link the repository for your practical exercises."}
                  </p>
                </>
              )}
            </div>
            <div className="github-card-footer">
              <button
                className="btn"
                disabled
                aria-describedby="github-repository-note"
              >
                {repository ? "Change repository" : "Link repository"}
              </button>
              <p id="github-repository-note">
                Repository linking is coming soon.
              </p>
            </div>
          </section>
        </div>

        <div className="github-practical-link">
          <p>
            Looking for exercise instructions or feedback? Find them in
            Practical work.
          </p>
          <Link className="text-action" to="/student/practical-work">
            Go to practical work →
          </Link>
        </div>
      </div>
    </StudentLayout>
  );
}
