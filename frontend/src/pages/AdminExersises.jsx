import { useCallback, useEffect, useState } from "react";
import AppLayout from "../layouts/AppLayout";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import { apiFetch } from "../utils/apiClient";
import { getAdminModules } from "../utils/adminApi";
import "./Admin.css";
import "./AdminModules.css";
import "./AdminExersises.css";

const emptyExercise = (moduleId = "") => ({
  moduleId,
  title: "",
  description: "",
  outcomes: "",
  // Existing Exercise DTO requires a VerificationType enum.
  // 0 is the default; change this if your backend uses a different value.
  verificationType: 0,
});

const mapExercise = (exercise) => ({
  id: exercise.exerciseId,
  moduleId: exercise.moduleId,
  title: exercise.title ?? "",
  description: exercise.description ?? "",
  outcomes: exercise.outcomes ?? "",
  verificationType: exercise.verificationType ?? 0,
});

export default function AdminExersises({ readOnly = false }) {
  const [modules, setModules] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [editingExercise, setEditingExercise] = useState(null);
  const [exerciseToDelete, setExerciseToDelete] = useState(null);
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("All");
  const [message, setMessage] = useState("");

  const cancelDelete = useCallback(() => setExerciseToDelete(null), []);

  const loadExercises = useCallback(async () => {
    const rows = await apiFetch("/api/exercises");
    // Listing is intentionally lightweight; fetch each record so Description
    // and Outcomes are available when the user clicks Edit.
    const details = await Promise.all(
      rows.map(async (row) => {
        const record = await apiFetch(`/api/exercises/${row.exerciseId}`);
        return mapExercise(record);
      }),
    );
    return details;
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getAdminModules(), loadExercises()])
      .then(([moduleData, exerciseData]) => {
        if (cancelled) return;
        setModules(moduleData.map((m) => ({ id: m.moduleId, title: m.title })));
        setExercises(exerciseData);
      })
      .catch((error) => {
        if (!cancelled) setMessage(`Could not load exercises: ${error.message}`);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [loadExercises]);

  const visibleExercises = exercises.filter((exercise) => {
    const term = search.trim().toLowerCase();
    const matchesText = !term || `${exercise.title} ${exercise.description}`.toLowerCase().includes(term);
    const matchesModule = moduleFilter === "All" || exercise.moduleId === moduleFilter;
    return matchesText && matchesModule;
  });

  const startCreate = () => {
    if (!modules.length) return;
    setMessage("");
    setEditingExercise(emptyExercise(moduleFilter === "All" ? modules[0].id : moduleFilter));
  };

  const startEdit = (exercise) => {
    setMessage("");
    setEditingExercise({ ...exercise });
  };

  async function saveExercise(event) {
    event.preventDefault();
    if (!editingExercise) return;
    const title = editingExercise.title.trim();
    const description = editingExercise.description.trim();
    const outcomes = editingExercise.outcomes.trim();
    if (title.length < 3 || !editingExercise.moduleId) {
      setMessage("Choose a module and enter a title of at least 3 characters.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const payload = {
        title,
        description,
        outcomes,
        verificationType: editingExercise.verificationType,
        ...(editingExercise.id ? {} : { moduleId: editingExercise.moduleId }),
      };
      const result = editingExercise.id
        ? await apiFetch(`/api/exercises/${editingExercise.id}`, {
            method: "PUT", body: JSON.stringify(payload),
          })
        : await apiFetch("/api/exercises", {
            method: "POST", body: JSON.stringify(payload),
          });
      const saved = mapExercise(result);
      setExercises((current) => editingExercise.id
        ? current.map((exercise) => exercise.id === saved.id ? saved : exercise)
        : [...current, saved]);
      setEditingExercise(null);
      setMessage(`"${saved.title}" saved.`);
    } catch (error) {
      setMessage(`Could not save exercise: ${error.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function deleteExercise(exercise) {
    if (!exercise || deletingId) return;
    setDeletingId(exercise.id);
    setMessage("");
    try {
      await apiFetch(`/api/exercises/${exercise.id}`, { method: "DELETE" });
      setExercises((current) => current.filter((item) => item.id !== exercise.id));
      setMessage(`"${exercise.title}" deleted.`);
      setExerciseToDelete(null);
    } catch (error) {
      setMessage(`Could not delete exercise: ${error.message}`);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <AppLayout>
      <header className="top dashboard-header modules-header">
        <div>
          <h1>Practical exercises</h1>
          <p>Create and manage practical work for your courses.</p>
        </div>
        {!readOnly && (
          <button className="btn blue" type="button"
            disabled={loading || !modules.length || !!editingExercise}
            onClick={startCreate}>
            Create exercise
          </button>
        )}
      </header>

      <div className="content modules-page admin-exercises-page">
        {!editingExercise && <p className="modules-message" role="status">{loading ? "Loading exercises..." : message}</p>}
        {!loading && modules.length === 0 && <p className="sub">Create a module before adding practical exercises.</p>}

        {!readOnly && editingExercise && (
          <section className="card module-editor admin-exercises-editor" aria-labelledby="exercise-editor-heading">
            <h2 id="exercise-editor-heading">{editingExercise.id ? "Edit practical exercise" : "Create practical exercise"}</h2>
            <p className="sub">Add instructions and learning outcomes for students.</p>
            <form onSubmit={saveExercise}>
              <label htmlFor="exercise-title">Exercise title</label>
              <input id="exercise-title" required minLength={3} maxLength={200} autoFocus
                value={editingExercise.title}
                onChange={(event) => setEditingExercise((current) => ({ ...current, title: event.target.value }))}
                placeholder="e.g. Build a Git branching workflow" />

              <label htmlFor="exercise-module">Module</label>
              <select id="exercise-module" required value={editingExercise.moduleId}
                disabled={!!editingExercise.id}
                onChange={(event) => setEditingExercise((current) => ({ ...current, moduleId: event.target.value }))}>
                {modules.map((module) => <option key={module.id} value={module.id}>{module.title}</option>)}
              </select>
              {!!editingExercise.id && <p className="sub">The module assignment cannot be changed by the current update API.</p>}

              <label htmlFor="exercise-description">Exercise instructions</label>
              <textarea id="exercise-description" rows={6} maxLength={2000}
                value={editingExercise.description}
                onChange={(event) => setEditingExercise((current) => ({ ...current, description: event.target.value }))}
                placeholder="Instruction 1 # Instruction 2 # Instruction 3" />

              <label htmlFor="exercise-outcomes">Learning outcomes</label>
              <textarea id="exercise-outcomes" rows={4}
                value={editingExercise.outcomes}
                onChange={(event) => setEditingExercise((current) => ({ ...current, outcomes: event.target.value }))}
                placeholder="Outcome one # Outcome two # Outcome three" />
              <p className="sub">Separate learning outcomes using #, matching the student exercises page.</p>

              <p className="modules-message" role="status">{message}</p>
              <div className="module-form-actions">
                <button className="btn blue" type="submit" disabled={saving}>{saving ? "Saving..." : "Save exercise"}</button>
                <button className="btn" type="button" disabled={saving}
                  onClick={() => { setEditingExercise(null); setMessage(""); }}>Cancel</button>
              </div>
            </form>
          </section>
        )}

        <section className="card module-list" aria-labelledby="exercise-list-heading">
          <h2 id="exercise-list-heading">All practical exercises</h2>
          <p className="sub">{exercises.length} exercises</p>
          <div className="module-toolbar">
            <div className="module-search">
              <label htmlFor="exercise-search">Search exercises</label>
              <input id="exercise-search" type="search" placeholder="Search by title or instructions"
                value={search} onChange={(event) => setSearch(event.target.value)} />
            </div>
            <div>
              <label htmlFor="exercise-module-filter">Module</label>
              <select id="exercise-module-filter" value={moduleFilter}
                onChange={(event) => setModuleFilter(event.target.value)}>
                <option value="All">All modules</option>
                {modules.map((module) => <option key={module.id} value={module.id}>{module.title}</option>)}
              </select>
            </div>
          </div>

          <div className="admin-exercises-table-scroll">
            <table className="modules-table admin-exercises-table">
              <thead><tr><th scope="col">Exercise</th><th scope="col">Module</th>{!readOnly && <th scope="col">Action</th>}</tr></thead>
              <tbody>
                {visibleExercises.map((exercise) => (
                  <tr key={exercise.id}>
                    <td><strong>{exercise.title}</strong><p>{exercise.description || "No instructions added."}</p></td>
                    <td>{modules.find((module) => module.id === exercise.moduleId)?.title ?? "Unknown module"}</td>
                    {!readOnly && <td className="admin-exercises-actions">
                      <button className="module-edit" type="button" disabled={!!editingExercise || !!deletingId}
                        onClick={() => startEdit(exercise)}>Edit</button>
                      <button className="module-edit assessment-danger" type="button"
                        disabled={!!editingExercise || !!deletingId}
                        onClick={() => setExerciseToDelete(exercise)}>Delete</button>
                    </td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!loading && visibleExercises.length === 0 && (
            <div className="modules-empty"><h3>No exercises found</h3><p>Try a different search or module.</p>
              <button className="btn" type="button" onClick={() => { setSearch(""); setModuleFilter("All"); }}>Clear filters</button></div>
          )}
          <p className="module-result-count">Showing {visibleExercises.length} of {exercises.length} exercises</p>
        </section>
      </div>

      <ConfirmDeleteModal
        open={!!exerciseToDelete}
        title="Delete this exercise?"
        message={`"${exerciseToDelete?.title ?? ""}" will be permanently deleted. This can't be undone.`}
        confirmText="Delete"
        loading={deletingId !== null}
        onCancel={cancelDelete}
        onConfirm={() => deleteExercise(exerciseToDelete)}
      />
    </AppLayout>
  );
}
