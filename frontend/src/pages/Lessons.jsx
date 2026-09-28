import StudentLayout from "../layouts/StudentLayout";
import './Lessons.css';

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
  const progressPercent = Math.round(
    (lesson.lessonNumber - 1) / lesson.lessonTotal * 100
  );

  return (
    <StudentLayout title={lesson.moduleName}>
      <div className="content lesson-view">
        <section className="lesson-header">
          <h2 className="lesson-title">
            Lesson {lesson.lessonNumber}: {lesson.lessonTitle}
          </h2>

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
              {lesson.content.split("\n\n").map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          </div>

        <aside className="lesson-side-card">
            <h3>Video Summary</h3>
            <p className="lesson-side-label">Watch the video summary before starting the quiz</p>

            <a
              href={lesson.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="lesson-video-link"
            >
                {getYouTubeThumbnail(lesson.videoUrl) && (
                    <img
                        src={getYouTubeThumbnail(lesson.videoUrl)}
                        alt={lesson.lessonTitle}
                        className="lesson-video-thumbnail"
                    />
                    )}
            </a>
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