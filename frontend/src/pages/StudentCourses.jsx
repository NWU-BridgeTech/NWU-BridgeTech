import { useEffect, useState, useCallback } from "react";
import StudentLayout from "../layouts/StudentLayout";
import ExploreCourses from "../components/student/ExploreCourses";
import { apiFetch } from "../utils/apiClient";
import "./StudentCourses.css";

function CourseCard({ course, onChanged }) {
  const completed = course.lessonsDone >= course.lessonsTotal;
  const progress =
    course.lessonsTotal > 0
      ? Math.round((course.lessonsDone / course.lessonsTotal) * 100)
      : 0;

  async function handleDeregister() {
    const confirmed = window.confirm(
      `Are you sure you want to de-register from "${course.moduleTitle}"? This cannot be undone.`,
    );
    if (!confirmed) return;

    try {
      const success = await apiFetch(`/modules/${course.moduleId}/enroll`, {
        method: "DELETE",
      });
      if (success) {
        onChanged?.();
      } else {
        alert("You are not enrolled in this module.");
      }
    } catch (err) {
      alert("Could not de-register: " + err.message);
    }
  }

  return (
    <article className="course">
      <div className="course-top">
        <span className="tag">{completed ? "Completed" : "In progress"}</span>
        <span className="de-register" onClick={handleDeregister}>
          De-Register
        </span>
      </div>
      <h3>{course.moduleTitle}</h3>
      <div className="course-progress">
        <div className="progress-label">
          <span>
            {course.lessonsDone} of {course.lessonsTotal} lessons completed
          </span>
          <b>{progress}%</b>
        </div>
        <progress
          aria-label={`${course.moduleTitle} lesson completion`}
          value={course.lessonsDone}
          max={course.lessonsTotal || 1}
        />
      </div>
      <div className="course-next">
        <span className="next-label">
          {completed ? "COURSE COMPLETE" : "UP NEXT"}
        </span>
        <p className="next-task">
          {completed
            ? "You've completed every lesson."
            : course.nextLessonTitle || "No lessons yet"}
        </p>
      </div>
      <a
        className="btn blue course-action"
        href={completed ? "#" : `/lesson/${course.nextLessonId}`}
      >
        {completed ? "Review course" : "Continue lesson"}{" "}
        <span aria-hidden="true">→</span>
      </a>
    </article>
  );
}

export default function StudentCourses() {
  const [myCourses, setMyCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMyCourses = useCallback(() => {
    setLoading(true);
    return apiFetch("/user/enrollments")
      .then((data) => setMyCourses(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchMyCourses();
  }, [fetchMyCourses]);

  const activeCourses = myCourses.filter(
    (course) => course.lessonsDone < course.lessonsTotal,
  );

  return (
    <StudentLayout title="My courses">
      <div className="content student-courses">
        <section
          className="enrolled-courses"
          aria-labelledby="enrolled-heading"
        >
          <div className="enrolled-heading">
            <div>
              <h2 id="enrolled-heading">Your learning</h2>
              <p>Pick up a course and take the next step.</p>
            </div>
            <span className="enrolled-count">
              {activeCourses.length}{" "}
              {activeCourses.length === 1 ? "active course" : "active courses"}
            </span>
          </div>

          {loading && <p>Loading your courses…</p>}
          {error && <p className="error-message visible">{error}</p>}

          {!loading && !error && (
            <>
              <div className="my-grid">
                {myCourses.map((course) => (
                  <CourseCard key={course.enrollmentId} course={course} onChanged={fetchMyCourses} />
                ))}
              </div>
              {myCourses.length === 0 ? (
                <div className="explore-empty">
                  <h3>No courses yet</h3>
                  <p>Explore the catalogue below to find your first course.</p>
                  <a className="text-action" href="#explore-courses">
                    Explore courses →
                  </a>
                </div>
              ) : (
                <p className="course-preview-note enrolled-note">
                  Lesson and task actions are coming soon.
                </p>
              )}
            </>
          )}
        </section>
        <ExploreCourses onEnrolled={fetchMyCourses} />
      </div>
    </StudentLayout>
  );
}
