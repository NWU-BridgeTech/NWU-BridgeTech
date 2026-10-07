import { useEffect, useLayoutEffect, useRef, useState } from "react";
import AppLayout from "../layouts/AppLayout";
import { Skeleton } from "@/components/ui/skeleton";
import {
  deleteQuiz,
  getQuiz,
  listCourseOutline,
  listQuizzes,
  saveQuiz,
} from "../services/quizAdminApi";
import "./Admin.css";
import "./AdminModules.css";
import "./AdminAssessments.css";

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 6;
const DEFAULT_OPTIONS = 4;
const SINGLE_CHOICE = 0;
const STATUS_FILTERS = [
  { value: "All", label: "All statuses" },
  { value: "Published", label: "Published" },
  { value: "Draft", label: "Draft" },
  { value: "Missing", label: "Missing quiz" },
];

function blankOption(isCorrect = false) {
  return { key: crypto.randomUUID(), optionText: "", isCorrect };
}

function blankQuestion() {
  return {
    key: crypto.randomUUID(),
    questionText: "",
    questionType: SINGLE_CHOICE,
    options: Array.from({ length: DEFAULT_OPTIONS }, (_, index) =>
      blankOption(index === 0),
    ),
  };
}

function blankDraft(moduleId, lessonId) {
  return {
    moduleId,
    lessonId,
    title: "",
    passingScore: "70",
    status: "Draft",
    questions: [],
  };
}

function toDraft(quiz) {
  return {
    quizId: quiz.quizId,
    moduleId: quiz.moduleId,
    lessonId: quiz.lessonId ?? "",
    title: quiz.title,
    passingScore: String(quiz.passingScore),
    status: quiz.status,
    questions: quiz.questions.map((question) => ({
      key: question.questionId,
      questionId: question.questionId,
      questionText: question.questionText,
      questionType: question.questionType,
      options: question.options.map((option) => ({
        key: option.optionId,
        optionId: option.optionId,
        optionText: option.optionText,
        isCorrect: option.isCorrect,
      })),
    })),
  };
}

function toPayload(draft) {
  return {
    quizId: draft.quizId,
    moduleId: draft.moduleId,
    lessonId: draft.lessonId,
    title: draft.title.trim(),
    passingScore: Number(draft.passingScore),
    status: draft.status,
    questions: draft.questions.map((question) => ({
      questionId: question.questionId,
      questionText: question.questionText.trim(),
      questionType: question.questionType,
      options: question.options.map((option) => ({
        optionId: option.optionId,
        optionText: option.optionText.trim(),
        isCorrect: option.isCorrect,
      })),
    })),
  };
}

function toListItem({ questions, ...quiz }) {
  return { ...quiz, questionCount: questions.length };
}

function findPlacement(outline, lessonId) {
  for (const module of outline) {
    const lesson = module.lessons.find((item) => item.lessonId === lessonId);
    if (lesson) return { module, lesson };
  }
  return null;
}

function validateDraft(draft, outline) {
  if (!draft.lessonId) return "Choose a lesson for this quiz.";
  if (draft.title.trim().length < 3) {
    return "Enter a quiz title of at least 3 characters.";
  }
  const passingScore = Number(draft.passingScore);
  if (!Number.isInteger(passingScore) || passingScore < 1 || passingScore > 100) {
    return "Pass mark must be a whole number from 1 to 100.";
  }
  if (draft.status !== "Published") return null;

  const placement = findPlacement(outline, draft.lessonId);
  if (
    placement?.module.status !== "Published" ||
    placement.lesson.status !== "Published"
  ) {
    return "Publish the lesson and its module before publishing this quiz.";
  }
  if (draft.questions.length === 0) {
    return "Add at least one question before publishing.";
  }
  for (const [index, question] of draft.questions.entries()) {
    const number = index + 1;
    if (question.questionText.trim().length < 3) {
      return `Question ${number} needs question text of at least 3 characters.`;
    }
    const answers = question.options.map((option) =>
      option.optionText.trim().toLowerCase(),
    );
    if (answers.some((answer) => !answer)) {
      return `Question ${number} has an empty answer.`;
    }
    if (new Set(answers).size !== answers.length) {
      return `Question ${number} has duplicate answers.`;
    }
  }
  return null;
}

function StatusBadge({ status }) {
  return (
    <span
      className={`module-status ${status === "Published" ? "published" : "draft"}`}
    >
      {status}
    </span>
  );
}

