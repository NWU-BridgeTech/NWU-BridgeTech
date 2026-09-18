import { Link } from "react-router-dom";
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
  const currentHour = new Date().getHours();

  let greeting;

  if (currentHour < 12) {
    greeting = "Good morning";
  } else if (currentHour < 18) {
    greeting = "Good afternoon";
  } else {
    greeting = "Good evening";
  }

  const tabs = [
    "Overview",
    "Students",
    "Learning content",
    "More",
  ];

  return (
    <AppLayout>

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
              >
                Student view
              </Link>

            </div>

          </header>

          <div className="content">

            {/* TABS */}
            <nav className="tabs">

              {tabs.map((tab) => (
                <button
                  key={tab}
                  className={`tab ${
                    activeTab === tab
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    setActiveTab(tab)
                  }
                >
                  {tab}
                </button>
              ))}

            </nav>

            {/* OVERVIEW */}
            {activeTab === "Overview" && (
              <>

                <section className="metrics">

                  {metrics.map((m) => (
                    <div
                      className="metric"
                      key={m.label}
                    >
                      <small>
                        {m.label}
                      </small>

                      <b>
                        {m.value}
                      </b>

                      <span
                        className={`change${
                          m.down
                            ? " red"
                            : ""
                        }`}
                      >
                        {m.change}
                      </span>
                    </div>
                  ))}

                </section>

                <div className="grid">

                  <section className="card">

                    <div
                      style={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                      }}
                    >
                      <div>

                        <h3>
                          Learning activity
                        </h3>

                        <p className="sub">
                          Completed lessons and active
                          learners over the last seven
                          days.
                        </p>

                      </div>

                      <span className="sub">
                        This week · Last week
                      </span>

                    </div>

                    <div className="chart">

                      <svg
                        viewBox="0 0 900 250"
                        preserveAspectRatio="none"
                        style={{
                          width: "100%",
                          height: "100%",
                        }}
                      >

                        <path
                          d="M0 195 C60 135,100 180,150 125 S230 80,280 145 S370 155,420 105 S500 165,560 135 S640 70,700 95 S790 65,900 120"
                          fill="none"
                          stroke="#3159ad"
                          strokeWidth="3"
                        />

                        <path
                          d="M0 220 C90 155,130 170,190 145 S280 205,340 150 S450 205,520 180 S620 220,680 185 S790 150,900 80"
                          fill="none"
                          stroke="#58a6c4"
                          strokeWidth="2.5"
                        />

                      </svg>

                    </div>

                  </section>

                  <aside className="card status">

                    <h3>
                      Status summary
                    </h3>

                    <p className="sub">
                      Platform activity is operating
                      normally.
                    </p>

                    <b className="big">
                      96.8%
                    </b>

                    <p>
                      successful learning sessions
                    </p>

                    <div
                      style={{
                        marginTop: 25,
                      }}
                    >

                      <div className="status-row">
                        <span>
                          Auto-grading
                        </span>

                        <b>
                          Healthy
                        </b>
                      </div>

                      <div className="status-row">
                        <span>
                          Content delivery
                        </span>

                        <b>
                          Healthy
                        </b>
                      </div>

                      <div className="status-row">
                        <span>
                          Repository checks
                        </span>

                        <b>
                          Healthy
                        </b>
                      </div>

                    </div>

                  </aside>

                </div>

                <div className="lower">

                  <section className="card">

                    <h3>
                      Recent students
                    </h3>

                    <p className="sub">
                      Latest activity across the
                      platform.
                    </p>

                    <table className="table">

                      <thead>

                        <tr>
                          <th>Student</th>
                          <th>Current module</th>
                          <th>Progress</th>
                          <th>Status</th>
                        </tr>

                      </thead>

                      <tbody>

                        {recentStudents.map((s) => (
                          <tr key={s.name}>

                            <td>
                              <b>
                                {s.name}
                              </b>
                            </td>

                            <td>
                              {s.module}
                            </td>

                            <td>
                              {s.progress}
                            </td>

                            <td>

                              {s.status === "Active" ? (
                                <span className="pill">
                                  Active
                                </span>
                              ) : (
                                <span
                                  style={{
                                    fontSize: 11,
                                    color:
                                      "#9a6b1c",
                                  }}
                                >
                                  {s.status}
                                </span>
                              )}

                            </td>

                          </tr>
                        ))}

                      </tbody>

                    </table>

                  </section>

                  <aside className="card">

                    <h3>
                      To do
                    </h3>

                    <p className="sub">
                      Items requiring admin attention.
                    </p>

                    {todos.map((t) => {
  const isCompleted = completedTodos.includes(t.title);

  return (
    <div
      className={`todo ${
        isCompleted ? "completed" : ""
      }`}
      key={t.title}
      onClick={() => {
        if (isCompleted) {
          setCompletedTodos(
            completedTodos.filter(
              (item) => item !== t.title
            )
          );
        } else {
          setCompletedTodos([
            ...completedTodos,
            t.title,
          ]);
        }
      }}
    >

      <button
        className={`check ${
          isCompleted ? "checked" : ""
        }`}
        onClick={(event) => {
          event.stopPropagation();

          if (isCompleted) {
            setCompletedTodos(
              completedTodos.filter(
                (item) => item !== t.title
              )
            );
          } else {
            setCompletedTodos([
              ...completedTodos,
              t.title,
            ]);
          }
        }}
      >
        {isCompleted ? "✓" : ""}
      </button>

      <div>

        <b>
          {t.title}
        </b>

        <p className="sub">
          {t.sub}
        </p>

      </div>

    </div>
  );
})}

                  </aside>

                </div>

              </>
            )}

            {/* STUDENTS */}
            {activeTab === "Students" && (
              <section className="card">

                <h3>
                  Students
                </h3>

                <p className="sub">
                  Student activity and performance
                  will be displayed here.
                </p>

              </section>
            )}

            {/* LEARNING CONTENT */}
            {activeTab === "Learning content" && (
              <section className="card">

                <h3>
                  Learning content
                </h3>

                <p className="sub">
                  Modules, lessons and learning
                  materials will be displayed here.
                </p>

              </section>
            )}

            {/* MORE */}
            {activeTab === "More" && (
              <section className="card">

                <h3>
                  More
                </h3>

                <p className="sub">
                  Additional dashboard options will
                  be displayed here.
                </p>

              </section>
            )}

          </div>

    </AppLayout>
  );
}
