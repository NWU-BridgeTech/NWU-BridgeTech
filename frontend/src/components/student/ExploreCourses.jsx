import { useEffect, useRef, useState } from "react";
import { apiFetch } from "../../utils/apiClient";

export default function ExploreCourses({onEnrolled}) {
  const [availableModules, setAvailableModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enrollingId, setEnrollingId] = useState(null);

  const courseDetailsDialog = useRef(null);
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const query = search.trim().toLowerCase();

  useEffect(() => {
    let cancelled = false;

    apiFetch("/modules/available")
      .then((data) => {
        if (!cancelled) setAvailableModules(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const matchingCourses = availableModules.filter((course) => {
    const courseText = `${course.title} ${course.description ?? ""}`;
    return courseText.toLowerCase().includes(query);
  });

  const visibleCourses = showAll ? matchingCourses : matchingCourses.slice(0, 3);
 

  let resultsText = "No courses found";
  if (matchingCourses.length > 0) {
    const courseLabel = matchingCourses.length === 1 ? "course" : "courses";
    resultsText = `Showing ${visibleCourses.length} of ${matchingCourses.length} ${courseLabel}`;
  }

  function openCourseDetails(course) {
    setSelectedCourse(course);
    courseDetailsDialog.current.showModal();
  }

  function changeSearch(event) {
    setSearch(event.target.value);
    setShowAll(false);
  }

  function resetExplore() {
    setSearch("");
    setShowAll(false);
  }

  async function handleEnroll(moduleId) {
    setEnrollingId(moduleId);
    try {
      await apiFetch(`/modules/${moduleId}/enroll`, { method: "POST" });
      setAvailableModules((prev) =>
        prev.filter((m) => m.moduleId !== moduleId),
      );
      courseDetailsDialog.current?.close();
      window.dispatchEvent(new Event("notifications-changed"));
      onEnrolled?.();
    } catch (err) {
      alert("Could not enroll: " + err.message);
    } finally {
      setEnrollingId(null);
    }
  }

  return (
    <>
      <section className="explore-section" aria-labelledby="explore-courses">
        <div className="section-title">
          <h2 id="explore-courses">Explore courses</h2>
        </div>
        <p className="explore-intro">
          Build your next skill. Find a course that fits your interests and experience.
        </p>

        <div className="explore-tools">
          <div className="search explore-search">
            <label htmlFor="explore-search">Search available courses</label>
            <input
              id="explore-search"
              type="search"
              placeholder="Search by topic or course…"
              value={search}
              onChange={changeSearch}
            />
          </div>
        </div>

        {loading && <p role="status">Loading courses…</p>}
        {error && <p className="error-message visible">{error}</p>}

        {!loading && !error && (
          <>
            <div className="explore-results">
              <p role="status">{resultsText}</p>
              {search && (
                <button className="text-action" onClick={resetExplore}>
                  Clear filters
                </button>
              )}
            </div>

            <div className="explore-grid">
              {visibleCourses.map((course) => (
                <article className="explore-card" key={course.moduleId}>
                  <h3>{course.title}</h3>
                  <p>{course.description}</p>
                  <div className="meta">
                    <span>{course.lessonCount} lessons</span>
                  </div>
                  <button
                    className="btn explore-details-button"
                    onClick={() => openCourseDetails(course)}
                    aria-label={`View course: ${course.title}`}
                  >
                    View course <span aria-hidden="true">→</span>
                  </button>
                </article>
              ))}
            </div>

            {matchingCourses.length === 0 && (
              <div className="explore-empty">
                <h4>No courses match just yet</h4>
                <p>
                  Try another search term, or check back later for new courses.
                </p>
                {search && (
                  <button className="btn" onClick={resetExplore}>
                    Clear search
                  </button>
                )}
              </div>
            )}

            {matchingCourses.length > 3 && (
              <div className="explore-more">
                <button
                  className="btn"
                  aria-expanded={showAll}
                  onClick={() => setShowAll(!showAll)}
                >
                  {showAll
                    ? "Show fewer courses"
                    : `View all ${matchingCourses.length} courses`}
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <dialog
        className="courses-dialog course-details-dialog"
        ref={courseDetailsDialog}
        aria-labelledby="course-details-heading"
      >
        <div className="action-heading">
          <h3 id="course-details-heading">
            {selectedCourse?.title || "Course details"}
          </h3>
          <button
            className="btn"
            onClick={() => courseDetailsDialog.current.close()}
            autoFocus
          >
            Close
          </button>
        </div>
        {selectedCourse && (
          <>
            <div className="meta">
              <span>{selectedCourse.lessonCount} lessons</span>
            </div>
            <p>{selectedCourse.description}</p>

            {selectedCourse.lessonTitles?.length > 0 && (
              <>
                <h4>What you'll learn</h4>
                <ul>
                  {selectedCourse.lessonTitles.map((title, i) => (
                    <li key={i}>{title}</li>
                  ))}
                </ul>
              </>
            )}

            <div className="enrolment-preview">
              <button
                className="btn blue"
                disabled={enrollingId === selectedCourse.moduleId}
                onClick={() => handleEnroll(selectedCourse.moduleId)}
              >
                {enrollingId === selectedCourse.moduleId
                  ? "Registering…"
                  : "Register for course"}
              </button>
            </div>
          </>
        )}
      </dialog>
    </>
  );
}
