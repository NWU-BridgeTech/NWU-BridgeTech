
import { useCallback, useEffect, useState } from "react";
import AppLayout from "../layouts/AppLayout";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import { apiFetch } from "../utils/apiClient";
import {
  createLesson,
  getAdminLessons,
  getAdminModules,
  updateLesson,
} from "../utils/adminApi";
import "./Admin.css";
import "./AdminModules.css";

// Converts a module from the API into the shape this page uses.
function toModuleOption(module) {
  return {
    id: module.moduleId,
    title: module.title,
    status: module.status,
  };
}

// Converts a lesson from the API into the shape this page displays.

  function toLessonRow(lesson) {
    return {
      id: lesson.lessonId,
      moduleId: lesson.moduleId,
      title: lesson.title,
      description: lesson.description ?? "",
      content: lesson.content ?? "",
      videoUrl: lesson.videoUrl ?? "",
      duration: lesson.durationMinutes,
      status: lesson.status,
    };
  }


// Same source the other admin pages use for the signed-in user.
function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}


async function saveLessonVideoUrl(lessonId, videoUrl) {
  return apiFetch(`/api/lessons/${lessonId}/video-url`, {
    method: "PUT",
    body: JSON.stringify({ videoUrl }),
  });
}


export default function AdminLessons({ readOnly = false }) {
  // Admins and instructors can create and edit lessons; everyone else is read-only.
  const canManage = !readOnly || getCurrentUser()?.role === "Instructor";
  const [modules, setModules] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("All");
  const [status, setStatus] = useState("All");
  const [editingLesson, setEditingLesson] = useState(null);
  const [message, setMessage] = useState("");
  // Holds a lesson that is waiting for the "Publish" confirmation.
  const [pendingPublish, setPendingPublish] = useState(null);

  const cancelPublish = useCallback(() => setPendingPublish(null), []);

  // Holds a lesson that is waiting for the "Delete" confirmation.
  const [lessonToDelete, setLessonToDelete] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const cancelDelete = useCallback(() => setLessonToDelete(null), []);

  // Load every module and lesson (drafts included) when the page opens.
  useEffect(() => {
    let cancelled = false;

    Promise.all([getAdminModules(), getAdminLessons()])
      .then(([moduleData, lessonData]) => {
        if (cancelled) return;

        setModules(moduleData.map(toModuleOption));
        setLessons(lessonData.map(toLessonRow));
      })
      .catch((error) => {
        if (!cancelled) {
          setMessage(`Could not load lessons: ${error.message}`);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const publishedCount = lessons.filter(
    (lesson) => lesson.status === "Published"
  ).length;

  const draftCount = lessons.length - publishedCount;

  const visibleLessons = lessons.filter((lesson) => {
    const matchesSearch = `${lesson.title} ${lesson.description}`
      .toLowerCase()
      .includes(search.trim().toLowerCase());

    const matchesModule =
      moduleFilter === "All" || lesson.moduleId === moduleFilter;

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

  async function saveLesson(event) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const description = form.get("description").trim();
    const content = form.get("content").trim();
    const videoUrl = form.get("videoUrl").trim();
    const lessonStatus = form.get("status");
    const moduleId = form.get("moduleId");


    // New lessons follow the naming used by the existing ones: "Lesson 6: Topic".
    // If the author already typed "Lesson 6: ...", keep it as written.
    let title = form.get("title").trim();

    if (title && !editingLesson.id && !/^lesson\s+\d+\s*:/i.test(title)) {
      const nextNumber =
        lessons.filter((lesson) => lesson.moduleId === moduleId).length + 1;

      title = `Lesson ${nextNumber}: ${title}`;
    }

    const parentModule = modules.find(
      (module) => module.id === moduleId
    );

    if (!title || !description) {
      setMessage("Enter a lesson title and description.");
      return;
    }

    if (
      lessonStatus === "Published" &&
      (!content || parentModule?.status !== "Published")
    ) {
      setMessage(
        "Add lesson content and choose a published module before publishing."
      );
      return;
    }

    const details = {
      title,
      description,
      content,
      videoUrl,
      durationMinutes: Number(form.get("duration")),
      status: lessonStatus,
    };

    // Going live (new lesson, or a draft being published) asks for confirmation first.
    const isPublishing =
      lessonStatus === "Published" && editingLesson.status !== "Published";

    if (isPublishing) {
      setPendingPublish({ title, details, moduleId });
      return;
    }

    await commitLesson({ title, details, moduleId });
  }


    async function commitLesson({ title, details, moduleId }) {
      setSaving(true);
      setMessage("");

      try {
        const { videoUrl, ...lessonDetails } = details;
        let savedLesson;

        if (editingLesson.id) {
          const updated = await updateLesson(editingLesson.id, {
            ...lessonDetails,
            moduleId,
          });

          savedLesson = toLessonRow(updated);
        } else {
          const created = await createLesson(moduleId, lessonDetails);
          savedLesson = toLessonRow(created);
        }

        // Save the video URL using the lesson's database ID.
        await saveLessonVideoUrl(savedLesson.id, videoUrl);

        // Keep the URL in the frontend state.
        savedLesson.videoUrl = videoUrl;

        if (editingLesson.id) {
          setLessons((current) =>
            current.map((lesson) =>
              lesson.id === savedLesson.id ? savedLesson : lesson
            )
          );
        } else {
          setLessons((current) => [...current, savedLesson]);
        }

        clearFilters();
        setEditingLesson(null);
        setMessage(`${title} saved.`);
        return true;
      } catch (error) {
        setMessage(error.message || "Could not save the lesson.");
        return false;
      } finally {
        setSaving(false);
      }
    }


  async function deleteLesson(lesson) {
    setDeletingId(lesson.id);
    setMessage("");

    try {
      await apiFetch(`/api/lessons/${lesson.id}`, { method: "DELETE" });

      setLessons((current) =>
        current.filter((item) => item.id !== lesson.id)
      );
      setMessage(`${lesson.title} deleted.`);
    } catch (error) {
      setMessage(error.message || "Could not delete the lesson.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <AppLayout>
      {/* PAGE HEADER */}
      <header className="top dashboard-header modules-header">
        <div>
          <h1>Lessons</h1>
          <p>
            Create lesson content and organise it by module.
          </p>
        </div>

        {canManage && (
          <button
            className="btn blue"
            type="button"
            disabled={
              !!editingLesson ||
              loading ||
              modules.length === 0
            }
            onClick={() => {
              setMessage("");

              
        setEditingLesson({
          title: "",
          description: "",
          content: "",
          videoUrl: "",
          moduleId:
            moduleFilter === "All"
              ? modules[0].id
              : moduleFilter,
          duration: 20,
          status: "Draft",
        });

            }}
          >
            Create lesson
          </button>
        )}
      </header>

      <div className="content modules-page">
        <p className="modules-message" role="status">
          {loading
            ? "Loading lessons..."
            : !editingLesson && message}
        </p>

        {!loading && modules.length === 0 && (
          <p className="sub">
            Create a module before adding lessons.
          </p>
        )}

        {/* CREATE / EDIT LESSON - ADMINS AND INSTRUCTORS */}
        {canManage && editingLesson && (
          <section
            className="card module-editor"
            aria-labelledby="lesson-editor-heading"
          >
            <h2 id="lesson-editor-heading">
              {editingLesson.id
                ? "Edit lesson"
                : "Create lesson"}
            </h2>

            <p className="sub">
              Changes are saved to the database.
            </p>

            <form
              key={editingLesson.id ?? "new"}
              onSubmit={saveLesson}
            >
              <label htmlFor="lesson-title">
                Lesson title
              </label>

              <input
                id="lesson-title"
                name="title"
                required
                minLength={3}
                maxLength={100}
                defaultValue={editingLesson.title}
                placeholder="e.g. Branching Strategies & Workflows"
                autoFocus
              />

              {!editingLesson.id && (
                <p className="sub">
                  The "Lesson N:" prefix is added for you, like the other
                  lessons.
                </p>
              )}

              <label htmlFor="lesson-description">
                Short description
              </label>

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
                  <label htmlFor="lesson-module">
                    Module
                  </label>

                  <select
                    id="lesson-module"
                    name="moduleId"
                    defaultValue={editingLesson.moduleId}
                  >
                    {modules.map((module) => (
                      <option
                        key={module.id}
                        value={module.id}
                      >
                        {module.title}
                        {module.status === "Draft"
                          ? " (Draft)"
                          : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="lesson-duration">
                    Duration (minutes)
                  </label>

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

              <label htmlFor="lesson-content">
                Lesson content
              </label>

              <textarea
                id="lesson-content"
                name="content"
                rows={7}
                maxLength={20000}
                defaultValue={editingLesson.content}
                placeholder="Write the lesson material here. Leave a blank line between paragraphs, like the other lessons."
              />

              
              <label htmlFor="lesson-video-url">
                Lesson video URL
              </label>

              <input
                id="lesson-video-url"
                name="videoUrl"
                type="url"
                maxLength={2000}
                defaultValue={editingLesson.videoUrl ?? ""}
                placeholder="https://www.youtube.com/watch?v=..."
              />

              <p className="sub">
                Optional. Add a video link for this lesson.
                You can update it when editing the lesson.
              </p>

              <label htmlFor="lesson-status">
                Status
              </label>

              <select
                id="lesson-status"
                name="status"
                defaultValue={editingLesson.status}
              >
                <option>Draft</option>
                <option>Published</option>
              </select>

              <p className="sub">
                Publishing requires lesson content and a
                published module.
              </p>

              <p
                className="modules-message"
                role="status"
              >
                {message}
              </p>

              <div className="module-form-actions">
                <button
                  className="btn blue"
                  type="submit"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : "Save lesson"}
                </button>

                <button
                  className="btn"
                  type="button"
                  disabled={saving}
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

        {/* ALL LESSONS TABLE */}
        <section
          className="card module-list"
          aria-labelledby="lesson-list-heading"
        >
          <h2 id="lesson-list-heading">
            All lessons
          </h2>

          <p className="sub">
            {lessons.length} lessons · {publishedCount} published
            {" · "}
            {draftCount} drafts
          </p>

          {/* SEARCH AND FILTERS */}
          <div className="module-toolbar">
            <div className="module-search">
              <label htmlFor="lesson-search">
                Search lessons
              </label>

              <input
                id="lesson-search"
                type="search"
                placeholder="Search by title or description"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />
            </div>

            <div>
              <label htmlFor="lesson-module-filter">
                Module
              </label>

              <select
                id="lesson-module-filter"
                value={moduleFilter}
                onChange={(event) =>
                  setModuleFilter(event.target.value)
                }
              >
                <option value="All">
                  All modules
                </option>

                {modules.map((module) => (
                  <option
                    key={module.id}
                    value={module.id}
                  >
                    {module.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="lesson-status-filter">
                Status
              </label>

              <select
                id="lesson-status-filter"
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value)
                }
              >
                <option value="All">
                  All statuses
                </option>
                <option>Published</option>
                <option>Draft</option>
              </select>
            </div>
          </div>

          {/* LESSONS TABLE */}
          <table className="modules-table">
            <thead>
              <tr>
                <th scope="col">
                  Lesson
                </th>

                <th scope="col">
                  Module
                </th>

                {canManage && (
                  <th scope="col">
                    Duration
                  </th>
                )}

                <th scope="col">
                  Status
                </th>

                {canManage && (
                  <th scope="col">
                    Action
                  </th>
                )}
              </tr>
            </thead>

            <tbody>
              {visibleLessons.map((lesson) => (
                <tr key={lesson.id}>
                  {/* FULL LESSON TITLE */}
                  <td>
                    <strong>
                      {lesson.title}
                    </strong>
                    <p>
                      {lesson.description}
                    </p>
                  </td>

                  {/* CORRESPONDING MODULE */}
                  <td>
                    {modules.find(
                      (module) =>
                        module.id === lesson.moduleId
                    )?.title ?? "Unknown module"}
                  </td>

                  {/* DURATION */}
                  {canManage && (
                    <td>
                      {lesson.duration} min
                    </td>
                  )}

                  {/* LESSON STATUS */}
                  <td>
                    <span
                      className={`module-status ${
                        lesson.status === "Published"
                          ? "published"
                          : "draft"
                      }`}
                    >
                      {lesson.status}
                    </span>
                  </td>

                  {/* EDIT AND DELETE BUTTONS */}
                  {canManage && (
                    <td>
                      <div style={{ display: "flex", gap: "8px" }}>
                        
                        <button
                          className="module-edit"
                          type="button"
                          disabled={!!editingLesson}
                          aria-label={`Edit ${lesson.title}`}
                          onClick={async () => {
                            setMessage("");

                            try {
                              const video = await apiFetch(
                                `/api/lessons/${lesson.id}/video-url`
                              );

                              setEditingLesson({
                                ...lesson,
                                videoUrl: video?.videoUrl ?? "",
                              });
                            } catch (error) {
                              setMessage(
                                `Could not load the lesson video: ${error.message}`
                              );
                            }
                          }}
                        >
                          Edit
                        </button>


                        <button
                          className="module-edit assessment-danger"
                          type="button"
                          disabled={!!editingLesson || deletingId === lesson.id}
                          aria-label={`Delete ${lesson.title}`}
                          onClick={() => setLessonToDelete(lesson)}
                        >
                          {deletingId === lesson.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {/* EMPTY STATE */}
          {!loading && visibleLessons.length === 0 && (
            <div className="modules-empty">
              <h3>No lessons found</h3>

              <p>
                Try a different search, module or status.
              </p>

              <button
                className="btn"
                type="button"
                onClick={clearFilters}
              >
                Clear filters
              </button>
            </div>
          )}

          {/* RESULT COUNT */}
          <p
            className="module-result-count"
            role="status"
          >
            Showing {visibleLessons.length} of{" "}
            {lessons.length} lessons
          </p>
        </section>
      </div>

      <ConfirmDeleteModal
        open={!!pendingPublish}
        title="Publish this lesson?"
        message={`"${pendingPublish?.title}" will become visible to students in its module.`}
        confirmText="Publish"
        variant="success"
        loading={saving}
        onCancel={cancelPublish}
        
        onConfirm={async () => {
          const saved = await commitLesson(pendingPublish);

          if (saved) {
            setPendingPublish(null);
          }
        }}

      />

      <ConfirmDeleteModal
        open={!!lessonToDelete}
        title="Delete this lesson?"
        message={`"${lessonToDelete?.title}" will be permanently deleted. This can't be undone.`}
        confirmText="Delete"
        loading={deletingId !== null}
        onCancel={cancelDelete}
        onConfirm={async () => {
          await deleteLesson(lessonToDelete);
          setLessonToDelete(null);
        }}
      />
    </AppLayout>
  );
}
