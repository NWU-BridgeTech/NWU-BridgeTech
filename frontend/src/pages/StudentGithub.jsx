import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, GitBranch, LockKeyhole } from "lucide-react";
import { Link } from "react-router-dom";
import StudentLayout from "../layouts/StudentLayout";
import { clearAuthTokens, getToken } from "../utils/authStorage";
import "./StudentGithub.css";
import { API_URL } from "@/config";

function normalizeRepository(item) {
  const name = item.name || item.Name || "";
  const fullName = item.fullName || item.full_name || item.FullName || name;
  return {
    name,
    fullName,
    htmlUrl: item.htmlUrl || item.html_url || item.HtmlUrl || "",
    isPrivate:
      item.isPrivate ?? item.private ?? item.IsPrivate ?? false,
  };
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function renderInlineMarkdown(text) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={`${part}-${index}`}>{part.slice(2, -2)}</strong>
    ) : (
      <span key={`${part}-${index}`}>{part}</span>
    ),
  );
}

function renderLearningAnalysis(analysis) {
  return analysis.split(/\r?\n/).map((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) return <div className="github-ai-analysis-spacer" key={`spacer-${index}`} />;

    const heading = trimmed.match(/^\*\*(.+?)\*\*$/);
    if (heading) return <h4 key={`heading-${index}`}>{heading[1]}</h4>;

    const numberedItem = trimmed.match(/^(\d+)\.\s+\*\*(.+?)\*\*\s*[—-]?\s*(.*)$/);
    if (numberedItem) {
      return (
        <div className="github-ai-analysis-item" key={`number-${index}`}>
          <span className="github-ai-analysis-number">{numberedItem[1]}.</span>
          <span>
            <strong>{numberedItem[2]}</strong>
            {numberedItem[3] && <> — {renderInlineMarkdown(numberedItem[3])}</>}
          </span>
        </div>
      );
    }

    const bulletItem = trimmed.match(/^-\s+\*\*(.+?)\*\*:?\s*(.*)$/);
    if (bulletItem) {
      return (
        <div className="github-ai-analysis-item" key={`bullet-${index}`}>
          <span className="github-ai-analysis-bullet" aria-hidden="true">•</span>
          <span>
            <strong>{bulletItem[1]}</strong>
            {bulletItem[2] && <>: {renderInlineMarkdown(bulletItem[2])}</>}
          </span>
        </div>
      );
    }

    return <p key={`paragraph-${index}`}>{renderInlineMarkdown(trimmed)}</p>;
  });
}

