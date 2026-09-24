import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { GitBranch } from "lucide-react";
import StudentLayout from "../layouts/StudentLayout";
import "./StudentGithub.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5174";

export default function StudentGithub() {
  const [username, setUsername] = useState(null);
  const [repository] = useState(null);
  const repositoryUrl = null;
  const [error, setError] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("github") === "error"
      ? params.get("message") || "Unable to connect your GitHub account."
      : "";
  });
  const [connecting, setConnecting] = useState(false);
  const lastSynced = "Not synced yet";
  const connected = Boolean(username);

  useEffect(() => {
    window.history.replaceState({}, document.title, window.location.pathname);

    fetch(`${API_URL}/api/github/me`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load GitHub connection.");
        return response.json();
      })
      .then((data) => setUsername(data.username))
      .catch(() => setError("Unable to load your GitHub connection."));
  }, []);

  async function connectGithub() {
    setError("");
    setConnecting(true);
    try {
      const response = await fetch(`${API_URL}/api/github/connect`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const responseText = await response.text();
      let data = {};
      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch {
          data = {};
        }
      }
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          throw new Error("Your session has expired. Please log in again.");
        }
        throw new Error(data.message || "Unable to start GitHub connection.");
      }
      if (!data.authorizationUrl) {
        throw new Error("GitHub OAuth is not configured correctly.");
      }
      window.location.href = data.authorizationUrl;
    } catch (connectionError) {
      setError(connectionError.message);
      setConnecting(false);
    }
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
                    <h4>@{username}</h4>
                    <a
                      href={`https://github.com/${encodeURIComponent(username)}`}
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
                onClick={connectGithub}
                disabled={connecting}
                aria-describedby="github-account-note"
              >
                {connecting
                  ? "Connecting..."
                  : connected
                    ? "Reconnect GitHub"
                    : "Connect GitHub"}
              </button>
              <p id="github-account-note">
                {error ||
                  "Your GitHub username will be saved to your BridgeTech profile."}
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
                  {repositoryUrl && (
                    <a
                      href={repositoryUrl}
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