function LoadingState() {
  return (
    <section
      className="card assessment-loading"
      aria-busy="true"
      aria-label="Loading assessments"
    >
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-16 w-full" />
      {Array.from({ length: 5 }, (_, index) => (
        <Skeleton key={index} className="h-12 w-full" />
      ))}
    </section>
  );
}

function AnswerField({ label, value, onChange }) {
  const fieldRef = useRef(null);

  useLayoutEffect(() => {
    const field = fieldRef.current;
    field.style.height = "auto";
    field.style.height = `${field.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={fieldRef}
      rows={1}
      maxLength={500}
      placeholder={label}
      aria-label={label}
      value={value}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.preventDefault();
      }}
      onChange={(event) =>
        onChange(event.target.value.replace(/\s*\n\s*/g, " "))
      }
    />
  );
}

function QuestionCard({
  question,
  index,
  total,
  onChange,
  onMove,
  onRemove,
}) {
  const number = index + 1;
  const headingId = `question-heading-${question.key}`;
  const answersId = `question-answers-${question.key}`;

  function updateOptions(update) {
    onChange({ ...question, options: update(question.options) });
  }

  function removeOption(optionKey) {
    updateOptions((options) => {
      const remaining = options.filter((option) => option.key !== optionKey);
      return remaining.some((option) => option.isCorrect)
        ? remaining
        : remaining.map((option, optionIndex) => ({
            ...option,
            isCorrect: optionIndex === 0,
          }));
    });
  }

  return (
    <div
      className="assessment-question"
      role="group"
      aria-labelledby={headingId}
    >
      <div className="assessment-question-head">
        <h4 id={headingId}>Question {number}</h4>
        <div className="assessment-question-tools">
          <button
            className="module-edit"
            type="button"
            disabled={index === 0}
            aria-label={`Move question ${number} up`}
            title="Move up"
            onClick={() => onMove(-1)}
          >
            ↑
          </button>
          <button
            className="module-edit"
            type="button"
            disabled={index === total - 1}
            aria-label={`Move question ${number} down`}
            title="Move down"
            onClick={() => onMove(1)}
          >
            ↓
          </button>
          <button
            className="module-edit assessment-danger"
            type="button"
            aria-label={`Remove question ${number}`}
            onClick={onRemove}
          >
            Remove
          </button>
        </div>
      </div>
      <label htmlFor={`question-text-${question.key}`}>Question text</label>
      <textarea
        id={`question-text-${question.key}`}
        rows={2}
        maxLength={500}
        value={question.questionText}
        onChange={(event) =>
          onChange({ ...question, questionText: event.target.value })
        }
      />
      <p className="assessment-answers-label" id={answersId}>
        Answers <span>Select the correct answer</span>
      </p>
      <div
        className="assessment-options"
        role="radiogroup"
        aria-labelledby={answersId}
      >
        {question.options.map((option, optionIndex) => (
          <div
            key={option.key}
            className={`assessment-option${option.isCorrect ? " is-correct" : ""}`}
          >
            <input
              type="radio"
              name={`correct-${question.key}`}
              checked={option.isCorrect}
              aria-label={`Mark answer ${optionIndex + 1} as correct`}
              onChange={() =>
                updateOptions((options) =>
                  options.map((item) => ({
                    ...item,
                    isCorrect: item.key === option.key,
                  })),
                )
              }
            />
            <AnswerField
              label={`Answer ${optionIndex + 1}`}
              value={option.optionText}
              onChange={(optionText) =>
                updateOptions((options) =>
                  options.map((item) =>
                    item.key === option.key ? { ...item, optionText } : item,
                  ),
                )
              }
            />
            <button
              className="assessment-icon-button"
              type="button"
              disabled={question.options.length <= MIN_OPTIONS}
              aria-label={`Remove answer ${optionIndex + 1}`}
              title="Remove answer"
              onClick={() => removeOption(option.key)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button
        className="assessment-add-option"
        type="button"
        disabled={question.options.length >= MAX_OPTIONS}
        onClick={() => updateOptions((options) => [...options, blankOption()])}
      >
        + Add answer
      </button>
    </div>
  );
}

function QuizEditor({
  draft,
  setDraft,
  outline,
  isLessonFree,
  saving,
  message,
  onSubmit,
  onCancel,
}) {
  const selectedModule = outline.find(
    (module) => module.moduleId === draft.moduleId,
  );
  const availableLessons = (selectedModule?.lessons ?? []).filter((lesson) =>
    isLessonFree(lesson.lessonId, draft.quizId),
  );

  function update(changes) {
    setDraft((current) => ({ ...current, ...changes }));
  }

  function updateQuestions(change) {
    setDraft((current) => ({ ...current, questions: change(current.questions) }));
  }

  function changeModule(moduleId) {
    const nextModule = outline.find((module) => module.moduleId === moduleId);
    const firstFree = nextModule?.lessons.find((lesson) =>
      isLessonFree(lesson.lessonId, draft.quizId),
    );
    update({ moduleId, lessonId: firstFree?.lessonId ?? "" });
  }

  function moveQuestion(index, offset) {
    updateQuestions((questions) => {
      const reordered = [...questions];
      const [moved] = reordered.splice(index, 1);
      reordered.splice(index + offset, 0, moved);
      return reordered;
    });
  }

  return (
    <section
      className="card module-editor assessment-editor"
      aria-labelledby="assessment-editor-heading"
    >
      <h2 id="assessment-editor-heading">
        {draft.quizId ? "Edit quiz" : "Create quiz"}
      </h2>
      <p className="sub">
        Drafts can be saved unfinished. Publishing checks every question.
      </p>
      <form onSubmit={onSubmit} noValidate>
        <div className="module-form-row">
          <div className="assessment-field">
            <label htmlFor="quiz-module">Module</label>
            <select
              id="quiz-module"
              value={draft.moduleId}
              onChange={(event) => changeModule(event.target.value)}
            >
              {outline.map((module) => (
                <option key={module.moduleId} value={module.moduleId}>
                  {module.title}
                  {module.status === "Draft" ? " (Draft)" : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="assessment-field">
            <label htmlFor="quiz-lesson">Lesson</label>
            <select
              id="quiz-lesson"
              value={draft.lessonId}
              disabled={availableLessons.length === 0}
              onChange={(event) => update({ lessonId: event.target.value })}
            >
              {availableLessons.length === 0 ? (
                <option value="">Every lesson here already has a quiz</option>
              ) : (
                <>
                  {!draft.lessonId && (
                    <option value="">Choose a lesson</option>
                  )}
                  {availableLessons.map((lesson) => (
                    <option key={lesson.lessonId} value={lesson.lessonId}>
                      {lesson.orderIndex + 1}. {lesson.title}
                      {lesson.status === "Draft" ? " (Draft)" : ""}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>
        </div>
        <div className="assessment-field">
          <label htmlFor="quiz-title">Quiz title</label>
          <input
            id="quiz-title"
            maxLength={200}
            value={draft.title}
            autoFocus
            onChange={(event) => update({ title: event.target.value })}
          />
        </div>
        <div className="module-form-row">
          <div className="assessment-field">
            <label htmlFor="quiz-pass-mark">Pass mark (%)</label>
            <input
              id="quiz-pass-mark"
              type="number"
              min="1"
              max="100"
              step="1"
              value={draft.passingScore}
              onChange={(event) => update({ passingScore: event.target.value })}
            />
          </div>
          <div className="assessment-field">
            <label htmlFor="quiz-status">Status</label>
            <select
              id="quiz-status"
              value={draft.status}
              onChange={(event) => update({ status: event.target.value })}
            >
              <option>Draft</option>
              <option>Published</option>
            </select>
          </div>
        </div>
        <fieldset className="assessment-questions">
          <legend>Questions</legend>
          <p className="sub">
            Single choice. Every question carries equal marks.
          </p>
          {draft.questions.length === 0 ? (
            <p className="assessment-no-questions">
              No questions yet. Add the first one below.
            </p>
          ) : (
            <ol className="assessment-question-list">
              {draft.questions.map((question, index) => (
                <li key={question.key}>
                  <QuestionCard
                    question={question}
                    index={index}
                    total={draft.questions.length}
                    onChange={(changed) =>
                      updateQuestions((questions) =>
                        questions.map((item) =>
                          item.key === changed.key ? changed : item,
                        ),
                      )
                    }
                    onMove={(offset) => moveQuestion(index, offset)}
                    onRemove={() =>
                      updateQuestions((questions) =>
                        questions.filter((item) => item.key !== question.key),
                      )
                    }
                  />
                </li>
              ))}
            </ol>
          )}
          <button
            className="btn"
            type="button"
            onClick={() =>
              updateQuestions((questions) => [...questions, blankQuestion()])
            }
          >
            Add question
          </button>
        </fieldset>
        <p className="modules-message assessment-editor-message" role="status">
          {message}
        </p>
        <div className="module-form-actions">
          <button className="btn blue" type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save quiz"}
          </button>
          <button
            className="btn"
            type="button"
            disabled={saving}
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}

export default function AdminAssessments() {
  const [outline, setOutline] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loadState, setLoadState] = useState("loading");
  const [reloadToken, setReloadToken] = useState(0);
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [draft, setDraft] = useState(null);
  const [openingQuizId, setOpeningQuizId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editorMessage, setEditorMessage] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    Promise.all([listCourseOutline(), listQuizzes()]).then(
      ([loadedOutline, loadedQuizzes]) => {
        if (cancelled) return;
        setOutline(loadedOutline);
        setQuizzes(loadedQuizzes);
        setLoadState("ready");
      },
      () => {
        if (!cancelled) setLoadState("error");
      },
    );
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const quizByLesson = new Map(
    quizzes
      .filter((quiz) => quiz.lessonId)
      .map((quiz) => [quiz.lessonId, quiz]),
  );
  const knownLessonIds = new Set(
    outline.flatMap((module) => module.lessons.map((lesson) => lesson.lessonId)),
  );
  const lessonCount = knownLessonIds.size;
  const hasContent = lessonCount > 0 || quizzes.length > 0;
  const coveredCount = [...knownLessonIds].filter((lessonId) =>
    quizByLesson.has(lessonId),
  ).length;
  const publishedCount = quizzes.filter(
    (quiz) => quiz.status === "Published",
  ).length;
  const draftCount = quizzes.length - publishedCount;
  const coveragePercent = lessonCount
    ? Math.round((coveredCount / lessonCount) * 100)
    : 0;
  const busy = !!draft || !!openingQuizId || !!deletingId;
  const term = search.trim().toLowerCase();

  function isLessonFree(lessonId, quizId) {
    const owner = quizByLesson.get(lessonId);
    return !owner || owner.quizId === quizId;
  }

  function matchesFilters(row) {
    const matchesStatus =
      statusFilter === "All" ||
      (statusFilter === "Missing"
        ? !row.quiz
        : row.quiz?.status === statusFilter);
    const matchesSearch =
      !term ||
      `${row.lesson?.title ?? ""} ${row.quiz?.title ?? ""}`
        .toLowerCase()
        .includes(term);
    return matchesStatus && matchesSearch;
  }

  const visibleGroups = outline
    .filter(
      (module) => moduleFilter === "All" || module.moduleId === moduleFilter,
    )
    .map((module) => ({
      module,
      covered: module.lessons.filter((lesson) =>
        quizByLesson.has(lesson.lessonId),
      ).length,
      rows: [
        ...module.lessons.map((lesson) => ({
          key: lesson.lessonId,
          lesson,
          quiz: quizByLesson.get(lesson.lessonId) ?? null,
        })),
        ...quizzes
          .filter(
            (quiz) =>
              quiz.moduleId === module.moduleId &&
              !knownLessonIds.has(quiz.lessonId),
          )
          .map((quiz) => ({ key: quiz.quizId, lesson: null, quiz })),
      ].filter(matchesFilters),
    }))
    .filter((group) => group.rows.length > 0);

  const firstOpenLesson = outline
    .filter(
      (module) => moduleFilter === "All" || module.moduleId === moduleFilter,
    )
    .flatMap((module) =>
      module.lessons.map((lesson) => ({ moduleId: module.moduleId, lesson })),
    )
    .find(({ lesson }) => !quizByLesson.has(lesson.lessonId));

  function clearFilters() {
    setSearch("");
    setModuleFilter("All");
    setStatusFilter("All");
  }

  function openEditor(nextDraft) {
    setMessage("");
    setEditorMessage("");
    setPendingDeleteId(null);
    setDraft(nextDraft);
  }

  async function startEdit(quizId) {
    setMessage("");
    setOpeningQuizId(quizId);
    try {
      openEditor(toDraft(await getQuiz(quizId)));
    } catch (error) {
      setMessage(`Could not open the quiz: ${error.message}`);
    } finally {
      setOpeningQuizId(null);
    }
  }

  async function handleSave(event) {
    event.preventDefault();
    const problem = validateDraft(draft, outline);
    if (problem) {
      setEditorMessage(problem);
      return;
    }
    setSaving(true);
    setEditorMessage("");
    try {
      const saved = await saveQuiz(toPayload(draft));
      const listItem = toListItem(saved);
      setQuizzes((current) =>
        current.some((quiz) => quiz.quizId === saved.quizId)
          ? current.map((quiz) =>
              quiz.quizId === saved.quizId ? listItem : quiz,
            )
          : [...current, listItem],
      );
      setDraft(null);
      setMessage(`"${saved.title}" saved as ${saved.status.toLowerCase()}.`);
    } catch (error) {
      setEditorMessage(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete(quiz) {
    setDeletingId(quiz.quizId);
    try {
      await deleteQuiz(quiz.quizId);
      setQuizzes((current) =>
        current.filter((item) => item.quizId !== quiz.quizId),
      );
      setMessage(`"${quiz.title}" deleted.`);
    } catch (error) {
      setMessage(`Could not delete "${quiz.title}": ${error.message}`);
    } finally {
      setDeletingId(null);
      setPendingDeleteId(null);
    }
  }

  function renderActions(module, row) {
    if (!row.quiz) {
      return (
        <button
          className="module-edit"
          type="button"
          disabled={busy}
          aria-label={`Create quiz for ${row.lesson.title}`}
          onClick={() =>
            openEditor(blankDraft(module.moduleId, row.lesson.lessonId))
          }
        >
          Create quiz
        </button>
      );
    }

    const { quiz } = row;
    if (pendingDeleteId === quiz.quizId) {
      return (
        <>
          <span className="assessment-delete-prompt">Delete this quiz?</span>
          <button
            className="module-edit assessment-danger"
            type="button"
            disabled={deletingId === quiz.quizId}
            onClick={() => confirmDelete(quiz)}
          >
            {deletingId === quiz.quizId ? "Deleting…" : "Delete"}
          </button>
          <button
            className="module-edit"
            type="button"
            disabled={deletingId === quiz.quizId}
            onClick={() => setPendingDeleteId(null)}
          >
            Keep
          </button>
        </>
      );
    }

    return (
      <>
        <button
          className="module-edit"
          type="button"
          disabled={busy}
          aria-label={`Edit ${quiz.title}`}
          onClick={() => startEdit(quiz.quizId)}
        >
          {openingQuizId === quiz.quizId ? "Opening…" : "Edit"}
        </button>
        <button
          className="module-edit assessment-danger"
          type="button"
          disabled={busy}
          aria-label={`Delete ${quiz.title}`}
          onClick={() => {
            setMessage("");
            setPendingDeleteId(quiz.quizId);
          }}
        >
          Delete
        </button>
      </>
    );
  }

  return (
    <AppLayout>
      <header className="top dashboard-header modules-header">
        <div>
          <h1>Assessments</h1>
          <p>Every lesson needs a quiz. Create, edit and publish them here.</p>
        </div>
        <button
          className="btn blue"
          type="button"
          disabled={loadState !== "ready" || busy || !firstOpenLesson}
          onClick={() =>
            openEditor(
              blankDraft(
                firstOpenLesson.moduleId,
                firstOpenLesson.lesson.lessonId,
              ),
            )
          }
        >
          Create quiz
        </button>
      </header>
      <div className="content modules-page assessments-page">
        <p className="modules-message" role="status">
          {message}
        </p>

        {loadState === "loading" && <LoadingState />}

        {loadState === "error" && (
          <section className="card modules-empty" role="alert">
            <h3>Couldn&apos;t load assessments</h3>
            <p>Check your connection and try again.</p>
            <button
              className="btn"
              type="button"
              onClick={() => {
                setLoadState("loading");
                setReloadToken((token) => token + 1);
              }}
            >
              Retry
            </button>
          </section>
        )}

        {loadState === "ready" && draft && (
          <QuizEditor
            draft={draft}
            setDraft={setDraft}
            outline={outline}
            isLessonFree={isLessonFree}
            saving={saving}
            message={editorMessage}
            onSubmit={handleSave}
            onCancel={() => {
              setDraft(null);
              setEditorMessage("");
            }}
          />
        )}

        {loadState === "ready" && (
          <section
            className="card module-list"
            aria-labelledby="assessment-list-heading"
          >
            <h2 id="assessment-list-heading">Quizzes by lesson</h2>
            {hasContent && (
              <>
                <div className="assessment-summary">
                  <div className="assessment-coverage">
                    <p className="assessment-coverage-label">
                      <strong>
                        {coveredCount} of {lessonCount}
                      </strong>{" "}
                      {lessonCount === 1 ? "lesson has" : "lessons have"} a quiz
                    </p>
                    <div
                      className="assessment-coverage-track"
                      role="progressbar"
                      aria-label="Lessons with a quiz"
                      aria-valuemin={0}
                      aria-valuemax={lessonCount}
                      aria-valuenow={coveredCount}
                    >
                      <span style={{ width: `${coveragePercent}%` }} />
                    </div>
                  </div>
                  <dl className="assessment-counts">
                    <div>
                      <dt>Published</dt>
                      <dd>{publishedCount}</dd>
                    </div>
                    <div>
                      <dt>Drafts</dt>
                      <dd>{draftCount}</dd>
                    </div>
                    <div>
                      <dt>Missing</dt>
                      <dd>{lessonCount - coveredCount}</dd>
                    </div>
                  </dl>
                </div>

                <div className="module-toolbar">
                  <div className="module-search">
                    <label htmlFor="assessment-search">Search</label>
                    <input
                      id="assessment-search"
                      type="search"
                      placeholder="Search by lesson or quiz title"
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
                      {outline.map((module) => (
                        <option key={module.moduleId} value={module.moduleId}>
                          {module.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="assessment-status-filter">Status</label>
                    <select
                      id="assessment-status-filter"
                      value={statusFilter}
                      onChange={(event) => setStatusFilter(event.target.value)}
                    >
                      {STATUS_FILTERS.map((filter) => (
                        <option key={filter.value} value={filter.value}>
                          {filter.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}

            {visibleGroups.map(({ module, covered, rows }) => (
              <section
                key={module.moduleId}
                className="assessment-module"
                aria-labelledby={`assessment-module-${module.moduleId}`}
              >
                <header className="assessment-module-header">
                  <h3 id={`assessment-module-${module.moduleId}`}>
                    {module.title}
                  </h3>
                  <StatusBadge status={module.status} />
                  <span className="assessment-module-coverage">
                    {covered} of {module.lessons.length}{" "}
                    {module.lessons.length === 1 ? "lesson" : "lessons"} covered
                  </span>
                </header>
                <div className="assessment-table-wrap">
                  <table className="modules-table assessment-table">
                    <thead>
                      <tr>
                        <th scope="col">Lesson</th>
                        <th scope="col">Quiz</th>
                        <th scope="col">Questions</th>
                        <th scope="col">Pass mark</th>
                        <th scope="col">Status</th>
                        <th scope="col" className="assessment-actions">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr key={row.key}>
                          <td data-label="Lesson">
                            {row.lesson ? (
                              <>
                                <strong>{row.lesson.title}</strong>
                                <p>
                                  Lesson {row.lesson.orderIndex + 1} ·{" "}
                                  {row.lesson.status}
                                </p>
                              </>
                            ) : (
                              <>
                                <strong className="assessment-unlinked">
                                  No lesson linked
                                </strong>
                                <p>Edit this quiz to attach it to a lesson.</p>
                              </>
                            )}
                          </td>
                          {row.quiz ? (
                            <>
                              <td data-label="Quiz">{row.quiz.title}</td>
                              <td data-label="Questions">
                                {row.quiz.questionCount}
                              </td>
                              <td data-label="Pass mark">
                                {row.quiz.passingScore}%
                              </td>
                              <td data-label="Status">
                                <StatusBadge status={row.quiz.status} />
                              </td>
                            </>
                          ) : (
                            <td colSpan={4} data-label="Quiz">
                              <span className="assessment-missing">
                                No quiz yet
                              </span>
                            </td>
                          )}
                          <td className="assessment-actions">
                            <div className="assessment-action-group">
                              {renderActions(module, row)}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ))}

            {visibleGroups.length === 0 &&
              (lessonCount === 0 ? (
                <div className="modules-empty">
                  <h3>No lessons yet</h3>
                  <p>Add modules and lessons before creating quizzes.</p>
                </div>
              ) : (
                <div className="modules-empty">
                  <h3>Nothing matches</h3>
                  <p>Try a different search, module or status.</p>
                  <button className="btn" type="button" onClick={clearFilters}>
                    Clear filters
                  </button>
                </div>
              ))}
          </section>
        )}
      </div>
    </AppLayout>
  );
}
