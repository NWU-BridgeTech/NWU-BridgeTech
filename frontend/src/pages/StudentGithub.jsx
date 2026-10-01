import { useEffect, useState } from "react";
import { clearAuthTokens, getToken } from "../utils/authStorage";
import { Link } from "react-router-dom";
import { ArrowRight, BadgeCheck, GitBranch, LockKeyhole } from "lucide-react";
import StudentLayout from "../layouts/StudentLayout";
import { practicalWork } from "../data/studentDashboard";
import "./StudentGithub.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5174";

export default function StudentGithub() {
  const [username, setUsername] = useState(null);
  const [repository, setRepository] = useState(null);
  const [error, setError] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("github") === "error"
      ? params.get("message") || "Unable to connect your GitHub account."
      : "";
  });
  const [connecting, setConnecting] = useState(false);
  const connected = Boolean(username);

  const skills = [
    {
      label: "Connect a GitHub account",
      complete: connected,
      detail: connected
        ? `Connected as @${username}`
        : "Connect your account to begin",
    },
    {
      label: "Link a practical repository",
      complete: Boolean(repository),
      detail: repository || "Choose the repository used for practical work",
    },
    {
      label: "Make your first commit",
      complete: false,
      detail: "Activity tracking will appear when repository sync is available",
    },
    {
      label: "Work with branches and pull requests",
      complete: false,
      detail: "Activity tracking will appear when repository sync is available",
    },
  ];
  const completedSkills = skills.filter((skill) => skill.complete).length;
  const nextSkill = skills.find((skill) => !skill.complete);
  const progressPercent = Math.round((completedSkills / skills.length) * 100);
  const skillLevel =
    completedSkills >= 4
      ? "Confident"
      : completedSkills >= 3
        ? "Practicing"
        : completedSkills >= 1
          ? "Developing"
          : "Foundations";

  useEffect(() => {
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
        setRepository(data.repository || null);
      })
      .catch(() => setError("Unable to load your GitHub connection."));
  }, []);

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

  return (
    <StudentLayout title="GitHub">
      <div className="content student-github">
        <div className="github-intro">
          <div className="github-title-row">
            <div className="github-title-icon" aria-hidden="true">
              <GitBranch size={28} strokeWidth={1.7} />
            </div>
            <div>
              <span className="github-eyebrow">PRACTICAL SKILLS / GITHUB</span>
              <h2>GitHub</h2>
              <p>
                Track your GitHub activity and see your progress as you build
                your practical skills.
              </p>
            </div>
          </div>
        </div>

        <div className="github-overview-grid">
          <section
          className="github-learning-focus"
          aria-labelledby="github-learning-heading"
        >
          <div className="github-section-heading">
            <div className="github-section-icon" aria-hidden="true">
              <BadgeCheck size={24} strokeWidth={1.7} />
            </div>
            <div>
              <h2 id="github-learning-heading">GitHub Learning Progress</h2>
              <p>
                Build your Git and GitHub skills by completing real development
                tasks.
              </p>
            </div>
          </div>
          <div className="github-progress-summary">
            <div>
              <strong>
                {completedSkills} of {skills.length} skills demonstrated
              </strong>
              <span>
                Based only on activity currently verified by PracticalWork.
              </span>
            </div>
            <div className="github-progress-score">
              <strong>{progressPercent}%</strong>
              <span>{skillLevel}</span>
            </div>
          </div>
          <div
            className="github-progress-track"
            aria-label={`${progressPercent}% of GitHub skills demonstrated`}
          >
            <span style={{ width: `${progressPercent}%` }} />
          </div>
          <ol className="github-skill-list">
            {skills.map((skill) => (
              <li
                className={skill.complete ? "complete" : "pending"}
                key={skill.label}
              >
                <span className="github-skill-marker" aria-hidden="true">
                  {skill.complete ? "✓" : "○"}
                </span>
                <span>
                  <strong>{skill.label}</strong>
                  <small>{skill.detail}</small>
                </span>
                <span className="github-skill-status">
                  {skill.complete ? "Demonstrated" : "Not tracked"}
                </span>
              </li>
            ))}
          </ol>
          </section>

        <div className="github-side-stack">
          <section
            className="github-card github-next-skill"
            aria-labelledby="next-skill-heading"
          >
            <div className="github-card-heading">
              <h3 id="next-skill-heading">Next skill</h3>
              <span className="github-step-label">Keep learning</span>
            </div>
            <h4>
              {nextSkill?.label || "Keep practising your GitHub workflow"}
            </h4>
            <p>
              {nextSkill?.complete
                ? "You have demonstrated every currently tracked skill."
                : "Learn the workflow, then demonstrate it through your practical repository."}
            </p>
            <Link className="btn blue" to="/student/practical-work">
              View practical work <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </section>

          <section
            className="github-card github-repository-card"
            aria-labelledby="repository-heading"
          >
            <div className="github-card-heading">
              <h3 id="repository-heading">Repository connection</h3>
              <span
                className={`activity-status ${repository ? "success" : "neutral"}`}
              >
                {repository
                  ? "Linked"
                  : connected
                    ? "Choose one"
                    : "Not connected"}
              </span>
            </div>
            {repository ? (
              <>
                <h4>{repository}</h4>
                <p>Your practical work is connected to this repository.</p>
                <a
                  className="github-repository-link"
                  href={`https://github.com/${repository}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open repository <ArrowRight size={15} aria-hidden="true" />
                </a>
              </>
            ) : (
              <>
                <h4>
                  {connected
                    ? "Select your practical repository"
                    : "Connect GitHub to get started"}
                </h4>
                <p>
                  {connected
                    ? "Link the repository you use for practical work."
                    : "Connect your account to begin demonstrating GitHub skills."}
                </p>
              </>
            )}
            <div className="github-card-footer">
              <button
                className="btn"
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
        </div>
        </div>

        <section
          className="github-practical-section"
          aria-labelledby="github-practical-heading"
        >
          <div className="github-section-heading">
            <div className="github-section-icon" aria-hidden="true">
              <GitBranch size={22} strokeWidth={1.7} />
            </div>
            <div>
              <h2 id="github-practical-heading">Practical Work</h2>
              <p>
                Your GitHub activity is connected to your practical exercises.
              </p>
            </div>
            <Link className="text-action" to="/student/practical-work">
              View all <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
          <div className="github-practical-list">
            {practicalWork.slice(0, 3).map((work) => (
              <div className="github-practical-item" key={work.id}>
                <div>
                  <strong>{work.title}</strong>
                  <span>{work.course}</span>
                </div>
                <span className={`activity-status ${work.tone}`}>
                  {work.status}
                </span>
              </div>
            ))}
          </div>
        </section>

        <div className="github-data-note">
          <LockKeyhole size={15} aria-hidden="true" />
          <p>
            Commit, branch, pull request, and review milestones will appear here
            once GitHub activity sync is enabled.
          </p>
        </div>
      </div>
    </StudentLayout>
  );
}
