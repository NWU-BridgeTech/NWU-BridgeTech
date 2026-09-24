import { useRef, useState } from "react";
import { Link } from "react-router-dom";
<<<<<<< HEAD
import { useState } from "react";
import AppLayout from "../layouts/AppLayout";
import "./Admin.css";

const metrics = [
  {
    label: "Active Students",
    value: "1,248",
    change: "▲ 12.4%",
    down: false,
  },
  {
    label: "Course Completions",
    value: "7,682",
    change: "▲ 4.1%",
    down: false,
  },
  {
    label: "Average Quiz Score",
    value: "81.6%",
    change: "▼ 0.8%",
    down: true,
  },
  {
    label: "Practical Tasks",
    value: "68.8%",
    change: "▲ 2.6%",
    down: false,
  },
];

const recentStudents = [
  {
    name: "Alex Morgan",
    module: "Git & Version Control",
    progress: "62%",
    status: "Active",
  },
  {
    name: "Jamie Patel",
    module: "APIs & Web Services",
    progress: "88%",
    status: "Active",
  },
  {
    name: "Sam Wilson",
    module: "CI/CD Pipelines",
    progress: "41%",
    status: "Follow up",
  },
];

const todos = [
  {
    title: "Review 12 practical submissions",
    sub: "Git & Version Control",
  },
  {
    title: "Publish API module update",
    sub: "Content team draft",
  },
  {
    title: "Check weekly learner report",
    sub: "Due Friday",
  },
];

export default function Admin() {
  const [activeTab, setActiveTab] = useState("Overview");
  const [completedTodos, setCompletedTodos] = useState([]);
=======
import AppLayout from "../layouts/AppLayout";
import { attentionItems, learningStats, systemStatus } from "../data/adminData";
import { getSystemStatus } from "../utils/systemStatus";
import "./Admin.css";

export default function Admin() {
  const statusSummary = getSystemStatus(systemStatus.services);
  const [selectedItem, setSelectedItem] = useState(null);
  const selectedButtonRef = useRef(null);
>>>>>>> origin/Development
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
<<<<<<< HEAD

          {/* HEADER */}
          <header className="top">

            <div>
              <div className="greeting">
                {greeting}, <b>John Doe</b>
              </div>

              <p>
                Your platform summary for this week.
              </p>
            </div>

            <div className="top-actions">

              <span className="current-date">
  {new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })}
</span>

              <button className="btn">
                Share
              </button>

              <button className="btn">
                Print
              </button>

              <Link
                className="btn blue"
                to="/home"
=======
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
                onClick={(event) => {
                  selectedButtonRef.current = event.currentTarget;
                  setSelectedItem(item);
                }}
>>>>>>> origin/Development
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
                      setSelectedItem(null);
                      selectedButtonRef.current?.focus();
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

<<<<<<< HEAD
=======
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
>>>>>>> origin/Development
    </AppLayout>
  );
}
