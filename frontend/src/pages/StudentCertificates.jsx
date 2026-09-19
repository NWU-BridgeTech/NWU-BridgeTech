import StudentLayout from "../layouts/StudentLayout";
import { student } from "../data/studentDashboard";

export default function StudentCertificates() {
  return (
    <StudentLayout title="Certificates">
      <div className="content">
        <dl className="stats" aria-label="Certificates summary">
          <div className="stat">
            <dt>Certificates earned</dt>
            <dd>{student.certificatesEarned}</dd>
            <span>Recognising your completed work</span>
          </div>
        </dl>
      </div>
    </StudentLayout>
  );
}
