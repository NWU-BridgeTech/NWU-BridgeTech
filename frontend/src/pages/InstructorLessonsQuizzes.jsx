import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  Clock3,
  Dumbbell,
  FileText,
  Pencil,
  Plus,
  X,
} from "lucide-react";
import AppLayout from "../layouts/AppLayout";
import {
  addInstructorExercise,
  addInstructorQuiz,
  addInstructorQuizQuestion,
  createInstructorLesson,
  createInstructorModule,
  getInstructorModuleContent,
  getInstructorModules,
  moveInstructorLesson,
  updateInstructorLesson,
  updateInstructorQuizQuestion,
} from "../utils/instructorContentApi";
import "./InstructorLessonsQuizzes.css";

const emptyLesson = {
  title: "",
  description: "",
  content: "",
  videoUrl: "",
  durationMinutes: 20,
  status: "Draft",
};

function createEmptyQuizQuestion() {
  return {
    questionText: "",
    options: [
      { text: "", isCorrect: true },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
    ],
  };
}

function createEmptyQuiz() {
  return {
    title: "",
    passingScore: 70,
    questions: [createEmptyQuizQuestion()],
  };
}

function getContentOutline(content) {
  const lines = (content ?? "")
    .split(/\r?\n/)
    .map((line) => line.replace(/^#{1,6}\s*/, "").trim())
    .filter(Boolean);
  return lines.length ? lines.slice(0, 8) : ["No lesson content outline yet."];
}

function formatScore(score) {
  return score == null ? "—" : `${Math.round(score)}%`;
}

export default function InstructorLessonsQuizzes() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [requestedModuleId] = useState(() => searchParams.get("moduleId") ?? "");
  const [requestedCreateModule] = useState(() => searchParams.get("createModule") === "1");
  const [modules, setModules] = useState([]);
  const [selectedModuleId, setSelectedModuleId] = useState(
    requestedModuleId,
  );
  const [moduleContent, setModuleContent] = useState(null);
  const [modulesLoading, setModulesLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pageError, setPageError] = useState("");
  const [message, setMessage] = useState("");
  const [lessonEditorOpen, setLessonEditorOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [lessonDraft, setLessonDraft] = useState(emptyLesson);
  const [quizLesson, setQuizLesson] = useState(null);
  const [quizDraft, setQuizDraft] = useState(createEmptyQuiz);
  const [questionQuiz, setQuestionQuiz] = useState(null);
  const [questionDraft, setQuestionDraft] = useState(createEmptyQuizQuestion);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(null);
  const [exerciseOpen, setExerciseOpen] = useState(false);
  const [moduleEditorOpen, setModuleEditorOpen] = useState(false);
  const [moduleDraft, setModuleDraft] = useState({ title: "" });
  const [exerciseDraft, setExerciseDraft] = useState({ title: "", description: "" });
  const [expandedLessonId, setExpandedLessonId] = useState("");

  const selectedModule = modules.find((module) => module.moduleId === selectedModuleId);
  const lessons = moduleContent?.lessons ?? [];
  const exerciseCount = moduleContent?.moduleExerciseCount ?? 0;
  const averageQuizScore = moduleContent?.averageQuizScore ?? null;

  useEffect(() => {
    let cancelled = false;
    getInstructorModules()
      .then((result) => {
        if (cancelled) return;
        const loadedModules = Array.isArray(result) ? result : [];
        setModules(loadedModules);
        const nextModuleId = loadedModules.some((module) => module.moduleId === requestedModuleId)
          ? requestedModuleId
          : loadedModules[0]?.moduleId ?? "";
        setSelectedModuleId(nextModuleId);
        setContentLoading(Boolean(nextModuleId));
        if (requestedCreateModule) {
          setModuleDraft({ title: "" });
          setModuleEditorOpen(true);
        }
        setSearchParams(nextModuleId ? { moduleId: nextModuleId } : {});
      })
      .catch((error) => {
        if (!cancelled) setPageError(`Could not load your modules: ${error.message}`);
      })
      .finally(() => {
        if (!cancelled) setModulesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [requestedCreateModule, requestedModuleId, setSearchParams]);

  useEffect(() => {
    if (!selectedModuleId || !selectedModule) return undefined;
    let cancelled = false;
    getInstructorModuleContent(selectedModuleId)
      .then((content) => {
        if (!cancelled) setModuleContent(content);
      })
      .catch((error) => {
        if (!cancelled) {
          setModuleContent(null);
          setPageError(`Could not load this module's lessons and quizzes: ${error.message}`);
        }
      })
      .finally(() => {
        if (!cancelled) setContentLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedModule, selectedModuleId]);

  const lessonOutline = useMemo(
    () => (editingLesson ? getContentOutline(editingLesson.content) : []),
    [editingLesson],
  );

  async function refreshSelectedModule() {
    setContentLoading(true);
    try {
      const content = await getInstructorModuleContent(selectedModuleId);
      setModuleContent(content);
    } finally {
      setContentLoading(false);
    }
  }

  function selectModule(moduleId) {
    setSelectedModuleId(moduleId);
    setSearchParams(moduleId ? { moduleId } : {});
    setContentLoading(Boolean(moduleId));
    setModuleContent(null);
    setExpandedLessonId("");
    setMessage("");
    setPageError("");
  }

  async function saveModule(event) {
    event.preventDefault();
    setIsSaving(true);
    setPageError("");
    try {
      const created = await createInstructorModule({
        title: moduleDraft.title.trim(),
        description: null,
      });
      setModules((current) => [...current, created]);
      setSelectedModuleId(created.moduleId);
      setContentLoading(true);
      setSearchParams({ moduleId: created.moduleId });
      setModuleDraft({ title: "" });
      setModuleEditorOpen(false);
      setMessage(`"${created.title}" created as a draft.`);
    } catch (error) {
      setPageError(`Could not create the module: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  }

  function openNewLesson() {
    setLessonEditorOpen(true);
    setEditingLesson(null);
    setLessonDraft(emptyLesson);
    setMessage("");
  }

  function openEditLesson(lesson) {
    setLessonEditorOpen(true);
    setEditingLesson(lesson);
    setLessonDraft({
      title: lesson.title,
      description: lesson.description ?? "",
      content: lesson.content ?? "",
      videoUrl: lesson.videoUrl ?? "",
      durationMinutes: lesson.durationMinutes ?? 20,
      status: lesson.status,
    });
    setMessage("");
  }

  async function saveLesson(event) {
    event.preventDefault();
    setIsSaving(true);
    setPageError("");
    try {
      const lesson = {
        ...lessonDraft,
        description: lessonDraft.description || null,
        content: lessonDraft.content || null,
        videoUrl: lessonDraft.videoUrl.trim() || null,
      };
      if (editingLesson) {
        await updateInstructorLesson(editingLesson.lessonId, lesson);
      } else {
        await createInstructorLesson(selectedModuleId, lesson);
      }
      await refreshSelectedModule();
      setEditingLesson(null);
      setLessonEditorOpen(false);
      setMessage(`"${lesson.title}" saved.`);
    } catch (error) {
      setPageError(`Could not save the lesson: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  }

  async function moveLesson(lesson, direction) {
    setMessage("");
    setIsSaving(true);
    setPageError("");
    try {
      await moveInstructorLesson(lesson.lessonId, direction);
      await refreshSelectedModule();
    } catch (error) {
      setPageError(`Could not reorder the lesson: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  }

  async function saveQuiz(event) {
    event.preventDefault();
    setIsSaving(true);
    setPageError("");
    try {
      await addInstructorQuiz(quizLesson.lessonId, {
        title: quizDraft.title.trim(),
        passingScore: quizDraft.passingScore,
        questions: quizDraft.questions.map((question) => ({
          questionText: question.questionText.trim(),
          options: question.options.map((option) => ({
            text: option.text.trim(),
            isCorrect: option.isCorrect,
          })),
        })),
      });
      await refreshSelectedModule();
      setQuizLesson(null);
      setQuizDraft(createEmptyQuiz());
      setMessage("Quiz saved.");
    } catch (error) {
      setPageError(`Could not save the quiz: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  }

  async function addQuestionToQuiz(event) {
    event.preventDefault();
    setIsSaving(true);
    setPageError("");
    try {
      const question = {
        questionText: questionDraft.questionText.trim(),
        options: questionDraft.options.map((option) => ({
          text: option.text.trim(),
          isCorrect: option.isCorrect,
        })),
      };
      if (editingQuestionIndex === null) {
        await addInstructorQuizQuestion(questionQuiz.quiz.quizId, question);
      } else {
        await updateInstructorQuizQuestion(
          questionQuiz.quiz.quizId,
          editingQuestionIndex,
          question,
        );
      }
      await refreshSelectedModule();
      setExpandedLessonId(questionQuiz.lessonId);
      setMessage(
        editingQuestionIndex === null
          ? `Question added to "${questionQuiz.quiz.title}".`
          : `Question updated in "${questionQuiz.quiz.title}".`,
      );
      setQuestionQuiz(null);
      setQuestionDraft(createEmptyQuizQuestion());
      setEditingQuestionIndex(null);
    } catch (error) {
      setPageError(`Could not save the question: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  }

  function openQuestionEditor(quiz, lessonId, questionIndex = null) {
    setQuestionQuiz({ quiz, lessonId });
    setEditingQuestionIndex(questionIndex);
    if (questionIndex === null) {
      setQuestionDraft(createEmptyQuizQuestion());
      return;
    }

    const question = quiz.questions[questionIndex];
    setQuestionDraft({
      questionText: question.questionText,
      options: question.options.map((option) => ({
        text: option.text,
        isCorrect: option.isCorrect,
      })),
    });
  }

  async function saveExercise(event) {
    event.preventDefault();
    setIsSaving(true);
    setPageError("");
    try {
      await addInstructorExercise(selectedModuleId, {
        title: exerciseDraft.title.trim(),
        description: exerciseDraft.description.trim() || null,
      });
      await refreshSelectedModule();
      setExerciseOpen(false);
      setExerciseDraft({ title: "", description: "" });
      setMessage("Exercise added to the module.");
    } catch (error) {
      setPageError(`Could not add the exercise: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  }

  function updateQuizQuestion(questionIndex, updates) {
    setQuizDraft((draft) => ({
      ...draft,
      questions: draft.questions.map((question, index) =>
        index === questionIndex ? { ...question, ...updates } : question,
      ),
    }));
  }

  function updateQuestionOption(questionIndex, optionIndex, key, value) {
    const question = quizDraft.questions[questionIndex];
    updateQuizQuestion(questionIndex, {
      options: question.options.map((option, index) =>
        index === optionIndex ? { ...option, [key]: value } : option,
      ),
    });
  }

  return (
    <AppLayout>
      <header className="top dashboard-header">
        <div>
          <h1>Lessons &amp; quizzes</h1>
          <p>Manage the lessons and quizzes in modules you created.</p>
        </div>
      </header>

      <main className="content instructor-lessons-page">
        {pageError && <p className="instructor-lessons-error" role="alert">{pageError}</p>}
        {message && <p className="instructor-lessons-success" role="status">{message}</p>}
        {modulesLoading && <p role="status">Loading your modules…</p>}
        {!modulesLoading && !pageError && modules.length === 0 && (
          <section className="instructor-lessons-empty">
            <BookOpen size={25} aria-hidden="true" />
            <h2>You haven’t created a module yet</h2>
            <p>You need a module before you can create or edit its lessons and quizzes. Create your first module to begin.</p>
            <button
              className="instructor-first-module-link"
              type="button"
              onClick={() => {
                setModuleDraft({ title: "" });
                setModuleEditorOpen(true);
              }}
            >
              Create your first module <ArrowRight size={16} aria-hidden="true" />
            </button>
          </section>
        )}
        {contentLoading && <p role="status">Loading lessons and quizzes…</p>}

        {selectedModule && moduleContent?.moduleId === selectedModuleId && !contentLoading && (
          <section className="instructor-module-manager" aria-label={`${moduleContent.moduleTitle} lessons and quizzes`}>
            <aside className="instructor-module-selector-panel">
              <div className="instructor-module-selector-heading">
                <label htmlFor="instructor-module-selector">Module</label>
                <button
                  className="instructor-module-add-button"
                  type="button"
                  onClick={() => {
                    setModuleDraft({ title: "" });
                    setModuleEditorOpen(true);
                  }}
                >
                  <Plus size={14} aria-hidden="true" />
                  New module
                </button>
              </div>
              <select
                id="instructor-module-selector"
                value={selectedModuleId}
                disabled={modules.length === 0}
                onChange={(event) => selectModule(event.target.value)}
              >
                {modules.map((module) => (
                  <option key={module.moduleId} value={module.moduleId}>
                    {module.title}
                  </option>
                ))}
              </select>
                <span className={`instructor-lessons-module-status is-${selectedModule.status.toLowerCase()}`}>
                  {selectedModule.status}
                </span>
            </aside>

            <section className="instructor-module-lessons-panel" aria-labelledby="instructor-lesson-list-heading">
                <div className="instructor-lessons-list-heading">
                  <div>
                    <h2 id="instructor-lesson-list-heading">{moduleContent.moduleTitle}</h2>
                    <p>{lessons.length} {lessons.length === 1 ? "lesson" : "lessons"} · {exerciseCount} {exerciseCount === 1 ? "module exercise" : "module exercises"}</p>
                  </div>
                  <button
                    className="btn blue instructor-lessons-new-button"
                    type="button"
                    disabled={!selectedModuleId}
                    onClick={openNewLesson}
                  >
                    <Plus size={17} aria-hidden="true" />
                    New lesson
                  </button>
                </div>

                <section className="instructor-lessons-stats" aria-label="Module progress summary">
                  <article>
                    <span>Total lessons</span>
                    <strong>{moduleContent.totalLessons}</strong>
                    <small>In this module</small>
                  </article>
                  <article>
                    <span>Quizzes attached</span>
                    <strong>{moduleContent.attachedQuizzes}</strong>
                    <small>Across all lessons</small>
                  </article>
                  <article>
                    <span>Average quiz score</span>
                    <strong>{formatScore(averageQuizScore)}</strong>
                    <small>Completed student attempts</small>
                  </article>
                </section>

                {lessons.length === 0 ? (
                  <div className="instructor-lessons-empty">
                  <FileText size={22} aria-hidden="true" />
                  <h2>This module is ready for its first lesson</h2>
                  <p>Start shaping the learning journey by adding a lesson.</p>
                  <button className="btn blue instructor-lessons-new-button" type="button" onClick={openNewLesson}>
                    <Plus size={16} aria-hidden="true" />
                    Create first lesson
                  </button>
                </div>
              ) : (
                <div className="instructor-lessons-cards">
                  {lessons.map((lesson, index) => {
                    const isExpanded = expandedLessonId === lesson.lessonId;
                    const isPublished = lesson.status === "Published";
                    return (
                      <article className="instructor-lesson-card" key={lesson.lessonId}>
                        <div className="instructor-lesson-card-main">
                          <span className="instructor-lesson-number">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <div className="instructor-lesson-card-content">
                            <div className="instructor-lesson-title-row">
                              <h3>{lesson.title}</h3>
                              <span className={`instructor-lesson-status is-${lesson.status.toLowerCase()}`}>
                                {lesson.status}
                              </span>
                            </div>
                            <p className="instructor-lesson-description">
                              {lesson.description || "No lesson description added yet."}
                            </p>
                            <div className="instructor-lesson-metadata">
                              <button
                                className="instructor-lesson-metadata-badge"
                                type="button"
                                onClick={() => setExpandedLessonId(isExpanded ? "" : lesson.lessonId)}
                                aria-expanded={isExpanded}
                              >
                                <BookOpen size={14} aria-hidden="true" />
                                {lesson.quizzes.length} {lesson.quizzes.length === 1 ? "quiz" : "quizzes"}
                              </button>
                              <span className="instructor-lesson-metadata-badge" title="Exercises are attached at module level">
                                <Dumbbell size={14} aria-hidden="true" />
                                {exerciseCount} module {exerciseCount === 1 ? "exercise" : "exercises"}
                              </span>
                              <span className="instructor-lesson-duration">
                                <Clock3 size={14} aria-hidden="true" />
                                {lesson.durationMinutes} min
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="instructor-lesson-actions">
                          <button
                            type="button"
                            className="instructor-lesson-icon-button"
                            title="Move lesson up"
                            aria-label={`Move ${lesson.title} up`}
                            disabled={index === 0}
                            onClick={() => moveLesson(lesson, -1)}
                          >
                            <ArrowUp size={16} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            className="instructor-lesson-icon-button"
                            title="Move lesson down"
                            aria-label={`Move ${lesson.title} down`}
                            disabled={index === lessons.length - 1}
                            onClick={() => moveLesson(lesson, 1)}
                          >
                            <ArrowDown size={16} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            className="instructor-lesson-edit-button"
                            onClick={() => openEditLesson(lesson)}
                          >
                            <Pencil size={14} aria-hidden="true" />
                            Edit lesson
                          </button>
                          {isPublished && (
                            <button
                              type="button"
                              className="instructor-lesson-icon-button instructor-lesson-expand-button"
                              aria-label={`${isExpanded ? "Collapse" : "Expand"} ${lesson.title}`}
                              aria-expanded={isExpanded}
                              onClick={() => setExpandedLessonId(isExpanded ? "" : lesson.lessonId)}
                            >
                              {isExpanded
                                ? <ChevronUp size={17} aria-hidden="true" />
                                : <ChevronDown size={17} aria-hidden="true" />}
                            </button>
                          )}
                        </div>

                        {isPublished && isExpanded && (
                          <div className="instructor-lesson-expanded">
                            <section>
                              <h4><FileText size={15} aria-hidden="true" /> Lesson content outline</h4>
                              <ol>
                                {getContentOutline(lesson.content).map((line, outlineIndex) => (
                                  <li key={`${lesson.lessonId}-outline-${outlineIndex}`}>{line}</li>
                                ))}
                              </ol>
                            </section>
                            <section>
                              <h4><BookOpen size={15} aria-hidden="true" /> Quiz preview</h4>
                              {lesson.quizzes.length === 0 ? (
                                <div className="instructor-lesson-quiz-empty">
                                  <p>No quiz saved yet. Add a knowledge check when you’re ready.</p>
                                  <button
                                    type="button"
                                    className="instructor-quiz-add-existing-question"
                                    onClick={() => {
                                      setQuizLesson(lesson);
                                      setQuizDraft(createEmptyQuiz());
                                    }}
                                  >
                                    <Plus size={13} aria-hidden="true" />
                                    Create first quiz
                                  </button>
                                </div>
                              ) : lesson.quizzes.map((quiz) => (
                                <div className="instructor-lesson-quiz-preview" key={quiz.quizId}>
                                  <div className="instructor-lesson-quiz-heading">
                                    <strong>{quiz.title}</strong>
                                    <button
                                      type="button"
                                      className="instructor-quiz-add-existing-question"
                                      onClick={() => openQuestionEditor(quiz, lesson.lessonId)}
                                    >
                                      <Plus size={13} aria-hidden="true" />
                                      Add question
                                    </button>
                                  </div>
                                  <span>{quiz.questions.length} {quiz.questions.length === 1 ? "question" : "questions"} · Average score {formatScore(quiz.averageScore)}</span>
                                  <div
                                    className="instructor-lesson-quiz-questions"
                                    role="region"
                                    aria-label={`${quiz.title} questions`}
                                    tabIndex={0}
                                  >
                                    {quiz.questions.map((question, questionIndex) => (
                                      <div className="instructor-lesson-preview-question" key={`${quiz.quizId}-q-${questionIndex}`}>
                                        <p>{questionIndex + 1}. {question.questionText}</p>
                                        <ul>{question.options.map((option, optionIndex) => <li key={`${quiz.quizId}-o-${optionIndex}`}>{option.text}</li>)}</ul>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </section>
                          </div>
                        )}

                        {!isPublished && (
                          <>
                            <div className="instructor-lesson-draft-actions">
                              <span>Draft lesson · quick actions</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setQuizLesson(lesson);
                                  setQuizDraft(createEmptyQuiz());
                                }}
                              >
                                <Plus size={14} aria-hidden="true" />
                                Add quiz
                              </button>
                              <button
                                type="button"
                                onClick={() => setExerciseOpen(true)}
                              >
                                <Plus size={14} aria-hidden="true" />
                                Add exercise
                              </button>
                            </div>
                            {lesson.quizzes.length > 0 && (
                              <div className="instructor-lesson-draft-quizzes">
                                {lesson.quizzes.map((quiz) => (
                                  <div key={quiz.quizId}>
                                    <div className="instructor-draft-quiz-heading">
                                      <span>{quiz.title} · {quiz.questions.length} {quiz.questions.length === 1 ? "question" : "questions"}</span>
                                      <button
                                        type="button"
                                        onClick={() => openQuestionEditor(quiz, lesson.lessonId)}
                                      >
                                        <Plus size={13} aria-hidden="true" />
                                        Add question
                                      </button>
                                    </div>
                                    {quiz.questions.map((question, questionIndex) => (
                                      <div className="instructor-draft-quiz-question" key={`${quiz.quizId}-question-${questionIndex}`}>
                                        <span>Q{questionIndex + 1}: {question.questionText}</span>
                                        <button
                                          type="button"
                                          onClick={() => openQuestionEditor(quiz, lesson.lessonId, questionIndex)}
                                        >
                                          <Pencil size={13} aria-hidden="true" />
                                          Edit question
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </section>
        )}
      </main>

      {lessonEditorOpen && (
        <div className="instructor-content-modal-backdrop">
          <section className="instructor-content-modal" role="dialog" aria-modal="true" aria-labelledby="instructor-lesson-editor-title">
            <header>
              <div>
                <h2 id="instructor-lesson-editor-title">{editingLesson ? "Edit lesson" : "New lesson"}</h2>
                <p>{selectedModule?.title}</p>
              </div>
              <button type="button" aria-label="Close lesson editor" onClick={() => setLessonEditorOpen(false)}><X size={18} /></button>
            </header>
            <form onSubmit={saveLesson}>
              <label>Lesson title<input required minLength={3} maxLength={100} value={lessonDraft.title} onChange={(event) => setLessonDraft({ ...lessonDraft, title: event.target.value })} /></label>
              <label>Description<textarea maxLength={500} rows={2} value={lessonDraft.description} onChange={(event) => setLessonDraft({ ...lessonDraft, description: event.target.value })} /></label>
              <label>YouTube video URL<input type="url" maxLength={500} value={lessonDraft.videoUrl} onChange={(event) => setLessonDraft({ ...lessonDraft, videoUrl: event.target.value })} placeholder="https://www.youtube.com/watch?v=…" /></label>
              <div className="instructor-lesson-form-row">
                <label>Duration (minutes)<input type="number" min={1} max={600} value={lessonDraft.durationMinutes} onChange={(event) => setLessonDraft({ ...lessonDraft, durationMinutes: Number(event.target.value) })} /></label>
                <label>Status<select value={lessonDraft.status} onChange={(event) => setLessonDraft({ ...lessonDraft, status: event.target.value })}><option value="Draft">Draft</option><option value="Published">Published</option></select></label>
              </div>
              <label>Lesson content<textarea rows={8} value={lessonDraft.content} onChange={(event) => setLessonDraft({ ...lessonDraft, content: event.target.value })} placeholder={"## Learning objectives\nAdd lesson text, headings, and outline items…"} /></label>
              {lessonDraft.status === "Published" && !lessonDraft.content.trim() && <p className="instructor-lessons-alert">Published lessons need content.</p>}
              {selectedModule?.status !== "Published" && <p className="instructor-lessons-hint">Publish at least one lesson before publishing this module. Published lessons remain unavailable to students until the module is published.</p>}
              {lessonOutline.length > 0 && lessonDraft.content && <p className="instructor-lessons-hint">Outline preview: {lessonOutline.join(" · ")}</p>}
              <footer><button type="button" className="instructor-content-secondary" onClick={() => setLessonEditorOpen(false)}>Cancel</button><button type="submit" className="instructor-content-primary" disabled={isSaving}>{isSaving ? "Saving…" : "Save lesson"}</button></footer>
            </form>
          </section>
        </div>
      )}

      {moduleEditorOpen && (
        <div className="instructor-content-modal-backdrop">
          <section className="instructor-content-modal instructor-module-editor-modal" role="dialog" aria-modal="true" aria-labelledby="instructor-module-editor-title">
            <header>
              <div>
                <h2 id="instructor-module-editor-title">New module</h2>
                <p>Add a module to your instructor workspace.</p>
              </div>
              <button type="button" aria-label="Close module form" onClick={() => setModuleEditorOpen(false)}><X size={18} /></button>
            </header>
            <form onSubmit={saveModule}>
              <label>
                Module name
                <input
                  required
                  minLength={3}
                  maxLength={200}
                  value={moduleDraft.title}
                  onChange={(event) => setModuleDraft({ ...moduleDraft, title: event.target.value })}
                  autoFocus
                />
              </label>
              <p className="instructor-lessons-hint">New instructor modules start as drafts. Add lessons before publishing through the module controls.</p>
              <footer>
                <button type="button" className="instructor-content-secondary" onClick={() => setModuleEditorOpen(false)}>Cancel</button>
                <button type="submit" className="instructor-content-primary" disabled={isSaving}>
                  {isSaving ? "Creating…" : "Add module"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}

      {quizLesson && (
        <div className="instructor-content-modal-backdrop">
          <section className="instructor-content-modal" role="dialog" aria-modal="true" aria-labelledby="instructor-quiz-editor-title">
            <header>
              <div><h2 id="instructor-quiz-editor-title">Add quiz</h2><p>{quizLesson.title}</p></div>
              <button type="button" aria-label="Close quiz form" onClick={() => setQuizLesson(null)}><X size={18} /></button>
            </header>
            <form onSubmit={saveQuiz}>
              <label>Quiz title<input required minLength={3} maxLength={200} value={quizDraft.title} onChange={(event) => setQuizDraft({ ...quizDraft, title: event.target.value })} /></label>
              <div className="instructor-quiz-question-list">
                {quizDraft.questions.map((question, questionIndex) => (
                  <section className="instructor-quiz-question-editor" key={questionIndex}>
                    <div className="instructor-quiz-question-heading">
                      <h3>Question {questionIndex + 1}</h3>
                      {quizDraft.questions.length > 1 && (
                        <button
                          type="button"
                          className="instructor-quiz-remove-question"
                          onClick={() => setQuizDraft((draft) => ({
                            ...draft,
                            questions: draft.questions.filter((_, index) => index !== questionIndex),
                          }))}
                        >
                          <X size={14} aria-hidden="true" />
                          Remove
                        </button>
                      )}
                    </div>
                    <label>
                      Question text
                      <input
                        required
                        minLength={3}
                        maxLength={500}
                        value={question.questionText}
                        onChange={(event) => updateQuizQuestion(questionIndex, { questionText: event.target.value })}
                      />
                    </label>
                    <fieldset className="instructor-quiz-options">
                      <legend>Answer options · select the correct answer</legend>
                      {question.options.map((option, optionIndex) => (
                        <label key={optionIndex}>
                          <input
                            type="radio"
                            name={`correct-quiz-option-${questionIndex}`}
                            checked={option.isCorrect}
                            onChange={() => updateQuizQuestion(questionIndex, {
                              options: question.options.map((item, index) => ({
                                ...item,
                                isCorrect: index === optionIndex,
                              })),
                            })}
                          />
                          <input
                            required
                            aria-label={`Question ${questionIndex + 1}, answer option ${optionIndex + 1}`}
                            value={option.text}
                            onChange={(event) => updateQuestionOption(questionIndex, optionIndex, "text", event.target.value)}
                          />
                          {option.isCorrect && <Check size={15} aria-label="Correct answer" />}
                        </label>
                      ))}
                    </fieldset>
                  </section>
                ))}
              </div>
              <button
                type="button"
                className="instructor-quiz-add-question"
                onClick={() => setQuizDraft((draft) => ({
                  ...draft,
                  questions: [...draft.questions, createEmptyQuizQuestion()],
                }))}
              >
                <Plus size={15} aria-hidden="true" />
                Add another question
              </button>
              <label>Pass mark (%)<input type="number" min={0} max={100} value={quizDraft.passingScore} onChange={(event) => setQuizDraft({ ...quizDraft, passingScore: Number(event.target.value) })} /></label>
              <footer><button type="button" className="instructor-content-secondary" onClick={() => setQuizLesson(null)}>Cancel</button><button type="submit" className="instructor-content-primary" disabled={isSaving}>{isSaving ? "Saving…" : "Add quiz"}</button></footer>
            </form>
          </section>
        </div>
      )}

      {questionQuiz && (
        <div className="instructor-content-modal-backdrop">
          <section className="instructor-content-modal" role="dialog" aria-modal="true" aria-labelledby="instructor-existing-question-title">
            <header>
              <div>
                <h2 id="instructor-existing-question-title">
                  {editingQuestionIndex === null ? "Add a question" : "Edit question"}
                </h2>
                <p>
                  {editingQuestionIndex === null ? "Adding to" : "Editing in"} {questionQuiz.quiz.title}
                </p>
              </div>
              <button
                type="button"
                aria-label="Close question form"
                onClick={() => {
                  setQuestionQuiz(null);
                  setEditingQuestionIndex(null);
                }}
              >
                <X size={18} />
              </button>
            </header>
            <form onSubmit={addQuestionToQuiz}>
              <label>
                Question text
                <input
                  required
                  minLength={3}
                  maxLength={500}
                  value={questionDraft.questionText}
                  onChange={(event) => setQuestionDraft({ ...questionDraft, questionText: event.target.value })}
                />
              </label>
              <fieldset className="instructor-quiz-options">
                <legend>Answer options · select the correct answer</legend>
                {questionDraft.options.map((option, optionIndex) => (
                  <label key={optionIndex}>
                    <input
                      type="radio"
                      name="existing-quiz-correct-answer"
                      checked={option.isCorrect}
                      onChange={() => setQuestionDraft((draft) => ({
                        ...draft,
                        options: draft.options.map((item, index) => ({
                          ...item,
                          isCorrect: index === optionIndex,
                        })),
                      }))}
                    />
                    <input
                      required
                      aria-label={`Answer option ${optionIndex + 1}`}
                      value={option.text}
                      onChange={(event) => setQuestionDraft((draft) => ({
                        ...draft,
                        options: draft.options.map((item, index) =>
                          index === optionIndex ? { ...item, text: event.target.value } : item,
                        ),
                      }))}
                    />
                    {option.isCorrect && <Check size={15} aria-label="Correct answer" />}
                  </label>
                ))}
              </fieldset>
              {editingQuestionIndex !== null && <p className="instructor-lessons-hint">Questions that have already been answered by students cannot be edited.</p>}
              <footer>
                <button
                  type="button"
                  className="instructor-content-secondary"
                  onClick={() => {
                    setQuestionQuiz(null);
                    setEditingQuestionIndex(null);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="instructor-content-primary" disabled={isSaving}>
                  {isSaving ? "Saving…" : editingQuestionIndex === null ? "Add question" : "Save question"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}

      {exerciseOpen && (
        <div className="instructor-content-modal-backdrop">
          <section className="instructor-content-modal" role="dialog" aria-modal="true" aria-labelledby="instructor-exercise-editor-title">
            <header>
              <div><h2 id="instructor-exercise-editor-title">Add module exercise</h2><p>Exercises are attached to the module, not an individual lesson.</p></div>
              <button type="button" aria-label="Close exercise form" onClick={() => setExerciseOpen(false)}><X size={18} /></button>
            </header>
            <form onSubmit={saveExercise}>
              <label>Exercise title<input required minLength={3} maxLength={200} value={exerciseDraft.title} onChange={(event) => setExerciseDraft({ ...exerciseDraft, title: event.target.value })} /></label>
              <label>Description<textarea maxLength={2000} rows={4} value={exerciseDraft.description} onChange={(event) => setExerciseDraft({ ...exerciseDraft, description: event.target.value })} /></label>
              <p className="instructor-lessons-hint">This quick action creates a Git commit-check exercise. You can configure verification details in the exercise management page.</p>
              <footer><button type="button" className="instructor-content-secondary" onClick={() => setExerciseOpen(false)}>Cancel</button><button type="submit" className="instructor-content-primary" disabled={isSaving}>{isSaving ? "Saving…" : "Add exercise"}</button></footer>
            </form>
          </section>
        </div>
      )}
    </AppLayout>
  );
}
