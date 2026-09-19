import StudentLayout from "../layouts/StudentLayout";
import { attentionItems } from "../data/studentDashboard";

export default function StudentAssessments() {
  const assessments = attentionItems.filter(
    (item) => item.type === "assessment",
  );

  return (
    <StudentLayout>
      <div className="content">
        <div className="welcome">
          <h1>Assessments</h1>
        </div>
        <p className="course-preview-note">
          Assessment actions are coming soon.
        </p>
        <section className="attention-card">
          <ul className="attention-list">
            {assessments.map((item) => (
              <li key={item.id}>
                <span className={`activity-status ${item.tone}`}>
                  {item.status}
                </span>
                <h4>{item.title}</h4>
                <p className="attention-course">{item.course}</p>
                <p>{item.detail}</p>
                <button className="btn" disabled>
                  {item.action}
                </button>
              </li>
            ))}
          </ul>
          {assessments.length === 0 && (
            <p>No assessments need your attention right now.</p>
          )}
        </section>
      </div>
    </StudentLayout>
  );
}
