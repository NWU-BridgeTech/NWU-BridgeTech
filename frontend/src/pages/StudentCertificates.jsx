import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Award } from "lucide-react";
import StudentLayout from "../layouts/StudentLayout";
import { certificates, student } from "../data/studentDashboard";
import "./StudentCertificates.css";

function formatDate(date) {
  return new Date(`${date}T00:00:00+02:00`).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Johannesburg",
  });
}

export default function StudentCertificates() {
  const detailsDialog = useRef(null);
  const [selectedCertificate, setSelectedCertificate] = useState(null);

  function openDetails(certificate) {
    setSelectedCertificate(certificate);
    detailsDialog.current.showModal();
  }

  return (
    <StudentLayout title="Certificates">
      <div className="content student-certificates">
        <section aria-labelledby="earned-certificates-heading">
          <div className="certificates-heading">
            <div>
              <h2 id="earned-certificates-heading">Your achievements</h2>
              <p>A record of the courses you’ve completed.</p>
            </div>
            <span className="certificate-count">
              {certificates.length}{" "}
              {certificates.length === 1
                ? "certificate earned"
                : "certificates earned"}
            </span>
          </div>

          {certificates.length > 0 ? (
            <ul className="certificate-list">
              {certificates.map((certificate) => (
                <li className="certificate-card" key={certificate.id}>
                  <div className="certificate-icon" aria-hidden="true">
                    <Award size={28} strokeWidth={1.5} />
                  </div>
                  <div className="certificate-info">
                    <span className="activity-status success">
                      Course completed
                    </span>
                    <h3>{certificate.course}</h3>
                    <p>
                      Issued{" "}
                      <time dateTime={certificate.issuedAt}>
                        {formatDate(certificate.issuedAt)}
                      </time>
                    </p>
                  </div>
                  <button
                    className="btn"
                    onClick={() => openDetails(certificate)}
                    aria-label={`View certificate: ${certificate.course}`}
                  >
                    View details <span aria-hidden="true">→</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="certificates-empty">
              <Award size={32} strokeWidth={1.5} aria-hidden="true" />
              <h3>Your first certificate starts with a course</h3>
              <p>When you earn a certificate, it will appear here.</p>
              <Link className="btn" to="/student/courses">
                Go to my courses
              </Link>
            </div>
          )}
        </section>

        {certificates.length > 0 && (
          <div className="certificate-next-step">
            <p>Keep building your skills with your next course.</p>
            <Link className="text-action" to="/student/courses">
              Go to my courses →
            </Link>
          </div>
        )}

        <dialog
          className="courses-dialog course-details-dialog"
          ref={detailsDialog}
          aria-labelledby="certificate-details-heading"
        >
          <div className="action-heading">
            <h2 id="certificate-details-heading">Certificate details</h2>
            <button
              className="btn"
              onClick={() => detailsDialog.current.close()}
              autoFocus
            >
              Close
            </button>
          </div>
          {selectedCertificate && (
            <>
              <div className="certificate-detail-summary">
                <Award size={36} strokeWidth={1.5} aria-hidden="true" />
                <h3>{selectedCertificate.course}</h3>
                <span className="activity-status success">
                  Course completed
                </span>
              </div>
              <dl className="certificate-details">
                <div>
                  <dt>Issued to</dt>
                  <dd>{student.displayName}</dd>
                </div>
                <div>
                  <dt>Issued by</dt>
                  <dd>BridgeTech</dd>
                </div>
                <div>
                  <dt>Issue date</dt>
                  <dd>
                    <time dateTime={selectedCertificate.issuedAt}>
                      {formatDate(selectedCertificate.issuedAt)}
                    </time>
                  </dd>
                </div>
              </dl>
              <div className="enrolment-preview">
                <p id="certificate-download-note">
                  Certificate PDF downloads are coming soon.
                </p>
                <button
                  className="btn blue"
                  disabled
                  aria-describedby="certificate-download-note"
                >
                  Download PDF
                </button>
              </div>
            </>
          )}
        </dialog>
      </div>
    </StudentLayout>
  );
}
