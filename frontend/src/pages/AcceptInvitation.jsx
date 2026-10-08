import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthShell, { PasswordInput } from "../components/AuthShell";
import { PHOTOS } from "../components/authPhotos";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5174";

export default function AcceptInvitation() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const passwordMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;

  async function acceptInvitation(event) {
    event.preventDefault();
    setError("");
    if (!token) {
      setError("This invitation link is missing its token. Ask an administrator to resend it.");
      return;
    }
    if (password.length < 8) {
      setError("Use a password with at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/accept-invitation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Unable to accept this invitation.");
      }
      navigate("/team-login", { replace: true });
    } catch (requestError) {
      setError(requestError.message || "Unable to accept this invitation.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      photo={PHOTOS.reset}
      title="Welcome to the team."
      text="Choose a password to activate your BridgeTech staff account."
    >
      <h1>Accept invitation</h1>
      <p className="au-lede">Set a password to activate your team account.</p>
      {error && <div className="au-alert error" role="alert">{error}</div>}
      <form onSubmit={acceptInvitation}>
        <div className="au-field">
          <label htmlFor="new-password">New password</label>
          <PasswordInput
            id="new-password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            disabled={loading}
          />
        </div>
        <div className="au-field">
          <label htmlFor="confirm-password">Confirm password</label>
          <PasswordInput
            id="confirm-password"
            autoComplete="new-password"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            disabled={loading}
            aria-invalid={passwordMismatch}
          />
        </div>
        <button type="submit" className="au-button" disabled={loading}>
          {loading ? "Activating account..." : "Accept invitation"}
        </button>
      </form>
      <p className="au-switch">
        Already active? <Link to="/team-login">Go to Team Login</Link>
      </p>
    </AuthShell>
  );
}