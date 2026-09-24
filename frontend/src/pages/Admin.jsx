import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "../layouts/AppLayout";
import { attentionItems, learningStats, systemStatus } from "../data/adminData";
import { getSystemStatus } from "../utils/systemStatus";
import "./Admin.css";

export default function Admin() {
  const statusSummary = getSystemStatus(systemStatus.services);
  const [selectedItem, setSelectedItem] = useState(null);
  const selectedButtonRef = useRef(null);

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
                className={`metric metric-attention ${
                  selectedItem === item ? "selected" : ""
                }`}
                key={item.label}
                aria-expanded={selectedItem === item}
                aria-controls="attention-details"
                onClick={(event) => {
                  selectedButtonRef.current = event.currentTarget;
                  setSelectedItem(item);
                }}
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
                    <h3 id="attention-details-title">
                      {selectedItem.label}
                    </h3>

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
                <p className="learning-stat-description">
                  {stat.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}