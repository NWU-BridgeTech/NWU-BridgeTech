import { useState } from "react";
import AppLayout from "../layouts/AppLayout";
import { initialLessons, initialModules } from "../data/adminData";
import "./Admin.css";
import "./AdminModules.css";

export default function AdminLessons() {
  const [lessons, setLessons] = useState(initialLessons);
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("All");
  const [status, setStatus] = useState("All");
  const [editingLesson, setEditingLesson] = useState(null);
  const [message, setMessage] = useState("");

  const visibleLessons = lessons.filter((lesson) => {
    const matchesSearch = `${lesson.title} ${lesson.description}`
      .toLowerCase()
      .includes(search.trim().toLowerCase());
    const matchesModule =
      moduleFilter === "All" || lesson.moduleId === Number(moduleFilter);
    return (
      matchesSearch &&
      matchesModule &&
      (status === "All" || lesson.status === status)
    );
  });

  function clearFilters() {
    setSearch("");
    setModuleFilter("All");
    setStatus("All");
  }

  function saveLesson(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = form.get("title").trim();
    const description = form.get("description").trim();
    const content = form.get("content").trim();
    const lessonStatus = form.get("status");
    const moduleId = Number(form.get("moduleId"));
    const parentModule = initialModules.find(
      (module) => module.id === moduleId,
    );
    if (!title || !description) {
      setMessage("Enter a lesson title and description.");
      return;
    }
    if (
      lessonStatus === "Published" &&
      (!content || parentModule.status !== "Published")
    ) {
      setMessage(
        "Add lesson content and choose a published module before publishing.",
      );
      return;
    }
    const savedLesson = {
      ...editingLesson,
      id: editingLesson.id ?? Date.now(),
      title,
      description,
      content,
      moduleId,
      duration: Number(form.get("duration")),
      status: lessonStatus,
    };
    if (editingLesson.id) {
      setLessons(
        lessons.map((lesson) =>
          lesson.id === savedLesson.id ? savedLesson : lesson,
        ),
      );
    } else {
      setLessons([...lessons, savedLesson]);
    }
    clearFilters();
    setEditingLesson(null);
    setMessage(
      `${title} saved. Changes reset when you leave this page or reload.`,
    );
  }

  return (
    <AppLayout>
      <header className="top dashboard-header modules-header">
        <div>
          <h1>Lessons</h1>
          <p>Create lesson content and organise it by module.</p>
        </div>
        <button
          className="btn blue"
          type="button"
          disabled={!!editingLesson}
          onClick={() => {
            setMessage("");
            setEditingLesson({
              title: "",
              description: "",
              content: "",
              moduleId:
                moduleFilter === "All"
                  ? initialModules[0].id
                  : Number(moduleFilter),
              duration: 20,
              status: "Draft",
            });
          }}
        >
          Create lesson
        </button>
      </header>
      <div className="content modules-page">
        <p className="modules-message" role="status">
          {message}
        </p>
        {editingLesson && (
          <section
            className="card module-editor"
            aria-labelledby="lesson-editor-heading"
          >
            <h2 id="lesson-editor-heading">
              {editingLesson.id ? "Edit lesson" : "Create lesson"}
            </h2>
            <p className="sub">Changes are kept while this page is open.</p>
            <form key={editingLesson.id ?? "new"} onSubmit={saveLesson}>
              <label htmlFor="lesson-title">Lesson title</label>
              <input
                id="lesson-title"
                name="title"
                required
                maxLength={100}
                defaultValue={editingLesson.title}
                autoFocus
              />
              <label htmlFor="lesson-description">Short description</label>
              <textarea
                id="lesson-description"
                name="description"
                required
                maxLength={500}
                rows={2}
                defaultValue={editingLesson.description}
              />
              <div className="module-form-row">
                <div>
                  <label htmlFor="lesson-module">Module</label>
                  <select
                    id="lesson-module"
                    name="moduleId"
                    defaultValue={editingLesson.moduleId}
                  >
                    {initialModules.map((module) => (
                      <option key={module.id} value={module.id}>
                        {module.title}
                        {module.status === "Draft" ? " (Draft)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="lesson-duration">Duration (minutes)</label>
                  <input
                    id="lesson-duration"
                    name="duration"
                    type="number"
                    min="1"
                    max="600"
                    step="1"
                    required
                    defaultValue={editingLesson.duration}
                  />
                </div>
              </div>
              <label htmlFor="lesson-content">Lesson content</label>
              <textarea
                id="lesson-content"
                name="content"
                rows={7}
                maxLength={20000}
                defaultValue={editingLesson.content}
                placeholder="Write the lesson instructions and learning material here."
              />
              <label htmlFor="lesson-status">Status</label>
              <select
                id="lesson-status"
                name="status"
                defaultValue={editingLesson.status}
              >
                <option>Draft</option>
                <option>Published</option>
              </select>
              <p className="sub">
                Publishing requires lesson content and a published module.
              </p>
              <div className="module-form-actions">
                <button className="btn blue" type="submit">
                  Save lesson
                </button>
                <button
                  className="btn"
                  type="button"
                  onClick={() => {
                    setEditingLesson(null);
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
          aria-labelledby="lesson-list-heading"
        >
          <h2 id="lesson-list-heading">All lessons</h2>
          <p className="sub">
            {lessons.length} lessons ·{" "}
            {lessons.filter((lesson) => lesson.status === "Published").length}{" "}
            published ·{" "}
            {lessons.filter((lesson) => lesson.status === "Draft").length}{" "}
            drafts
          </p>
          <div className="module-toolbar">
            <div className="module-search">
              <label htmlFor="lesson-search">Search lessons</label>
              <input
                id="lesson-search"
                type="search"
                placeholder="Search by title or description"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <div>
              <label htmlFor="lesson-module-filter">Module</label>
              <select
                id="lesson-module-filter"
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
              <label htmlFor="lesson-status-filter">Status</label>
              <select
                id="lesson-status-filter"
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
                <th scope="col">Lesson</th>
                <th scope="col">Module</th>
                <th scope="col">Duration</th>
                <th scope="col">Status</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleLessons.map((lesson) => (
                <tr key={lesson.id}>
                  <td>
                    <strong>{lesson.title}</strong>
                    <p>{lesson.description}</p>
                  </td>
                  <td>
                    {
                      initialModules.find(
                        (module) => module.id === lesson.moduleId,
                      )?.title
                    }
                  </td>
                  <td>{lesson.duration} min</td>
                  <td>
                    <span
                      className={`module-status ${lesson.status === "Published" ? "published" : "draft"}`}
                    >
                      {lesson.status}
                    </span>
                  </td>
                  <td>
                    <button
                      className="module-edit"
                      type="button"
                      disabled={!!editingLesson}
                      aria-label={`Edit ${lesson.title}`}
                      onClick={() => {
                        setEditingLesson(lesson);
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
          {visibleLessons.length === 0 && (
            <div className="modules-empty">
              <h3>No lessons found</h3>
              <p>Try a different search, module or status.</p>
              <button className="btn" type="button" onClick={clearFilters}>
                Clear filters
              </button>
            </div>
          )}
          <p className="module-result-count" role="status">
            Showing {visibleLessons.length} of {lessons.length} lessons
          </p>
        </section>
      </div>
    </AppLayout>
  );
}
