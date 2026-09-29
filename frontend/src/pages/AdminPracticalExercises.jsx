import { useState } from "react";
import AppLayout from "../layouts/AppLayout";
import { initialExercises, initialModules } from "../data/adminData";
import "./Admin.css";
import "./AdminModules.css";

export default function AdminPracticalExercises() {
  const [exercises, setExercises] = useState(initialExercises);
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("All");
  const [status, setStatus] = useState("All");
  const [editingExercise, setEditingExercise] = useState(null);
  const [message, setMessage] = useState("");

  const publishedCount = exercises.filter(
    (exercise) => exercise.status === "Published",
  ).length;
  const draftCount = exercises.length - publishedCount;

  const visibleExercises = exercises.filter((exercise) => {
    const matchesSearch = `${exercise.title} ${exercise.description}`
      .toLowerCase()
      .includes(search.trim().toLowerCase());
    const matchesModule =
      moduleFilter === "All" || exercise.moduleId === Number(moduleFilter);
    return (
      matchesSearch &&
      matchesModule &&
      (status === "All" || exercise.status === status)
    );
  });

  function clearFilters() {
    setSearch("");
    setModuleFilter("All");
    setStatus("All");
  }

  function saveExercise(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = form.get("title").trim();
    const description = form.get("description").trim();
    const instructions = form.get("instructions").trim();
    const requirements = form.get("requirements").trim();
    const exerciseStatus = form.get("status");
    const moduleId = Number(form.get("moduleId"));
    const parentModule = initialModules.find(
      (module) => module.id === moduleId,
    );
    if (!title || !description) {
      setMessage("Enter an exercise title and description.");
      return;
    }
    if (
      exerciseStatus === "Published" &&
      (!instructions || !requirements || parentModule.status !== "Published")
    ) {
      setMessage(
        "Add instructions and review criteria, and choose a published module before publishing.",
      );
      return;
    }
    const savedExercise = {
      ...editingExercise,
      id: editingExercise.id ?? Date.now(),
      title,
      description,
      instructions,
      requirements,
      moduleId,
      duration: Number(form.get("duration")),
      status: exerciseStatus,
    };
    if (editingExercise.id) {
      setExercises(
        exercises.map((exercise) =>
          exercise.id === savedExercise.id ? savedExercise : exercise,
        ),
      );
    } else {
      setExercises([...exercises, savedExercise]);
    }
    clearFilters();
    setEditingExercise(null);
    setMessage(
      `${title} saved. Changes reset when you leave this page or reload.`,
    );
  }

  return (
    <AppLayout>
      <header className="top dashboard-header modules-header">
        <div>
          <h1>Practical exercises</h1>
          <p>
            Manage hands-on tasks, submission instructions and review criteria.
          </p>
        </div>
        <button
          className="btn blue"
          type="button"
          disabled={!!editingExercise}
          onClick={() => {
            setMessage("");
            setEditingExercise({
              title: "",
              description: "",
              instructions: "",
              requirements: "",
              pendingReviews: 0,
              moduleId:
                moduleFilter === "All"
                  ? initialModules[0].id
                  : Number(moduleFilter),
              duration: 60,
              status: "Draft",
            });
          }}
        >
          Create exercise
        </button>
      </header>
      <div className="content modules-page">
        <p className="modules-message" role="status">
          {!editingExercise && message}
        </p>
        {editingExercise && (
          <section
            className="card module-editor"
            aria-labelledby="exercise-editor-heading"
          >
            <h2 id="exercise-editor-heading">
              {editingExercise.id ? "Edit exercise" : "Create exercise"}
            </h2>
            <p className="sub">Changes are kept while this page is open.</p>
            <form key={editingExercise.id ?? "new"} onSubmit={saveExercise}>
              <label htmlFor="exercise-title">Exercise title</label>
              <input
                id="exercise-title"
                name="title"
                required
                maxLength={100}
                defaultValue={editingExercise.title}
                autoFocus
              />
              <label htmlFor="exercise-description">Short description</label>
              <textarea
                id="exercise-description"
                name="description"
                required
                maxLength={500}
                rows={2}
                defaultValue={editingExercise.description}
              />
              <div className="module-form-row">
                <div>
                  <label htmlFor="exercise-module">Module</label>
                  <select
                    id="exercise-module"
                    name="moduleId"
                    defaultValue={editingExercise.moduleId}
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
                  <label htmlFor="exercise-duration">
                    Estimated time (minutes)
                  </label>
                  <input
                    id="exercise-duration"
                    name="duration"
                    type="number"
                    min="1"
                    max="600"
                    step="1"
                    required
                    defaultValue={editingExercise.duration}
                  />
                </div>
              </div>
              <label htmlFor="exercise-instructions">
                Submission instructions
              </label>
              <textarea
                id="exercise-instructions"
                name="instructions"
                rows={5}
                maxLength={10000}
                defaultValue={editingExercise.instructions}
                placeholder="Describe the task and which GitHub repository or pull request link students should submit."
              />
              <label htmlFor="exercise-requirements">Review criteria</label>
              <textarea
                id="exercise-requirements"
                name="requirements"
                rows={4}
                maxLength={5000}
                defaultValue={editingExercise.requirements}
                placeholder="List what a successful submission must include, one requirement per line."
              />
              <label htmlFor="exercise-status">Status</label>
              <select
                id="exercise-status"
                name="status"
                defaultValue={editingExercise.status}
              >
                <option>Draft</option>
                <option>Published</option>
              </select>
              <p className="sub">
                Drafts can be saved before they are complete. Publishing
                requires instructions, review criteria and a published module.
              </p>
              <p className="modules-message" role="status">
                {message}
              </p>
              <div className="module-form-actions">
                <button className="btn blue" type="submit">
                  Save exercise
                </button>
                <button
                  className="btn"
                  type="button"
                  onClick={() => {
                    setEditingExercise(null);
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
          aria-labelledby="exercise-list-heading"
        >
          <h2 id="exercise-list-heading">All exercises</h2>
          <p className="sub">
            {exercises.length} exercises · {publishedCount} published ·{" "}
            {draftCount} drafts
          </p>
          <div className="module-toolbar">
            <div className="module-search">
              <label htmlFor="exercise-search">Search exercises</label>
              <input
                id="exercise-search"
                type="search"
                placeholder="Search by title or description"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <div>
              <label htmlFor="exercise-module-filter">Module</label>
              <select
                id="exercise-module-filter"
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
              <label htmlFor="exercise-status-filter">Status</label>
              <select
                id="exercise-status-filter"
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
                <th scope="col">Exercise</th>
                <th scope="col">Module</th>
                <th scope="col">Estimated time</th>
                <th scope="col">To review</th>
                <th scope="col">Status</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleExercises.map((exercise) => (
                <tr key={exercise.id}>
                  <td>
                    <strong>{exercise.title}</strong>
                    <p>{exercise.description}</p>
                  </td>
                  <td>
                    {
                      initialModules.find(
                        (module) => module.id === exercise.moduleId,
                      )?.title
                    }
                  </td>
                  <td>{exercise.duration} min</td>
                  <td>
                    {exercise.pendingReviews > 0 ? (
                      <span className="module-status draft">
                        {exercise.pendingReviews} pending
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    <span
                      className={`module-status ${exercise.status === "Published" ? "published" : "draft"}`}
                    >
                      {exercise.status}
                    </span>
                  </td>
                  <td>
                    <button
                      className="module-edit"
                      type="button"
                      disabled={!!editingExercise}
                      aria-label={`Edit ${exercise.title}`}
                      onClick={() => {
                        setEditingExercise(exercise);
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
          {visibleExercises.length === 0 && (
            <div className="modules-empty">
              <h3>No exercises found</h3>
              <p>Try a different search, module or status.</p>
              <button className="btn" type="button" onClick={clearFilters}>
                Clear filters
              </button>
            </div>
          )}
          <p className="module-result-count" role="status">
            Showing {visibleExercises.length} of {exercises.length} exercises
          </p>
        </section>
      </div>
    </AppLayout>
  );
}
