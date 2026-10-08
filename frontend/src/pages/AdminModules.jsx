import { useEffect, useState } from "react";
import AppLayout from "../layouts/AppLayout";
import {
  createModule,
  getAdminModules,
  updateModule,
} from "../utils/adminApi";
import "./Admin.css";
import "./AdminModules.css";

// Converts a module from the API into the shape this page displays.
function toModuleRow(module) {
  return {
    id: module.moduleId,
    title: module.title,
    description: module.description ?? "",
    level: module.level,
    status: module.status,
    lessons: module.lessonCount,
    students: module.studentCount,
  };
}

export default function AdminModules() {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [editingModule, setEditingModule] = useState(null);
  const [message, setMessage] = useState("");

  // Load every module (drafts included) from the database when the page opens.
  useEffect(() => {
    let cancelled = false;

    getAdminModules()
      .then((data) => {
        if (!cancelled) setModules(data.map(toModuleRow));
      })
      .catch((error) => {
        if (!cancelled) setMessage(`Could not load modules: ${error.message}`);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const publishedCount = modules.filter(
    (module) => module.status === "Published",
  ).length;
  const draftCount = modules.length - publishedCount;

  const visibleModules = modules.filter((module) => {
    const matchesSearch = `${module.title} ${module.description}`
      .toLowerCase()
      .includes(search.trim().toLowerCase());
    return matchesSearch && (status === "All" || module.status === status);
  });

  async function saveModule(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = form.get("title").trim();
    const description = form.get("description").trim();
    if (!title || !description) {
      setMessage("Enter a module title and description.");
      return;
    }

    const details = {
      title,
      description,
      level: form.get("level"),
      status: form.get("status"),
    };

    setSaving(true);
    setMessage("");
    try {
      if (editingModule.id) {
        const updated = toModuleRow(
          await updateModule(editingModule.id, details),
        );
        setModules((current) =>
          current.map((module) =>
            module.id === updated.id ? updated : module,
          ),
        );
      } else {
        const created = toModuleRow(await createModule(details));
        setModules((current) => [...current, created]);
      }
      setSearch("");
      setStatus("All");
      setEditingModule(null);
      setMessage(`${title} saved.`);
    } catch (error) {
      // Keep the form open so the admin can fix the problem and try again.
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppLayout>
      <header className="top dashboard-header modules-header">
        <div>
          <h1>Modules</h1>
          <p>Organise learning content and manage module availability.</p>
        </div>
        <button
          className="btn blue"
          type="button"
          disabled={!!editingModule || loading}
          onClick={() => {
            setMessage("");
            setEditingModule({
              title: "",
              description: "",
              level: "Beginner",
              status: "Draft",
              lessons: 0,
              students: 0,
            });
          }}
        >
          Create module
        </button>
      </header>

      <div className="content modules-page">
        <p className="modules-message" role="status">
          {loading ? "Loading modules..." : !editingModule && message}
        </p>
        {editingModule && (
          <section
            className="card module-editor"
            aria-labelledby="module-editor-heading"
          >
            <h2 id="module-editor-heading">
              {editingModule.id ? "Edit module" : "Create module"}
            </h2>
            <p className="sub">Changes are saved to the database.</p>
            <form key={editingModule.id ?? "new"} onSubmit={saveModule}>
              <label htmlFor="module-title">Module title</label>
              <input
                id="module-title"
                name="title"
                required
                minLength={3}
                maxLength={100}
                defaultValue={editingModule.title}
                autoFocus
              />
              <label htmlFor="module-description">Description</label>
              <textarea
                id="module-description"
                name="description"
                required
                maxLength={500}
                rows={3}
                defaultValue={editingModule.description}
              />
              <div className="module-form-row">
                <div>
                  <label htmlFor="module-level">Level</label>
                  <select
                    id="module-level"
                    name="level"
                    defaultValue={editingModule.level}
                  >
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="module-status">Status</label>
                  <select
                    id="module-status"
                    name="status"
                    defaultValue={editingModule.status}
                  >
                    <option>Draft</option>
                    <option disabled={!editingModule.lessons}>Published</option>
                  </select>
                  {!editingModule.lessons && (
                    <p className="sub">Add lessons before publishing.</p>
                  )}
                </div>
              </div>
              <p className="modules-message" role="status">
                {message}
              </p>
              <div className="module-form-actions">
                <button className="btn blue" type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save module"}
                </button>
                <button
                  className="btn"
                  type="button"
                  disabled={saving}
                  onClick={() => {
                    setEditingModule(null);
                    setMessage("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        <section
          className="card module-list"
          aria-labelledby="module-list-heading"
        >
          <h2 id="module-list-heading">All modules</h2>
          <p className="sub">
            {modules.length} modules · {publishedCount} published · {draftCount}{" "}
            drafts
          </p>
          <div className="module-toolbar">
            <div className="module-search">
              <label htmlFor="module-search">Search modules</label>
              <input
                id="module-search"
                type="search"
                placeholder="Search by title or description"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <div>
              <label htmlFor="module-filter">Status</label>
              <select
                id="module-filter"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                <option value="All">All statuses</option>
                <option>Published</option>
                <option>Draft</option>
              </select>
            </div>
          </div>
          <table className="modules-table">
            <thead>
              <tr>
                <th scope="col">Module</th>
                <th scope="col">Level</th>
                <th scope="col">Lessons</th>
                <th scope="col">Students</th>
                <th scope="col">Status</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleModules.map((module) => (
                <tr key={module.id}>
                  <td>
                    <strong>{module.title}</strong>
                    <p>{module.description}</p>
                  </td>
                  <td>{module.level}</td>
                  <td>{module.lessons}</td>
                  <td>{module.students}</td>
                  <td>
                    <span
                      className={`module-status ${module.status === "Published" ? "published" : "draft"}`}
                    >
                      {module.status}
                    </span>
                  </td>
                  <td>
                    <button
                      className="module-edit"
                      type="button"
                      disabled={!!editingModule}
                      aria-label={`Edit ${module.title}`}
                      onClick={() => {
                        setEditingModule(module);
                        setMessage("");
                      }}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && visibleModules.length === 0 && (
            <div className="modules-empty">
              <h3>No modules found</h3>
              <p>Try a different search or status.</p>
              <button
                className="btn"
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatus("All");
                }}
              >
                Clear filters
              </button>
            </div>
          )}
          <p className="module-result-count" role="status">
            Showing {visibleModules.length} of {modules.length} modules
          </p>
        </section>
      </div>
    </AppLayout>
  );
}