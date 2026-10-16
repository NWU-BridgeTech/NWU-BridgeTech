import { Link } from "react-router-dom";

export default function InstructorCourseCard({ course, showStudentProgressAction = true }) {
  return (
    <article className="instructor-course-card">
      <div className="instructor-course-title-row">
        <h3>{course.title}</h3>
        <span
          className={`instructor-course-status ${course.status === "Published" ? "is-published" : "is-draft"}`}
        >
          {course.status}
        </span>
      </div>
      <div className="instructor-course-stats">
        <div>
          <span>Students enrolled</span>
          <strong>{course.studentCount}</strong>
        </div>
        <div>
          <span>Students who completed</span>
          <strong>{course.completionPercentage}%</strong>
        </div>
        <div>
          <span>Lessons</span>
          <strong>{course.lessonCount}</strong>
        </div>
      </div>
      <div
        className="instructor-course-progress-track"
        role="progressbar"
        aria-label={`${course.title} student completion`}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow={course.completionPercentage}
      >
        <span style={{ width: `${course.completionPercentage}%` }} />
      </div>
      <div className="instructor-course-actions">
        <Link className="instructor-course-button" to="/instructor/modules">
          Edit module
        </Link>
        <Link className="instructor-course-button" to="/instructor/lessons">
          Manage Lessons &amp; quizzes
        </Link>
        {showStudentProgressAction && (
          <Link className="instructor-course-button" to="/instructor/modules">
            Check student progress
          </Link>
        )}
      </div>
    </article>
  );
}
