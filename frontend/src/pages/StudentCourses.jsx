import StudentLayout from "../layouts/StudentLayout";
import ExploreCourses from "../components/student/ExploreCourses";
import { myCourses } from "../data/studentDashboard";

function CourseCard({ course }) {
  const completed = course.lessonsDone >= course.lessonsTotal;
  const progress =
    course.lessonsTotal > 0
      ? Math.round((course.lessonsDone / course.lessonsTotal) * 100)
      : 0;

  return (
    <article className="course">
      <div className="course-top">
        <span className="tag">{completed ? "COMPLETED" : "IN PROGRESS"}</span>
        <small>{course.number}</small>
      </div>
      <h4>{course.title}</h4>
      <div className="course-next">
        <span className="next-label">
          {completed ? "COURSE COMPLETE" : "UP NEXT"}
        </span>
        <p className="next-task">
          {completed ? "You’ve completed every lesson." : course.nextTask}
        </p>
        {!completed && <p className="task-type">{course.taskType}</p>}
      </div>
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
      <button className="btn blue course-action" disabled>
        {completed ? "Review course" : course.action}{" "}
        <span aria-hidden="true">→</span>
      </button>
    </article>
  );
}

export default function StudentCourses() {
  return (
    <StudentLayout title="My courses">
      <div className="content">
        <p className="course-preview-note">
          Lesson and task actions are coming soon.
        </p>
        <div className="my-grid">
          {myCourses.map((course) => (
            <CourseCard key={course.number} course={course} />
          ))}
        </div>
        {myCourses.length === 0 && (
          <p>You haven’t registered for any courses yet.</p>
        )}
        <ExploreCourses />
      </div>
    </StudentLayout>
  );
}
