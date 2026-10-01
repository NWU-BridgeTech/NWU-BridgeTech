import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Award } from "lucide-react";
import StudentLayout from "../layouts/StudentLayout";
import useCurrentUser from "../hooks/useCurrentUser";
import { getToken } from "../utils/authStorage";
import "./StudentCertificates.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5174";

function formatDate(date) {
  return new Date(date).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Johannesburg",
  });
}

export default function StudentCertificates() {
  const { user, loading: userLoading, error: userError } = useCurrentUser();
  const detailsDialog = useRef(null);
  const [certificates, setCertificates] = useState([]);
  const [certificatesLoading, setCertificatesLoading] = useState(true);
  const [certificatesError, setCertificatesError] = useState("");
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [downloadError, setDownloadError] = useState("");

  useEffect(() => {
    if (!user?.userId) return;

    const token = getToken();
    fetch(`${API_URL}/api/certificates/user/${user.userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load certificates.");
        return response.json();
      })
      .then(setCertificates)
      .catch(() => setCertificatesError("Unable to load your certificates."))
      .finally(() => setCertificatesLoading(false));
  }, [user, userLoading]);

  function openDetails(certificate) {
    setDownloadError("");
    setSelectedCertificate(certificate);
    detailsDialog.current.showModal();
  }

  async function downloadCertificate(format) {
    setDownloadError("");
    const response = await fetch(
      `${API_URL}/api/certificates/${selectedCertificate.certificateId}/image?format=${format}`,
      { headers: { Authorization: `Bearer ${getToken()}` } },
    );
    if (!response.ok) {
      setDownloadError("Unable to generate this certificate image.");
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedCertificate.certificateNumber}.${format}`;
    link.click();
    URL.revokeObjectURL(url);
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

          {userError || certificatesError ? (
            <p role="alert" className="certificates-message">
              {userError || certificatesError}
            </p>
          ) : userLoading || (user?.userId && certificatesLoading) ? (
            <p className="certificates-message">Loading your certificates...</p>
          ) : certificates.length > 0 ? (
            <ul className="certificate-list">
              {certificates.map((certificate) => (
                <li
                  className="certificate-card"
                  key={certificate.certificateId}
                >
                  <div className="certificate-icon" aria-hidden="true">
                    <Award size={28} strokeWidth={1.5} />
                  </div>
                  <div className="certificate-info">
                    <span className="activity-status success">
                      Course completed
                    </span>
                    <h3>{certificate.moduleTitle || "Completed module"}</h3>
                    <p>
                      Completed{" "}
                      <time dateTime={certificate.issuedAt}>
                        {formatDate(certificate.issuedAt)}
                      </time>
                    </p>
                  </div>
                  <button
                    className="btn"
                    onClick={() => openDetails(certificate)}
                    aria-label={`View certificate: ${certificate.moduleTitle || "Completed module"}`}
                  >
                    View details <span aria-hidden="true">→</span>
                  </button>
                  <button
                    className="btn"
                    onClick={() => downloadCertificate("pdf")}
                  >
                    Download PDF
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
                <h3>{selectedCertificate.moduleTitle || "Completed module"}</h3>
                <span className="activity-status success">
                  Course completed
                </span>
              </div>
              <dl className="certificate-details">
                <div>
                  <dt>Issued to</dt>
                  <dd>
                    {user ? `${user.firstName} ${user.lastName}`.trim() : ""}
                  </dd>
                </div>
                <div>
                  <dt>Issued by</dt>
                  <dd>BridgeTech</dd>
                </div>
                <div>
                  <dt>Completion date</dt>
                  <dd>
                    <time dateTime={selectedCertificate.issuedAt}>
                      {formatDate(selectedCertificate.issuedAt)}
                    </time>
                  </dd>
                </div>
                <div>
                  <dt>Certificate number</dt>
                  <dd>{selectedCertificate.certificateNumber}</dd>
                </div>
              </dl>
              <div className="enrolment-preview">
                <p id="certificate-download-note">
                  Download a signed certificate image for sharing or printing.
                </p>
                <div className="certificate-download-actions">
                  <button
                    className="btn blue"
                    onClick={() => downloadCertificate("png")}
                  >
                    Download PNG
                  </button>
                  <button
                    className="btn"
                    onClick={() => downloadCertificate("jpeg")}
                  >
                    Download JPEG
                  </button>
                  <button
                    className="btn"
                    onClick={() => downloadCertificate("pdf")}
                  >
                    Download PDF
                  </button>
                </div>
                {downloadError ? (
                  <p className="profile-message error" role="alert">
                    {downloadError}
                  </p>
                ) : null}
              </div>
            </>
          )}
        </dialog>
      </div>
    </StudentLayout>
  );
}
