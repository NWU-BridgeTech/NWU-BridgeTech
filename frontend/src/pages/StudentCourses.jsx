import StudentLayout from "../layouts/StudentLayout";
import ExploreCourses from "../components/student/ExploreCourses";
import { myCourses } from "../data/studentDashboard";
import "./StudentCourses.css";

function CourseCard({ course }) {
  const completed = course.lessonsDone >= course.lessonsTotal;
  const progress =
    course.lessonsTotal > 0
      ? Math.round((course.lessonsDone / course.lessonsTotal) * 100)
      : 0;

  return (
    <article className="course">
      <div className="course-top">
        <span className="tag">{completed ? "Completed" : "In progress"}</span>
      </div>
      <h3>{course.title}</h3>
      <div className="course-progress">
        <div className="progress-label">
          <span>
            {course.lessonsDone} of {course.lessonsTotal} lessons completed
          </span>
          <b>{progress}%</b>
        </div>
        <progress
          aria-label={`${course.title} lesson completion`}
          value={course.lessonsDone}
          max={course.lessonsTotal || 1}
        />
      </div>
      <div className="course-next">
        <span className="next-label">
          {completed ? "COURSE COMPLETE" : "UP NEXT"}
        </span>
        <p className="next-task">
          {completed ? "You’ve completed every lesson." : course.nextTask}
        </p>
        {!completed && <p className="task-type">{course.taskType}</p>}
      </div>
      <button className="btn blue course-action" disabled>
        {completed ? "Review course" : course.action}{" "}
        <span aria-hidden="true">→</span>
      </button>
    </article>
  );
}

export default function StudentCourses() {
  const activeCourses = myCourses.filter(
    (course) => course.lessonsDone < course.lessonsTotal,
  );

  return (
    <StudentLayout title="My courses">
      <div className="content student-courses">
        <section className="enrolled-courses" aria-labelledby="enrolled-heading">
          <div className="enrolled-heading">
            <div>
              <h2 id="enrolled-heading">Your learning</h2>
              <p>Pick up a course and take the next step.</p>
            </div>
            <span className="enrolled-count">
              {activeCourses.length} {activeCourses.length === 1 ? "active course" : "active courses"}
            </span>
          </div>
          <div className="my-grid">
            {myCourses.map((course) => (
              <CourseCard key={course.number} course={course} />
            ))}
          </div>
          {myCourses.length === 0 ? (
            <div className="explore-empty">
              <h3>No courses yet</h3>
              <p>Explore the catalogue below to find your first course.</p>
              <a className="text-action" href="#explore-courses">Explore courses →</a>
            </div>
          ) : (
            <p className="course-preview-note enrolled-note">
              Lesson and task actions are coming soon.
            </p>
          )}
        </section>
        <ExploreCourses />
      </div>
    </StudentLayout>
  );
}
