import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import StudentLayout from "../layouts/StudentLayout";
import { apiFetch } from "../utils/apiClient";
import "./Lessons.css";

function getYouTubeThumbnail(url) {
  if (!url) return null;
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  );
  return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : null;
}

export default function LessonView() {
  const { moduleId, lessonId } = useParams();
  const navigate = useNavigate();

  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completing, setCompleting] = useState(false);
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setActionError(null);

    const path = lessonId
      ? `/lessons/${lessonId}/view`
      : `/modules/${moduleId}/lessons/current`;

    apiFetch(path)
      .then((data) => !cancelled && setLesson(data))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [moduleId, lessonId]);

  const goToLesson = (id) => navigate(`/modules/${moduleId}/lessons/${id}`);

  async function handleNext() {
    // Already-completed lesson: just move forward
    if (lesson.completed) {
      lesson.nextLessonId
        ? goToLesson(lesson.nextLessonId)
        : navigate("/courses"); // adjust to your courses route
      return;
    }

    setCompleting(true);
    setActionError(null);
    try {
      await apiFetch(`/lessons/${lesson.lessonId}/complete`, {
        method: "POST",
      });
      lesson.nextLessonId
        ? goToLesson(lesson.nextLessonId)
        : navigate("/courses");
    } catch (err) {
      setActionError(err.message);
    } finally {
      setCompleting(false);
    }
  }

  if (loading)
    return (
      <StudentLayout title="Lesson">
        <div className="content">
          <p>Loading lesson…</p>
        </div>
      </StudentLayout>
    );
  if (error)
    return (
      <StudentLayout title="Lesson">
        <div className="content">
          <p className="error-message visible">{error}</p>
        </div>
      </StudentLayout>
    );
  if (!lesson) return null;

  const progressPercent = Math.round(
    ((lesson.lessonNumber - 1) / lesson.lessonTotal) * 100,
  );
  const thumbnail = getYouTubeThumbnail(lesson.videoUrl);
  const isLast = !lesson.nextLessonId;
  const nextDisabled = completing || (!lesson.completed && !lesson.canComplete);

  const nextLabel = completing
    ? "Saving…"
    : lesson.completed
      ? isLast
        ? "Back to courses"
        : "Next Lesson"
      : isLast
        ? "Finish Course"
        : "Next Lesson";

  return (
    <StudentLayout title={lesson.moduleTitle}>
      <div className="content lesson-view">
        <section className="lesson-header">
          <h2 className="lesson-title">{lesson.title}</h2>
          <div className="lesson-progress">
            <div className="lesson-progress-bar">
              <div
                className="lesson-progress-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="lesson-progress-label">
              Lesson {lesson.lessonNumber} of {lesson.lessonTotal}
            </span>
          </div>
        </section>

        <div className="lesson-body">
          <div className="lesson-content-card">
            <h3>Description</h3>
            <div className="lesson-content-scroll">
              {(lesson.content ?? "").split("\n\n").map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>

          {lesson.videoUrl ? (
            <aside className="lesson-side-card">
              <h3>Video Summary</h3>
              <p className="lesson-side-label">
                Watch the video summary before starting the quiz
              </p>

              <a
                href={lesson.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="lesson-video-link"
              >
                {thumbnail ? (
                  <img
                    src={thumbnail}
                    alt={`Video summary for ${lesson.title}`}
                    className="lesson-video-thumbnail"
                  />
                ) : (
                  lesson.videoUrl
                )}
              </a>
            </aside>
          ) : (
            <aside className="lesson-side-card">
              <h3>Video Summary</h3>
              <p className="lesson-side-label">
                No video summary available for this lesson.
              </p>
            </aside>
          )}
        </div>

        <div className="lesson-footer-card">
          {lesson.quiz ? (
            <div className="lesson-quiz-group">
              <Link
                to={`/quizzes/${lesson.quiz.quizId}`}
                className="lesson-quiz-btn"
              >
                {lesson.quiz.bestScore == null
                  ? "Take the Quiz"
                  : "Retake the Quiz"}
              </Link>
            </div>
          ) : (
            <span />
          )}

          <div className="lesson-nav-group">
            <button
              type="button"
              className="lesson-previous-btn"
              disabled={!lesson.previousLessonId}
              onClick={() => goToLesson(lesson.previousLessonId)}
            >
              Previous Lesson
            </button>
            <button
              type="button"
              className="lesson-next-btn"
              disabled={nextDisabled}
              onClick={handleNext}
            >
              {nextLabel}
            </button>
          </div>

          {actionError && (
            <p className="error-message visible">{actionError}</p>
          )}
        </div>
      </div>
    </StudentLayout>
  );
}
