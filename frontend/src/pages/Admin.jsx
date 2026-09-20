import { useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "../layouts/AppLayout";
import { systemStatus } from "../data/adminData";
import { getSystemStatus } from "../utils/systemStatus";
import "./Admin.css";

const attentionItems = [
  {
    label: "Submissions to review",
    value: "12",
    note: "Practical work awaiting feedback",
    description: "Pending submissions by exercise",
    items: [
      { title: "Git basics", detail: "5 submissions awaiting feedback" },
      {
        title: "Branching and merging",
        detail: "4 submissions awaiting feedback",
      },
      {
        title: "Pull request workflow",
        detail: "3 submissions awaiting feedback",
      },
    ],
  },
  {
    label: "Students needing support",
    value: "8",
    note: "Learners who need a check-in",
    description: "Recent follow-ups · 3 of 8 students",
    items: [
      { title: "Sam Wilson", detail: "CI/CD Pipelines · 41% complete" },
      {
        title: "Taylor Adams",
        detail: "Git & Version Control · Practical task overdue",
      },
      {
        title: "Jordan Smith",
        detail: "APIs & Web Services · Quiz retry needed",
      },
    ],
  },
  {
    label: "Content to publish",
    value: "3",
    note: "Draft lessons awaiting review",
    description: "Lessons to review before publishing",
    items: [
      { title: "Introduction to APIs", detail: "API module update · Draft" },
      {
        title: "Working with API responses",
        detail: "Examples updated · Draft",
      },
      { title: "API authentication", detail: "Resources added · Draft" },
    ],
  },
];

const learningStats = [
  {
    label: "Active students",
    value: "1,248",
    description: "Learners active this month",
  },
  {
    label: "Course completions",
    value: "7,682",
    description: "Courses completed this month",
  },
  {
    label: "Average quiz score",
    value: "81.6%",
    description: "Across completed quizzes",
  },
  {
    label: "Practical completion rate",
    value: "68.8%",
    description: "Of assigned practical work",
  },
];

export default function Admin() {
  const statusSummary = getSystemStatus(systemStatus.services);
  const [selectedItem, setSelectedItem] = useState(null);
  const currentHour = new Date().getHours();

  let greeting;

  if (currentHour < 12) {
    greeting = "Good morning";
  } else if (currentHour < 18) {
    greeting = "Good afternoon";
  } else {
    greeting = "Good evening";
  }

  return (
    <AppLayout>
      {/* HEADER */}
      <header className="top dashboard-header">
        <div>
          <h1>Overview</h1>
          <p>{greeting}, John Doe. Here’s your platform summary.</p>
        </div>

        <div className="dashboard-header-actions">
          <span className="current-date">
            {new Date().toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>

          <Link className="btn blue" to="/home">
            Student view
          </Link>
        </div>
      </header>

      <div className="content">
        <section aria-labelledby="attention-heading">
          <h2 className="attention-heading" id="attention-heading">
            Needs attention
          </h2>
          <p className="attention-intro">
            Select a card to show more information.
          </p>
          <div className="metrics dashboard-metrics">
            {attentionItems.map((item) => (
              <button
                type="button"
                className={`metric metric-attention ${selectedItem === item ? "selected" : ""}`}
                key={item.label}
                aria-expanded={selectedItem === item}
                aria-controls="attention-details"
                onClick={() => setSelectedItem(item)}
              >
                <small>{item.label}</small>
                <b>{item.value}</b>
                <span className="metric-note">{item.note}</span>
              </button>
            ))}
          </div>
          <div id="attention-details" hidden={!selectedItem}>
            {selectedItem && (
              <section
                className="attention-details"
                aria-labelledby="attention-details-title"
              >
                <div className="attention-details-header">
                  <div>
                    <h3 id="attention-details-title">{selectedItem.label}</h3>
                    <p>{selectedItem.description}</p>
                  </div>
                  <button
                    type="button"
                    className="attention-close"
                    aria-label="Close details"
                    onClick={() => {
                      const selectedButton = document.querySelector(
                        ".dashboard-metrics .selected",
                      );
                      setSelectedItem(null);
                      selectedButton?.focus();
                    }}
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                </div>
                <ul className="attention-detail-list">
                  {selectedItem.items.map((item) => (
                    <li key={item.title}>
                      <strong>{item.title}</strong>
                      <span>{item.detail}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </section>

        <section
          className={`platform-status status-${statusSummary.status}`}
          aria-label="Platform status"
        >
          <div>
            <p className="platform-status-heading">
              <span className="status-dot" aria-hidden="true" />
              {statusSummary.title}
            </p>
            <p className="platform-status-details">
              Service availability and reported issues
            </p>
          </div>
          <Link to="/system-status">
            View system status <span aria-hidden="true">→</span>
          </Link>
        </section>

        <section
          className="learning-overview"
          aria-labelledby="learning-heading"
        >
          <h2 id="learning-heading">Learning overview</h2>
          <p className="learning-intro">
            A snapshot of student activity and performance.
          </p>
          <div className="learning-stats">
            {learningStats.map((stat) => (
              <div className="learning-stat" key={stat.label}>
                <h3>{stat.label}</h3>
                <p className="learning-stat-value">{stat.value}</p>
                <p className="learning-stat-description">{stat.description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