export default function StudentGithub() {
  const [username, setUsername] = useState(null);
  const [repository, setRepository] = useState(null);
  const [repositories, setRepositories] = useState([]);
  const [practicalExercises, setPracticalExercises] = useState([]);
  const [learningInsights, setLearningInsights] = useState(null);
  const [selectedRepository, setSelectedRepository] = useState("");
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [disconnectConfirmOpen, setDisconnectConfirmOpen] = useState(false);
  const [unlinkConfirmOpen, setUnlinkConfirmOpen] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const [savingRepository, setSavingRepository] = useState(false);
  const [accountConflict, setAccountConflict] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("github") === "account-conflict";
  });
  const [error, setError] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return ["error", "account-conflict"].includes(params.get("github"))
      ? params.get("message") || "Unable to connect your GitHub account."
      : "";
  });

  const connected = Boolean(username);
  const selectedRepositoryData = useMemo(
    () => repositories.find((item) => item.fullName === selectedRepository),
    [repositories, selectedRepository],
  );

  useEffect(() => {
    window.history.replaceState({}, document.title, window.location.pathname);

    Promise.all([
      fetch(`${API_URL}/api/github/me`, { headers: authHeaders() }).then(
        async (response) => {
          const data = await response.json().catch(() => ({}));
          if (!response.ok) {
            throw new Error(data.message || "Unable to load GitHub connection.");
          }
          return data;
        },
      ),
      fetch(`${API_URL}/api/exercises/my`, { headers: authHeaders() }).then(
        async (response) => {
          const data = await response.json().catch(() => []);
          if (!response.ok) {
            throw new Error(data.message || "Unable to load practical progress.");
          }
          return Array.isArray(data) ? data : [];
        },
      ),
      fetch(`${API_URL}/api/learning-insights`, { headers: authHeaders() }).then(
        async (response) => {
          const data = await response.json().catch(() => ({}));
          if (!response.ok) {
            throw new Error(data.message || "Unable to load learning insights.");
          }
          return data;
        },
      ),
    ])
      .then(([githubData, exerciseData, insights]) => {
        setUsername(githubData.username || null);
        setRepository(githubData.repository || null);
        if (githubData.authorizationRequired) {
          setError("GitHub needs to be reconnected. Disconnect GitHub, then connect the account you want to use.");
        }
        setSelectedRepository("");
        const normalizedRepositories = Array.isArray(githubData.repositories)
          ? githubData.repositories
              .map(normalizeRepository)
              .filter((item) => item.fullName)
          : [];
        setRepositories(
          Array.from(
            new Map(
              normalizedRepositories.map((item) => [item.fullName, item]),
            ).values(),
          ),
        );
        setPracticalExercises(exerciseData);
        setLearningInsights(insights);
      })
      .catch((loadError) => setError(loadError.message))
      .finally(() => setLoading(false));
  }, []);

  const completedExercises = practicalExercises.filter(
    (exercise) => exercise.completed,
  ).length;
  const exerciseProgress = practicalExercises.length
    ? Math.round((completedExercises / practicalExercises.length) * 100)
    : 0;
  const statistics = learningInsights?.statistics;

  async function connectGithub() {
    setError("");
    setAccountConflict(false);
    setConnecting(true);
    try {
      const response = await fetch(`${API_URL}/api/github/connect`, {
        headers: authHeaders(),
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

  function prepareDifferentGithubAccount() {
    window.open("https://github.com/login", "_blank", "noopener,noreferrer");
    setError("Sign in to the GitHub account you want to use in the new tab, then return here and click Connect GitHub again.");
    setAccountConflict(false);
  }

  async function disconnectGithub() {
    setError("");
    setDisconnecting(true);
    try {
      const response = await fetch(`${API_URL}/api/github/connection`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Unable to disconnect GitHub.");
      const verificationResponse = await fetch(`${API_URL}/api/github/me`, {
        headers: authHeaders(),
      });
      if (!verificationResponse.ok) {
        throw new Error("GitHub disconnected, but the connection could not be verified.");
      }
      const verification = await verificationResponse.json();
      if (verification.username || verification.repository) {
        throw new Error("GitHub is still connected. Please try disconnecting again.");
      }
      setUsername(null);
      setRepository(null);
      setRepositories([]);
      setSelectedRepository("");
    } catch (disconnectError) {
      setError(disconnectError.message);
    } finally {
      setDisconnecting(false);
    }
  }

  async function linkRepository() {
    if (!selectedRepository) return;

    setError("");
    setSavingRepository(true);
    try {
      const response = await fetch(`${API_URL}/api/github/repository`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ fullName: selectedRepository }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Unable to link repository.");
      setRepository(data.repository);
      window.dispatchEvent(new Event("notifications-changed"));
    } catch (linkError) {
      setError(linkError.message);
    } finally {
      setSavingRepository(false);
    }
  }

  async function unlinkRepository() {
    setError("");
    setUnlinking(true);
    try {
      const response = await fetch(`${API_URL}/api/github/repository`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Unable to unlink repository.");

      const verificationResponse = await fetch(`${API_URL}/api/github/me`, {
        headers: authHeaders(),
      });
      if (!verificationResponse.ok) {
        throw new Error("Repository unlinked, but the connection could not be verified.");
      }
      const verification = await verificationResponse.json();
      if (verification.repository) {
        throw new Error("The repository is still linked. Please try again.");
      }

      setRepository(null);
      setSelectedRepository("");
      window.dispatchEvent(new Event("notifications-changed"));
    } catch (unlinkError) {
      setError(unlinkError.message);
    } finally {
      setUnlinking(false);
    }
  }

  const steps = [
    { label: "Connect GitHub", detail: "Link your account", complete: connected },
    {
      label: "Select Repository",
      detail: "Choose a repository to link",
      complete: Boolean(selectedRepository),
    },
    {
      label: "Link Repository",
      detail: "Confirm and connect",
      complete: Boolean(repository),
    },
    {
      label: "Complete Skills",
      detail: "Track your progress",
      complete: false,
    },
  ];

  return (
    <StudentLayout title="GitHub">
      <main className="content student-github">
        <section className="github-hero">
          <div>
            <span className="github-eyebrow">PRACTICAL SKILLS</span>
            <h1>Connect Your GitHub Account</h1>
            <p>
              Link your GitHub account, select a repository and start working
              on your practical skills.
            </p>
            <div className="github-hero-actions">
              {!connected ? (
                <>
                  <button
                    className="github-primary-button"
                    type="button"
                    onClick={connectGithub}
                    disabled={connecting || loading}
                  >
                    <GitBranch size={18} aria-hidden="true" />
                    {connecting ? "Opening GitHub..." : accountConflict ? "Connect a different account" : "Connect GitHub"}
                    <ArrowRight size={16} aria-hidden="true" />
                  </button>
                  {accountConflict && (
                    <button
                      className="github-secondary-button"
                      type="button"
                      onClick={prepareDifferentGithubAccount}
                    >
                      Switch GitHub account first
                    </button>
                  )}
                </>
              ) : (
                <button
                  className="github-secondary-button"
                  type="button"
                  onClick={() => setDisconnectConfirmOpen(true)}
                  disabled={disconnecting}
                >
                  {disconnecting ? "Disconnecting..." : "Disconnect GitHub"}
                </button>
              )}
              <Link className="github-practical-button" to="/student/practical-work">
                View your practical work
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>
          <div className="github-hero-art" aria-hidden="true">
            <GitBranch size={74} strokeWidth={1.2} />
          </div>
        </section>

        <nav className="github-steps" aria-label="GitHub connection progress">
          {steps.map((step, index) => (
            <div className="github-step" key={step.label}>
              <span className={`github-step-number ${step.complete || index === 0 && connected ? "complete" : ""}`}>
                {step.complete ? <Check size={15} /> : index + 1}
              </span>
              <span>
                <strong>{step.label}</strong>
                <small>{step.detail}</small>
              </span>
            </div>
          ))}
        </nav>

        {connected ? (
          <section className="github-repository-section" aria-labelledby="repository-heading">
            <div className="github-section-title">
              <GitBranch size={24} aria-hidden="true" />
              <div>
                <h2 id="repository-heading">Select Repository</h2>
                <p>Choose a repository from your GitHub account to link with your practical skills.</p>
                {repository && (
                  <div className="github-persisted-link">
                    <p>Linked repository: <strong>{repository}</strong></p>
                    <div className="github-progress-summary">
                      <div className="github-progress-heading">
                        <span>Practical progress</span>
                        <strong>{exerciseProgress}%</strong>
                      </div>
                      <progress
                        className="github-progress-bar"
                        value={exerciseProgress}
                        max="100"
                        aria-label={`Practical exercise progress: ${exerciseProgress}%`}
                      />
                      <small>
                        {completedExercises} of {practicalExercises.length} practical exercises completed
                      </small>
                    </div>
                    <button type="button" onClick={() => setUnlinkConfirmOpen(true)} disabled={unlinking}>
                      {unlinking ? "Unlinking..." : "Unlink repository"}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="github-repository-layout">
              <div className="github-repository-list">
                <div className="github-list-heading">
                  <strong>Your Repositories</strong>
                  <button type="button" onClick={() => window.location.reload()}>
                    Refresh
                  </button>
                </div>
                {repositories.length ? (
                  repositories.map((item) => (
                    <button
                      className={`github-repository-row ${selectedRepository === item.fullName ? "selected" : ""}`}
                      type="button"
                      key={`github-repository-${item.fullName}`}
                      onClick={() => setSelectedRepository(item.fullName)}
                    >
                      <span className="github-radio" aria-hidden="true">
                        {selectedRepository === item.fullName && <span />}
                      </span>
                      <span className="github-repository-row-copy">
                        <strong>{item.name}</strong>
                        <small>{item.fullName}</small>
                      </span>
                      <span className="github-visibility">
                        {item.fullName === repository ? "Linked" : item.isPrivate ? "Private" : "Public"}
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="github-empty">No repositories were returned from GitHub.</p>
                )}
              </div>

              <aside className="github-selected-repository">
                {selectedRepositoryData ? (
                  <>
                    <div className="github-selected-icon">
                      <GitBranch size={27} aria-hidden="true" />
                    </div>
                    <h3>{selectedRepositoryData.name}</h3>
                    <p>{selectedRepositoryData.fullName}</p>
                    <span className="github-repository-badge">
                      {selectedRepositoryData.isPrivate ? "Private repository" : "Public repository"}
                    </span>
                    <a href={selectedRepositoryData.htmlUrl} target="_blank" rel="noopener noreferrer">
                      Open on GitHub <ArrowRight size={15} aria-hidden="true" />
                    </a>
                    <button className="github-primary-button github-link-button" type="button" onClick={linkRepository} disabled={savingRepository}>
                      {savingRepository ? "Linking..." : "Link Repository"}
                      <ArrowRight size={16} aria-hidden="true" />
                    </button>
                  </>
                ) : (
                  <>
                    <div className="github-selected-icon">
                      <GitBranch size={27} aria-hidden="true" />
                    </div>
                    <h3>Choose a repository</h3>
                    <p>Select a repository from the list to see its details.</p>
                  </>
                )}
              </aside>
            </div>
          </section>
        ) : (
          <section className="github-connect-empty">
            <h2>Connect GitHub to choose a repository</h2>
            <p>Your repositories will appear here after you authorize BridgeTech.</p>
          </section>
        )}

        {connected && statistics && (
          <section className="github-insights-section" aria-labelledby="learning-insights-heading">
            <div className="github-section-title">
              <GitBranch size={24} aria-hidden="true" />
              <div>
                <h2 id="learning-insights-heading">Learning analytics</h2>
                <p>Measured from your BridgeTech learning activity and linked repository.</p>
              </div>
            </div>
            <div className="github-stat-grid">
              <div><strong>{statistics.lessonsProgressPercentage}%</strong><span>Lesson progress</span><small>{statistics.lessonsCompleted} of {statistics.lessonsAvailable} lessons</small></div>
              <div><strong>{statistics.averageQuizScore}%</strong><span>Average quiz score</span><small>{statistics.quizPasses} of {statistics.quizAttempts} attempts passed</small></div>
              <div><strong>{statistics.exerciseProgressPercentage}%</strong><span>Practical progress</span><small>{statistics.exercisesCompleted} of {statistics.exercisesAvailable} exercises</small></div>
              <div><strong>{statistics.completedModules}/{statistics.enrolledModules}</strong><span>Modules completed</span><small>{statistics.certificatesEarned} certificates, {statistics.badgesEarned} badges</small></div>
              <div><strong>{statistics.repositoryCommitsLast30Days}</strong><span>Commits in 30 days</span><small>{statistics.repositoryStars} repository stars</small></div>
              <div><strong>{statistics.repositoryOpenIssues}</strong><span>Open issues</span><small>Repository collaboration signal</small></div>
            </div>
          </section>
        )}

        {connected && <p className="github-connected-account">Connected as @{username}</p>}
        {error && <p className="github-error" role="alert">{error}</p>}
        <p className="github-privacy-note">
          <LockKeyhole size={15} aria-hidden="true" />
          Only repository details returned by GitHub are shown here.
        </p>

        {disconnectConfirmOpen && (
          <div className="github-modal-backdrop" role="presentation">
            <section
              className="github-confirm-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="disconnect-github-heading"
              aria-describedby="disconnect-github-description"
            >
              <div className="github-confirm-icon" aria-hidden="true">
                <GitBranch size={22} />
              </div>
              <h2 id="disconnect-github-heading">Disconnect GitHub?</h2>
              <p id="disconnect-github-description">
                Your GitHub account and linked repository will be removed from
                BridgeTech. You can reconnect it later.
              </p>
              <div className="github-confirm-actions">
                <button
                  className="github-confirm-cancel"
                  type="button"
                  onClick={() => setDisconnectConfirmOpen(false)}
                  disabled={disconnecting}
                >
                  Cancel
                </button>
                <button
                  className="github-confirm-danger"
                  type="button"
                  onClick={() => {
                    setDisconnectConfirmOpen(false);
                    disconnectGithub();
                  }}
                  disabled={disconnecting}
                >
                  {disconnecting ? "Disconnecting..." : "Disconnect"}
                </button>
              </div>
            </section>
          </div>
        )}
        {unlinkConfirmOpen && (
          <div className="github-modal-backdrop" role="presentation">
            <section
              className="github-confirm-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="unlink-repository-heading"
              aria-describedby="unlink-repository-description"
            >
              <div className="github-confirm-icon" aria-hidden="true">
                <GitBranch size={22} />
              </div>
              <p className="github-confirm-eyebrow">REPOSITORY SETTINGS</p>
              <h2 id="unlink-repository-heading">Unlink repository?</h2>
              <p id="unlink-repository-description">
                This will remove the repository from your BridgeTech learning
                activity. Your GitHub account will remain connected.
              </p>
              <div className="github-confirm-actions">
                <button
                  className="github-confirm-cancel"
                  type="button"
                  onClick={() => setUnlinkConfirmOpen(false)}
                  disabled={unlinking}
                >
                  Cancel
                </button>
                <button
                  className="github-confirm-danger"
                  type="button"
                  onClick={() => {
                    setUnlinkConfirmOpen(false);
                    unlinkRepository();
                  }}
                  disabled={unlinking}
                >
                  {unlinking ? "Unlinking..." : "Unlink repository"}
                </button>
              </div>
            </section>
          </div>
        )}
      </main>
    </StudentLayout>
  );
}
