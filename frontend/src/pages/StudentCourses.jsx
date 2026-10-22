
import { useEffect, useState, useCallback } from "react";
import StudentLayout from "../layouts/StudentLayout";
import ExploreCourses from "../components/student/ExploreCourses";
import { apiFetch } from "../utils/apiClient";
import "./StudentCourses.css";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";


function CourseCard({ course, onChanged }) {
  const [showDeregisterModal, setShowDeregisterModal] = useState(false);
  const [deregistering, setDeregistering] = useState(false);
  const [deregisterError, setDeregisterError] = useState("");

  const completed =
    course.lessonsTotal > 0 &&
    course.lessonsDone >= course.lessonsTotal;

  const progress =
    course.lessonsTotal > 0
      ? Math.round(
          (course.lessonsDone / course.lessonsTotal) * 100
        )
      : 0;

  async function handleDeregister() {
    setDeregistering(true);
    setDeregisterError("");

    try {
      const success = await apiFetch(
        `/api/modules/${course.moduleId}/enroll`,
        { method: "DELETE" }
      );

      if (!success) {
        throw new Error("You are not enrolled in this module.");
      }

      setShowDeregisterModal(false);
      await onChanged?.();
    } catch (err) {
      setDeregisterError(
        err.message || "Could not de-register from this course."
      );
    } finally {
      setDeregistering(false);
    }
  }

  return (
    <>
      <article className="course">
        <div className="course-top">
          <span className="tag">
            {completed ? "Completed" : "In progress"}
          </span>

          {!completed && (
            <button
              type="button"
              className="de-register"
              onClick={() => {
                setDeregisterError("");
                setShowDeregisterModal(true);
              }}
            >
              De-Register
            </button>
          )}
        </div>

        <h3>{course.moduleTitle}</h3>

        <div className="course-progress">
          <div className="progress-label">
            <span>
              {course.lessonsDone} of{" "}
              {course.lessonsTotal} lessons completed
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
          href={`/modules/${course.moduleId}/lessons`}
        >
          {completed ? "Review course" : "Continue lesson"}{" "}
          <span aria-hidden="true">→</span>
        </a>
      </article>

      <ConfirmDeleteModal
        open={showDeregisterModal}
        title="De-register from course?"
        message={`Are you sure you want to de-register from "${course.moduleTitle}"? You will be removed from this course.`}
        confirmText="De-register"
        loading={deregistering}
        onConfirm={handleDeregister}
        onCancel={() => {
          if (deregistering) return;
          setShowDeregisterModal(false);
          setDeregisterError("");
        }}
      />

      {deregisterError && (
        <p className="error-message visible" role="alert">
          {deregisterError}
        </p>
      )}
    </>
  );
}


export default function StudentCourses() {
  const [myCourses, setMyCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exploreRefreshKey, setExploreRefreshKey] = useState(0);

  const fetchMyCourses = useCallback(() => {
    setLoading(true);
    setError(null);

    return apiFetch("/api/user/enrollments")
      .then((data) => setMyCourses(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  
const handleEnrollmentChanged = useCallback(async () => {
  // Refresh the student's enrolled modules.
  await fetchMyCourses();

  // Reload the Explore Courses component so that
  // its available modules and enrollment statuses refresh.
  setExploreRefreshKey((previous) => previous + 1);
}, [fetchMyCourses]);


  useEffect(() => {
    fetchMyCourses();
  }, [fetchMyCourses]);

  // Separate completed modules from active modules.
  const completedCourses = myCourses.filter(
    (course) =>
      course.lessonsTotal > 0 &&
      course.lessonsDone >= course.lessonsTotal,
  );

  const activeCourses = myCourses.filter(
    (course) =>
      course.lessonsTotal === 0 ||
      course.lessonsDone < course.lessonsTotal,
  );

  return (
    <StudentLayout title="My courses">
      <div className="content student-courses">

        {/* ACTIVE COURSES */}
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
              {activeCourses.length === 1
                ? "active course"
                : "active courses"}
            </span>
          </div>

          {loading && <p>Loading your courses…</p>}

          {error && (
            <p className="error-message visible">{error}</p>
          )}

          {!loading && !error && (
            <>
              <div className="my-grid">
                {activeCourses.map((course) => (
                  <CourseCard
                  key={course.enrollmentId}
                  course={course}
                  onChanged={handleEnrollmentChanged}
                />
                ))}
              </div>

              {myCourses.length === 0 ? (
                <div className="explore-empty">
                  <h3>No courses yet</h3>
                  <p>
                    Explore the catalogue below to find your
                    first course.
                  </p>

                  <a
                    className="text-action"
                    href="#explore-courses"
                  >
                    Explore courses →
                  </a>
                </div>
              ) : activeCourses.length === 0 ? (
                <div className="explore-empty">
                  <h3>All caught up!</h3>
                  <p>
                    You have no courses in progress.
                    Your completed modules are listed below.
                  </p>
                </div>
              ) : null}
            </>
          )}
        </section>

        {/* EXPLORE COURSES */}
        
        <ExploreCourses
          key={exploreRefreshKey}
          onEnrolled={handleEnrollmentChanged}
        />


        {/* COMPLETED MODULES */}
        <section
          className="completed-courses"
          aria-labelledby="completed-heading"
        >
          <div className="enrolled-heading">
            <div>
              <h2 id="completed-heading">
                Completed modules
              </h2>
              <p>
                Revisit modules you've finished whenever
                you like.
              </p>
            </div>

            <span className="enrolled-count completed-count">
              {completedCourses.length}{" "}
              {completedCourses.length === 1
                ? "completed module"
                : "completed modules"}
            </span>
          </div>

          {loading && (
            <p>Loading completed modules…</p>
          )}

          {!loading && !error && (
            completedCourses.length > 0 ? (
              <div className="my-grid">
                {completedCourses.map((course) => (
                  <CourseCard
                    key={course.enrollmentId}
                    course={course}
                    onChanged={fetchMyCourses}
                  />
                ))}
              </div>
            ) : (
              <p className="completed-empty">
                You haven't completed any modules yet.
              </p>
            )
          )}
        </section>

      </div>
    </StudentLayout>
  );
}
