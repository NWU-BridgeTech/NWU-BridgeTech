import { useState } from "react";
import AppLayout from "../layouts/AppLayout";
import { initialAssessments, initialModules } from "../data/adminData";
import "./Admin.css";
import "./AdminModules.css";
import "./AdminAssessments.css";

export default function AdminAssessments() {
  const [assessments, setAssessments] = useState(initialAssessments);
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("All");
  const [status, setStatus] = useState("All");
  const [editingAssessment, setEditingAssessment] = useState(null);
  const [message, setMessage] = useState("");

  const visibleAssessments = assessments.filter((assessment) => {
    const matchesSearch = `${assessment.title} ${assessment.description}`
      .toLowerCase()
      .includes(search.trim().toLowerCase());
    const matchesModule =
      moduleFilter === "All" || assessment.moduleId === Number(moduleFilter);
    return (
      matchesSearch &&
      matchesModule &&
      (status === "All" || assessment.status === status)
    );
  });

  function clearFilters() {
    setSearch("");
    setModuleFilter("All");
    setStatus("All");
  }

  function saveAssessment(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = form.get("title").trim();
    const description = form.get("description").trim();
    const questions = editingAssessment.questions.map((question) => ({
      id: question.id,
      text: form.get(`question-${question.id}`).trim(),
      options: question.options.map((_, index) =>
        form.get(`option-${question.id}-${index}`).trim(),
      ),
      answer: Number(form.get(`answer-${question.id}`)),
    }));
    const questionsReady =
      questions.length > 0 &&
      questions.every(
        (question) =>
          question.text &&
          question.options.every((option) => option) &&
          new Set(question.options.map((option) => option.toLowerCase()))
            .size === 4,
      );
    const assessmentStatus = form.get("status");
    const moduleId = Number(form.get("moduleId"));
    const parentModule = initialModules.find(
      (module) => module.id === moduleId,
    );
    if (!title || !description) {
      setMessage("Enter an assessment title and description.");
      return;
    }
    if (
      assessmentStatus === "Published" &&
      (!questionsReady || parentModule.status !== "Published")
    ) {
      setMessage(
        "Before publishing, choose a published module and add at least one complete question with four different answers and a correct answer.",
      );
      return;
    }
    const savedAssessment = {
      ...editingAssessment,
      id: editingAssessment.id ?? Date.now(),
      title,
      description,
      questions,
      passMark: Number(form.get("passMark")),
      moduleId,
      duration: Number(form.get("duration")),
      status: assessmentStatus,
    };
    if (editingAssessment.id) {
      setAssessments(
        assessments.map((assessment) =>
          assessment.id === savedAssessment.id ? savedAssessment : assessment,
        ),
      );
    } else {
      setAssessments([...assessments, savedAssessment]);
    }
    clearFilters();
    setEditingAssessment(null);
    setMessage(
      `${title} saved. Changes reset when you leave this page or reload.`,
    );
  }

  return (
    <AppLayout>
      <header className="top dashboard-header modules-header">
        <div>
          <h1>Assessments</h1>
          <p>Manage quizzes, questions and publishing by module.</p>
        </div>
        <button
          className="btn blue"
          type="button"
          disabled={!!editingAssessment}
          onClick={() => {
            setMessage("");
            setEditingAssessment({
              title: "",
              description: "",
              questions: [],
              passMark: 70,
              moduleId:
                moduleFilter === "All"
                  ? initialModules[0].id
                  : Number(moduleFilter),
              duration: 20,
              status: "Draft",
            });
          }}
        >
          Create assessment
        </button>
      </header>
      <div className="content modules-page assessments-page">
        <p className="modules-message" role="status">
          {!editingAssessment && message}
        </p>
        {editingAssessment && (
          <section
            className="card module-editor"
            aria-labelledby="assessment-editor-heading"
          >
            <h2 id="assessment-editor-heading">
              {editingAssessment.id ? "Edit assessment" : "Create assessment"}
            </h2>
            <p className="sub">Changes are kept while this page is open.</p>
            <form key={editingAssessment.id ?? "new"} onSubmit={saveAssessment}>
              <label htmlFor="assessment-title">Assessment title</label>
              <input
                id="assessment-title"
                name="title"
                required
                maxLength={100}
                defaultValue={editingAssessment.title}
                autoFocus
              />
              <label htmlFor="assessment-description">Short description</label>
              <textarea
                id="assessment-description"
                name="description"
                required
                maxLength={500}
                rows={2}
                defaultValue={editingAssessment.description}
              />
              <div className="module-form-row">
                <div>
                  <label htmlFor="assessment-module">Module</label>
                  <select
                    id="assessment-module"
                    name="moduleId"
                    defaultValue={editingAssessment.moduleId}
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
                  <label htmlFor="assessment-duration">
                    Time limit (minutes)
                  </label>
                  <input
                    id="assessment-duration"
                    name="duration"
                    type="number"
                    min="1"
                    max="600"
                    step="1"
                    required
                    defaultValue={editingAssessment.duration}
                  />
                </div>
              </div>
              <label htmlFor="assessment-pass-mark">Pass mark (%)</label>
              <input
                id="assessment-pass-mark"
                name="passMark"
                type="number"
                min="1"
                max="100"
                step="1"
                required
                defaultValue={editingAssessment.passMark}
              />
              <fieldset className="assessment-questions">
                <legend>Questions</legend>
                <p className="sub">
                  Each question has four answers and one correct answer. All
                  questions carry equal marks.
                </p>
                {editingAssessment.questions.length === 0 && (
                  <p className="sub">
                    No questions yet. Add your first question below.
                  </p>
                )}
                {editingAssessment.questions.map((question, index) => (
                  <fieldset className="assessment-question" key={question.id}>
                    <legend>Question {index + 1}</legend>
                    <label htmlFor={`question-${question.id}`}>
                      Question text
                    </label>
                    <textarea
                      id={`question-${question.id}`}
                      name={`question-${question.id}`}
                      rows={2}
                      maxLength={1000}
                      defaultValue={question.text}
                    />
                    <div className="module-form-row">
                      {question.options.map((option, optionIndex) => (
                        <div key={optionIndex}>
                          <label
                            htmlFor={`option-${question.id}-${optionIndex}`}
                          >
                            Answer {optionIndex + 1}
                          </label>
                          <input
                            id={`option-${question.id}-${optionIndex}`}
                            name={`option-${question.id}-${optionIndex}`}
                            maxLength={300}
                            defaultValue={option}
                          />
                        </div>
                      ))}
                    </div>
                    <label htmlFor={`answer-${question.id}`}>
                      Correct answer
                    </label>
                    <select
                      id={`answer-${question.id}`}
                      name={`answer-${question.id}`}
                      defaultValue={question.answer}
                    >
                      {question.options.map((_, optionIndex) => (
                        <option key={optionIndex} value={optionIndex}>
                          Answer {optionIndex + 1}
                        </option>
                      ))}
                    </select>
                    <button
                      className="btn assessment-remove"
                      type="button"
                      aria-label={`Remove question ${index + 1}`}
                      onClick={() =>
                        setEditingAssessment({
                          ...editingAssessment,
                          questions: editingAssessment.questions.filter(
                            (item) => item.id !== question.id,
                          ),
                        })
                      }
                    >
                      Remove question
                    </button>
                  </fieldset>
                ))}
                <button
                  className="btn"
                  type="button"
                  onClick={() =>
                    setEditingAssessment({
                      ...editingAssessment,
                      questions: [
                        ...editingAssessment.questions,
                        {
                          id: Date.now(),
                          text: "",
                          options: ["", "", "", ""],
                          answer: 0,
                        },
                      ],
                    })
                  }
                >
                  Add question
                </button>
              </fieldset>
              <label htmlFor="assessment-status">Status</label>
              <select
                id="assessment-status"
                name="status"
                defaultValue={editingAssessment.status}
              >
                <option>Draft</option>
                <option>Published</option>
              </select>
              <p className="sub">
                Drafts can contain unfinished questions. Publishing requires
                complete questions and a published module.
              </p>
              <p className="modules-message" role="status">
                {message}
              </p>
              <div className="module-form-actions">
                <button className="btn blue" type="submit">
                  Save assessment
                </button>
                <button
                  className="btn"
                  type="button"
                  onClick={() => {
                    setEditingAssessment(null);
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
          aria-labelledby="assessment-list-heading"
        >
          <h2 id="assessment-list-heading">All assessments</h2>
          <p className="sub">
            {assessments.length} assessments ·{" "}
            {
              assessments.filter(
                (assessment) => assessment.status === "Published",
              ).length
            }{" "}
            published ·{" "}
            {
              assessments.filter((assessment) => assessment.status === "Draft")
                .length
            }{" "}
            drafts
          </p>
          <div className="module-toolbar">
            <div className="module-search">
              <label htmlFor="assessment-search">Search assessments</label>
              <input
                id="assessment-search"
                type="search"
                placeholder="Search by title or description"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <div>
              <label htmlFor="assessment-module-filter">Module</label>
              <select
                id="assessment-module-filter"
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
              <label htmlFor="assessment-status-filter">Status</label>
              <select
                id="assessment-status-filter"
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
                <th scope="col">Assessment</th>
                <th scope="col">Module</th>
                <th scope="col">Questions</th>
                <th scope="col">Time limit</th>
                <th scope="col">Pass mark</th>
                <th scope="col">Status</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleAssessments.map((assessment) => (
                <tr key={assessment.id}>
                  <td>
                    <strong>{assessment.title}</strong>
                    <p>{assessment.description}</p>
                  </td>
                  <td>
                    {
                      initialModules.find(
                        (module) => module.id === assessment.moduleId,
                      )?.title
                    }
                  </td>
                  <td>{assessment.questions.length}</td>
                  <td>{assessment.duration} min</td>
                  <td>{assessment.passMark}%</td>
                  <td>
                    <span
                      className={`module-status ${assessment.status === "Published" ? "published" : "draft"}`}
                    >
                      {assessment.status}
                    </span>
                  </td>
                  <td>
                    <button
                      className="module-edit"
                      type="button"
                      disabled={!!editingAssessment}
                      aria-label={`Edit ${assessment.title}`}
                      onClick={() => {
                        setEditingAssessment(assessment);
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
          {visibleAssessments.length === 0 && (
            <div className="modules-empty">
              <h3>No assessments found</h3>
              <p>Try a different search, module or status.</p>
              <button className="btn" type="button" onClick={clearFilters}>
                Clear filters
              </button>
            </div>
          )}
          <p className="module-result-count" role="status">
            Showing {visibleAssessments.length} of {assessments.length}{" "}
            assessments
          </p>
        </section>
      </div>
    </AppLayout>
  );
}
