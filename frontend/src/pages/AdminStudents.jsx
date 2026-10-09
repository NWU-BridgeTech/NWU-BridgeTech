import { useEffect, useRef, useState } from "react";
import AppLayout from "../layouts/AppLayout";
import "./Admin.css";
import "./AdminModules.css";
import "./AdminStudents.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5174";

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || `Request failed (${response.status}).`);
  }
  return response.status === 204 ? null : response.json();
}

async function loadAllStudents() {
  const pageSize = 200;
  const firstPage = await apiRequest(
    `/api/admin/students?page=1&pageSize=${pageSize}`,
  );
  const items = firstPage.items ?? firstPage.Items ?? [];
  const totalStudents = firstPage.totalStudents ?? firstPage.TotalStudents ?? items.length;
  const pages = Math.ceil(totalStudents / pageSize);

  if (pages <= 1) return items;

  const remainingPages = await Promise.all(
    Array.from({ length: pages - 1 }, (_, index) =>
      apiRequest(`/api/admin/students?page=${index + 2}&pageSize=${pageSize}`),
    ),
  );
  return items.concat(
    ...remainingPages.map((page) => page.items ?? page.Items ?? []),
  );
}

export default function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("All");
  const [status, setStatus] = useState("All");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const detailsRef = useRef(null);
  const viewButtonRef = useRef(null);

  useEffect(() => {
    if (selectedStudent) detailsRef.current?.focus();
  }, [selectedStudent]);

  useEffect(() => {
    loadAllStudents()
      .then((loadedStudents) => setStudents(loadedStudents))
      .catch((error) => setMessage(`Could not load students: ${error.message}`))
      .finally(() => setLoading(false));

    apiRequest("/api/modules/admin")
      .then((moduleResponse) => setModules(moduleResponse ?? []))
      .catch(() => {
        // Module labels are optional; student data should remain visible if this request fails.
      });
  }, []);

  const visibleStudents = students.filter((student) => {
    const matchesSearch = `${student.name} ${student.email}`
      .toLowerCase()
      .includes(search.trim().toLowerCase());
    const matchesModule =
      moduleFilter === "All" || student.moduleId === moduleFilter;
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

  async function deleteStudent(student) {
    if (!window.confirm(`Delete ${student.name}'s account? This cannot be undone.`)) return;
    try {
      await apiRequest(`/api/admin/students/${student.id}`, { method: "DELETE" });
      setStudents((current) => current.filter((item) => item.id !== student.id));
      setSelectedStudent(null);
      setMessage(`${student.name} was deleted.`);
    } catch (error) {
      setMessage(`Could not delete student: ${error.message}`);
    }
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
        <p className="modules-message" role="status">
          {loading ? "Loading students..." : message}
        </p>
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
              <button
                className="btn danger"
                type="button"
                onClick={() => deleteStudent(selectedStudent)}
              >
                Delete student
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
                  {selectedStudent.moduleTitle || "Not enrolled"}
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
            {students.length} students ·{" "}
            {
              students.filter(
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
                {modules.map((module) => (
                  <option key={module.moduleId} value={module.moduleId}>
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
                    {student.moduleTitle || "Not enrolled"}
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
                    <button
                      className="module-edit danger-text"
                      type="button"
                      onClick={() => deleteStudent(student)}
                    >
                      Delete
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
            Showing {visibleStudents.length} of {students.length}{" "}
            students
          </p>
        </section>
      </div>
    </AppLayout>
  );
}
