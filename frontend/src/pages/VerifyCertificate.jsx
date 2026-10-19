import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "./VerifyCertificate.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5174";

export default function VerifyCertificate() {
  const { certificateNumber } = useParams();
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(
      `${API_URL}/api/certificates/verify/${encodeURIComponent(certificateNumber)}`,
    )
      .then((response) => {
        if (!response.ok)
          throw new Error("This certificate could not be verified.");
        return response.json();
      })
      .then(setCertificate)
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [certificateNumber]);

  return (
    <main className="verify-certificate-page">
      <section className="verify-certificate-panel">
        <p className="verify-eyebrow">BridgeTech verification</p>
        <h1>
          {loading
            ? "Checking certificate..."
            : certificate
              ? "Certificate verified"
              : "Certificate not verified"}
        </h1>
        {certificate ? (
          <dl>
            <div>
              <dt>Student</dt>
              <dd>{certificate.studentName}</dd>
            </div>
            <div>
              <dt>Programme/module</dt>
              <dd>{certificate.moduleTitle}</dd>
            </div>
            <div>
              <dt>Certificate number</dt>
              <dd>{certificate.certificateNumber}</dd>
            </div>
            <div>
              <dt>Issued</dt>
              <dd>
                {new Date(certificate.issuedAt).toLocaleDateString("en-ZA")}
              </dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{certificate.status}</dd>
            </div>
          </dl>
        ) : null}
        {error ? <p role="alert">{error}</p> : null}
        <Link to="/" className="btn">
          Go to BridgeTech
        </Link>
      </section>
    </main>
  );
}
