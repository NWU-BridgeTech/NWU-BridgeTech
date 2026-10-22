import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import VerificationModal from "../components/VerificationModal";
import AuthShell from "../components/AuthShell";
import { PHOTOS } from "../components/authPhotos";
import { API_URL } from "@/config";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [verification, setVerification] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function requestCode(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const normalizedEmail = email.trim().toLowerCase();

    try {
      const response = await fetch(`${API_URL}/api/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "We could not send a verification code.");
      }

      setVerification({ email: normalizedEmail, expiresAt: data.expiresAt });
    } catch (requestError) {
      setError(requestError.message || "Unable to send a verification code.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      photo={PHOTOS.signin}
      title="Finish setting up your account."
      text="Enter the email you used to sign up and we’ll send a fresh verification code."
    >
      {verification && (
        <VerificationModal
          email={verification.email}
          initialExpiresAt={verification.expiresAt}
          onClose={() => setVerification(null)}
          onVerified={() => navigate("/home", { replace: true })}
        />
      )}

      <form className="au-form-compact" onSubmit={requestCode}>
        <h1>Verify your email</h1>
        <p className="au-lede">
          Already started signing up? Enter your email to continue where you left off.
        </p>

        {error && (
          <div className="au-alert error" role="alert">
            {error}
          </div>
        )}

        <div className="au-field">
          <label htmlFor="verification-email">Email address</label>
          <input
            id="verification-email"
            className="au-input"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            disabled={loading}
          />
        </div>

        <button className="au-button" type="submit" disabled={loading}>
          {loading ? "Sending code..." : "Send verification code"}
        </button>

        <p className="au-switch">
          Need to start over? <Link to="/signup">Create an account</Link>
        </p>
      </form>
    </AuthShell>
  );
}
