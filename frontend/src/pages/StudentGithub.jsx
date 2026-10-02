import { useEffect, useState } from "react";
import { clearAuthTokens, getToken } from "../utils/authStorage";
import { Link } from "react-router-dom";
import { GitBranch } from "lucide-react";
import StudentLayout from "../layouts/StudentLayout";
import "./StudentGithub.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5174";

export default function StudentGithub() {
  const [username, setUsername] = useState(null);
  const [repository, setRepository] = useState(null);
  const [repositories, setRepositories] = useState([]);
  const [selectedRepository, setSelectedRepository] = useState("");
  const [error, setError] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [loadingRepositories, setLoadingRepositories] = useState(false);
  const connected = Boolean(username);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("github") === "error") {
      setError(
        params.get("message") || "Unable to connect your GitHub account.",
      );
    }
    window.history.replaceState({}, document.title, window.location.pathname);

    fetch(`${API_URL}/api/github/me`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load GitHub connection.");
        return response.json();
      })
      .then((data) => {
        setUsername(data.username);
        setRepository(data.repository);
        setSelectedRepository(data.repository || "");
      })
      .catch(() => setError("Unable to load your GitHub connection."));
  }, []);

  useEffect(() => {
    if (!username) return;
    setLoadingRepositories(true);
    fetch(`${API_URL}/api/github/repositories`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load repositories.");
        return response.json();
      })
      .then((data) => {
        setRepositories(data);
        setSelectedRepository((current) => current || data[0]?.fullName || "");
      })
      .catch(() => setError("Unable to load your public repositories."))
      .finally(() => setLoadingRepositories(false));
  }, [username]);

  async function connectGithub() {
    setError("");
    setConnecting(true);
    try {
      const response = await fetch(`${API_URL}/api/github/connect`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 401) {
          clearAuthTokens();
          throw new Error("Your session has expired. Please log in again.");
        }
        throw new Error(data.message || "Unable to start GitHub connection.");
      }
      window.location.href = data.authorizationUrl;
    } catch (connectionError) {
      setError(connectionError.message);
      setConnecting(false);
    }
  }

  async function linkRepository() {
    if (!selectedRepository) return;
    setError("");
    const response = await fetch(`${API_URL}/api/github/repository`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ fullName: selectedRepository }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(data.message || "Unable to link repository.");
      return;
    }
    setRepository(data.fullName);
  }

  return (
    <StudentLayout title="GitHub activity">
      <div className="content student-github">
        <div className="github-intro">
          <h2>Your code and practical work</h2>
          <p>
            Connect GitHub and link the repository used for your practical
            exercises.
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
                    <p>Connect GitHub before choosing a repository.</p>
                  </>
                )}
              </div>
            </div>
            <div className="github-card-footer">
              <button
                className="btn blue"
                onClick={connectGithub}
                disabled={connecting}
              >
                {connecting
                  ? "Connecting..."
                  : connected
                    ? "Reconnect GitHub"
                    : "Connect GitHub"}
              </button>
              {error ? (
                <p className="error-message visible" role="alert">
                  {error}
                </p>
              ) : null}
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
                  <p>This repository is linked to your practical work.</p>
                  <a
                    href={`https://github.com/${repository}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open repository ↗
                  </a>
                </>
              ) : (
                <>
                  <h4>No repository linked</h4>
                  <p>
                    Choose a public repository for your practical exercises.
                  </p>
                </>
              )}
            </div>
            <div className="github-card-footer">
              {connected && !loadingRepositories && repositories.length > 0 ? (
                <>
                  <label className="github-repository-select">
                    <span>Repository</span>
                    <select
                      value={selectedRepository}
                      onChange={(event) =>
                        setSelectedRepository(event.target.value)
                      }
                    >
                      {repositories.map((item) => (
                        <option key={item.fullName} value={item.fullName}>
                          {item.fullName}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button className="btn" onClick={linkRepository}>
                    {repository ? "Change repository" : "Link repository"}
                  </button>
                </>
              ) : (
                <button className="btn" disabled>
                  {loadingRepositories
                    ? "Loading repositories..."
                    : connected
                      ? "No public repositories"
                      : "Connect GitHub first"}
                </button>
              )}
              <p>
                Only public repositories are available in this first version.
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
