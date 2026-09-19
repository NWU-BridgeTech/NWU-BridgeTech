import { useRef, useState } from "react";
import {
  exploreCourses,
  courseCategories,
  courseRecommendation,
} from "../../data/studentDashboard";

export default function ExploreCourses() {
  const recommendedCourse = exploreCourses.find(
    (course) => course.number === courseRecommendation.courseNumber,
  );
  const courseDetailsDialog = useRef(null);
  const [category, setCategory] = useState("All courses");
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const query = search.trim().toLowerCase();

  const matchingCourses = exploreCourses.filter((course) => {
    const matchesCategory =
      category === "All courses" || course.category === category;
    const courseText = `${course.title} ${course.description} ${course.category} ${course.level}`;
    const matchesSearch = courseText.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });
  const visibleCourses = showAll
    ? matchingCourses
    : matchingCourses.slice(0, 3);

  let resultsText = "No courses found";
  if (matchingCourses.length > 0) {
    const courseLabel = matchingCourses.length === 1 ? "course" : "courses";
    resultsText = `Showing ${visibleCourses.length} of ${matchingCourses.length} ${courseLabel}`;
  }

  function openCourseDetails(course) {
    setSelectedCourse(course);
    courseDetailsDialog.current.showModal();
  }

  function changeCategory(nextCategory) {
    setCategory(nextCategory);
    setShowAll(false);
  }

  function changeSearch(event) {
    setSearch(event.target.value);
    setShowAll(false);
  }

  function resetExplore() {
    setCategory("All courses");
    setSearch("");
    setShowAll(false);
  }

  return (
    <>
      <section className="explore-section" aria-labelledby="explore-courses">
        <div className="section-title">
          <h3 id="explore-courses">Explore Courses</h3>
        </div>
        <p className="explore-intro">
          Build your next skill. Find a course that fits your interests and
          experience.
        </p>

        <div className="explore-tools">
          <div
            className="filters"
            role="group"
            aria-label="Filter courses by category"
          >
            {courseCategories.map((filter) => (
              <button
                className={`filter${category === filter ? " active" : ""}`}
                key={filter}
                aria-pressed={category === filter}
                onClick={() => changeCategory(filter)}
              >
                {filter}
              </button>
            ))}
          </div>
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
        <div className="explore-results">
          <p role="status">{resultsText}</p>
          {(search || category !== "All courses") && (
            <button className="text-action" onClick={resetExplore}>
              Clear filters
            </button>
          )}
        </div>

        <div className="explore-grid">
          {visibleCourses.map((course) => (
            <article className="explore-card" key={course.number}>
              <div className="explore-card-top">
                <span className="tag">{course.category}</span>
                <span className="course-level">{course.level}</span>
              </div>
              <h4>{course.title}</h4>
              <p>{course.description}</p>
              <div className="meta">
                <span>{course.lessons} lessons</span>
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
              Try another topic or category to explore the available courses.
            </p>
            <button className="btn" onClick={resetExplore}>
              Show all categories
            </button>
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
              <span>{selectedCourse.category}</span>
              <span>{selectedCourse.level}</span>
              <span>{selectedCourse.lessons} lessons</span>
            </div>
            <p>{selectedCourse.description}</p>
            <h4>What you’ll learn</h4>
            <ul>
              {selectedCourse.outcomes.map((outcome) => (
                <li key={outcome}>{outcome}</li>
              ))}
            </ul>
            <h4>Before you start</h4>
            <p>{selectedCourse.prerequisite}</p>
            <div className="enrolment-preview">
              <p id="enrolment-preview-note">
                Registration is not available yet.
              </p>
              <button
                className="btn blue"
                disabled
                aria-describedby="enrolment-preview-note"
              >
                Register for course
              </button>
            </div>
          </>
        )}
      </dialog>

      <div className="recommend">
        <div>
          <h3>Recommended for you</h3>
          <p>{courseRecommendation.description}</p>
        </div>
        <button
          className="btn blue"
          disabled={!recommendedCourse}
          onClick={() => openCourseDetails(recommendedCourse)}
        >
          View course
        </button>
      </div>
    </>
  );
}
