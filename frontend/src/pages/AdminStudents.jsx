import { useEffect, useRef, useState } from "react";
import AppLayout from "../layouts/AppLayout";
import { initialModules, initialStudents } from "../data/adminData";
import "./Admin.css";
import "./AdminModules.css";
import "./AdminStudents.css";

export default function AdminStudents() {
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("All");
  const [status, setStatus] = useState("All");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const detailsRef = useRef(null);
  const viewButtonRef = useRef(null);

  useEffect(() => {
    if (selectedStudent) detailsRef.current?.focus();
  }, [selectedStudent]);

  const visibleStudents = initialStudents.filter((student) => {
    const matchesSearch = `${student.name} ${student.email}`
      .toLowerCase()
      .includes(search.trim().toLowerCase());
    const matchesModule =
      moduleFilter === "All" || student.moduleId === Number(moduleFilter);
    return (
      matchesSearch &&
      matchesModule &&
      (status === "All" || student.status === status)
    );
  });

  function clearFilters() {
    setSearch("");
    setModuleFilter("All");
    setStatus("All");
  }

  return (
    <AppLayout>
      <header className="top dashboard-header">
        <div>
          <h1>Students</h1>
          <p>
            Monitor learning progress and identify students who need support.
          </p>
        </div>
      </header>
      <div className="content modules-page students-page">
        {selectedStudent && (
          <section
            className="card student-details"
            aria-labelledby="student-details-heading"
            ref={detailsRef}
            tabIndex={-1}
          >
            <div className="student-details-header">
              <div>
                <h2 id="student-details-heading">{selectedStudent.name}</h2>
                <p className="sub">{selectedStudent.email}</p>
              </div>
              <button
                className="btn"
                type="button"
                onClick={() => {
                  setSelectedStudent(null);
                  viewButtonRef.current?.focus();
                }}
              >
                Close details
              </button>
            </div>
            <div
              className={`student-note ${selectedStudent.status === "Needs support" ? "needs-support" : ""}`}
            >
              <strong>{selectedStudent.status}</strong>
              <p>{selectedStudent.note}</p>
            </div>
            <dl className="student-facts">
              <div>
                <dt>Current module</dt>
                <dd>
                  {
                    initialModules.find(
                      (module) => module.id === selectedStudent.moduleId,
                    )?.title
                  }
                </dd>
              </div>
              <div>
                <dt>Module progress</dt>
                <dd>{selectedStudent.progress}% complete</dd>
              </div>
              <div>
                <dt>Average quiz score</dt>
                <dd>
                  {selectedStudent.quizScore === null
                    ? "No attempts yet"
                    : `${selectedStudent.quizScore}%`}
                </dd>
              </div>
              <div>
                <dt>Practical tasks completed</dt>
                <dd>{selectedStudent.completedPracticals}</dd>
              </div>
              <div>
                <dt>GitHub connection</dt>
                <dd>
                  {selectedStudent.githubConnected
                    ? "Connected"
                    : "Not connected"}
                </dd>
              </div>
              <div>
                <dt>Last active</dt>
                <dd>{selectedStudent.lastActive}</dd>
              </div>
            </dl>
          </section>
        )}
        <section className="card" aria-labelledby="student-list-heading">
          <h2 id="student-list-heading">All students</h2>
          <p className="sub">
            {initialStudents.length} students ·{" "}
            {
              initialStudents.filter(
                (student) => student.status === "Needs support",
              ).length
            }{" "}
            needing support
          </p>
          <div className="module-toolbar">
            <div className="module-search">
              <label htmlFor="student-search">Search students</label>
              <input
                id="student-search"
                type="search"
                placeholder="Search by name or email"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <div>
              <label htmlFor="student-module-filter">Current module</label>
              <select
                id="student-module-filter"
                value={moduleFilter}
                onChange={(event) => setModuleFilter(event.target.value)}
              >
                <option value="All">All modules</option>
                {initialModules.map((module) => (
                  <option key={module.id} value={module.id}>
                    {module.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="student-status-filter">Status</label>
              <select
                id="student-status-filter"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                <option value="All">All statuses</option>
                <option>Active</option>
                <option>Needs support</option>
                <option>Inactive</option>
              </select>
            </div>
          </div>
          <table className="modules-table">
            <thead>
              <tr>
                <th scope="col">Student</th>
                <th scope="col">Current module</th>
                <th scope="col">Progress</th>
                <th scope="col">Last active</th>
                <th scope="col">Status</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleStudents.map((student) => (
                <tr
                  key={student.id}
                  className={
                    selectedStudent?.id === student.id ? "student-selected" : ""
                  }
                >
                  <td>
                    <div className="student-identity">
                      <span className="student-initials" aria-hidden="true">
                        {student.name
                          .split(" ")
                          .map((name) => name[0])
                          .join("")}
                      </span>
                      <div>
                        <strong>{student.name}</strong>
                        <p>{student.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    {
                      initialModules.find(
                        (module) => module.id === student.moduleId,
                      )?.title
                    }
                  </td>
                  <td>
                    <div className="student-progress">
                      <progress
                        value={student.progress}
                        max="100"
                        aria-label={`${student.name}'s module progress`}
                      />
                      <span>{student.progress}%</span>
                    </div>
                  </td>
                  <td>{student.lastActive}</td>
                  <td>
                    <span
                      className={`module-status ${student.status === "Active" ? "published" : student.status === "Needs support" ? "draft" : "student-inactive"}`}
                    >
                      {student.status}
                    </span>
                  </td>
                  <td>
                    <button
                      className="module-edit"
                      type="button"
                      aria-label={`View ${student.name}`}
                      onClick={(event) => {
                        viewButtonRef.current = event.currentTarget;
                        setSelectedStudent(student);
                        if (selectedStudent?.id === student.id)
                          detailsRef.current?.focus();
                      }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {visibleStudents.length === 0 && (
            <div className="modules-empty">
              <h3>No students found</h3>
              <p>Try a different search, module or status.</p>
              <button className="btn" type="button" onClick={clearFilters}>
                Clear filters
              </button>
            </div>
          )}
          <p className="module-result-count" role="status">
            Showing {visibleStudents.length} of {initialStudents.length}{" "}
            students
          </p>
        </section>
      </div>
    </AppLayout>
  );
}
