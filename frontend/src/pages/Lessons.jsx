import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import StudentLayout from "../layouts/StudentLayout";
import './Lessons.css';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5174";

const lesson = {
  moduleName: "Cloud Basics",
  lessonNumber: 1,
  lessonTotal: 6,
  lessonTitle: "Introduction to Cloud Basics",
  content: `Cloud computing is the delivery of computing services — servers, storage, databases, networking, software — over the internet ("the cloud") instead of owning and maintaining physical infrastructure.

In this lesson, you'll learn the core service models (IaaS, PaaS, SaaS), the major deployment types (public, private, hybrid), and why cloud platforms have become the default choice for modern software teams.

By the end of this lesson, you should be able to explain what "the cloud" actually means, identify the differences between the major service models, and understand why scalability and elasticity matter for real-world applications.`,
  videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=RDdQw4w9WgXcQ&start_radio=1",
};

function getYouTubeThumbnail(url) {
  if (!url) return null;

  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );

  return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : null;
}

export default function LessonView() {
  const { lessonId } = useParams();
  const [lessonData, setLessonData] = useState(null);
  const [isLoading, setIsLoading] = useState(Boolean(lessonId));
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!lessonId) {
      setLessonData(null);
      setIsLoading(false);
      setLoadError("");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setLoadError("Sign in to view this lesson and its summary.");
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    setLoadError("");

    fetch(`${API_URL}/api/lessons/${lessonId}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            response.status === 404
              ? "This lesson could not be found."
              : "Could not load this lesson. Please try again."
          );
        }
        return response.json();
      })
      .then((data) => setLessonData(data))
      .catch((error) => {
        if (error.name !== "AbortError") setLoadError(error.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [lessonId]);

  const displayedLesson = lessonId
    ? {
        moduleName: "Lesson",
        lessonNumber: lessonData?.orderIndex ?? 0,
        lessonTotal: lesson.lessonTotal,
        lessonTitle: lessonData?.title ?? (loadError ? "Lesson unavailable" : "Loading lesson..."),
        content: lessonData?.content ?? "",
        videoUrl: lessonData?.videoUrl ?? "",
        aiSummary: lessonData?.aiSummary ?? "",
      }
    : { ...lesson, aiSummary: "" };

  const progressPercent = Math.round(
    (displayedLesson.lessonNumber - 1) / displayedLesson.lessonTotal * 100
  );

  return (
    <StudentLayout title={displayedLesson.moduleName}>
      <div className="content lesson-view">
        <section className="lesson-header">
          <h2 className="lesson-title">
            Lesson {displayedLesson.lessonNumber || ""}: {displayedLesson.lessonTitle}
          </h2>

          <div className="lesson-progress">
            <div className="lesson-progress-bar">
              <div
                className="lesson-progress-fill"
                style={{ width: `${Math.max(0, progressPercent)}%` }}
              />
            </div>
            <span className="lesson-progress-label">
              Lesson {displayedLesson.lessonNumber || "-"} of {displayedLesson.lessonTotal}
            </span>
          </div>
        </section>

        <div className="lesson-body">
          <div className="lesson-content-card">
            <h3>Description</h3>
            <div className="lesson-content-scroll">
              {displayedLesson.content.split("\n\n").map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          </div>

        <aside className="lesson-side-card">
            <h3>Video Summary</h3>
            <p className="lesson-side-label">Video summary</p>

            {displayedLesson.videoUrl && (
              <a
                href={displayedLesson.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="lesson-video-link"
              >
                {getYouTubeThumbnail(displayedLesson.videoUrl) && (
                  <img
                    src={getYouTubeThumbnail(displayedLesson.videoUrl)}
                    alt={`Watch ${displayedLesson.lessonTitle} on YouTube`}
                    className="lesson-video-thumbnail"
                  />
                )}
              </a>
            )}

            <div className="lesson-ai-summary" aria-live="polite">
              {isLoading ? (
                <p>Loading video summary...</p>
              ) : loadError ? (
                <p role="alert">{loadError}</p>
              ) : displayedLesson.aiSummary ? (
                displayedLesson.aiSummary.split("\n\n").map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))
              ) : (
                <p>An AI summary has not been generated for this lesson yet.</p>
              )}
            </div>
        </aside>
        </div>

        <div className="lesson-footer-card">
            <div className="lesson-quiz-btn">
            Take the Quiz
            </div>
            
            <div className="lesson-nav-group">
                <div className="lesson-previous-btn">
                Previous Lesson
                </div>

                <div className="lesson-next-btn">
                Next Lesson
                </div>
                </div>
            </div>
      </div>
    </StudentLayout>
  );
}