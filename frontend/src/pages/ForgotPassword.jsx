import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthShell, { PasswordInput } from "../components/AuthShell";
import { PHOTOS } from "../components/authPhotos";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5174";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const teamLogin = searchParams.get("team") === "1";
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordMismatch =
    confirmPassword.length > 0 && confirmPassword !== newPassword;
  const passwordValid =
    newPassword.length >= 8 &&
    confirmPassword.length > 0 &&
    confirmPassword === newPassword;

  async function post(path, body, fallback) {
    const response = await fetch(`${API_URL}/api/auth/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || fallback);
    return data;
  }

  async function handleSendCode(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await post(
        "forgot-password",
        { email: email.trim() },
        "Unable to send reset code.",
      );
      setSuccess("If an account exists for that email, we've sent a password reset code.");
      setStep(2);
    } catch (requestError) {
      setError(requestError.message || "Unable to send reset code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleVerifyCode(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (code.length !== 6) {
      setError("Please enter the 6-digit reset code.");
      return;
    }
    setStep(3);
  }

  async function handleResetPassword(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (newPassword.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    try {
      await post(
        "reset-password",
        { email: email.trim(), code: code.trim(), newPassword },
        "Unable to reset your password.",
      );
      setSuccess("Password reset successfully.");
      setTimeout(() => navigate(teamLogin ? "/team-login" : "/login"), 1500);
    } catch (requestError) {
      setError(
        requestError.message || "Unable to reset your password. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  const messages = (
    <>
      {error && <div className="au-alert error" role="alert">{error}</div>}
      {success && <div className="au-alert ok" role="status">{success}</div>}
    </>
  );

  return (
    <AuthShell
      photo={PHOTOS.reset}
      title="Locked out? It happens."
      text="We'll email you a code so you can set a new password."
    >
      {step === 1 && (
        <>
          <h1>Reset your password</h1>
          <p className="au-lede">
            Enter your email address and we'll send you a reset code.
          </p>
          {messages}
          <form onSubmit={handleSendCode}>
            <div className="au-field">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                name="email"
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
            <button type="submit" className="au-button" disabled={loading}>
              {loading ? "Sending..." : "Send reset code"}
            </button>
          </form>
        </>
      )}

      {step === 2 && (
        <>
          <h1>Enter your reset code</h1>
          <p className="au-lede">
            Enter the 6-digit code sent to your email address.
          </p>
          {messages}
          <form onSubmit={handleVerifyCode}>
            <div className="au-field">
              <label htmlFor="code">Reset code</label>
              <input
                id="code"
                name="code"
                className="au-input"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength="6"
                placeholder="Enter 6-digit code"
                value={code}
                onChange={(event) =>
                  setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                }
                required
                disabled={loading}
              />
            </div>
            <button type="submit" className="au-button" disabled={loading}>
              Verify code
            </button>
          </form>
        </>
      )}

      {step === 3 && (
        <>
          <h1>Create a new password</h1>
          <p className="au-lede">
            Enter a new password for your BridgeTech account.
          </p>
          {messages}
          <form onSubmit={handleResetPassword}>
            <div className="au-field">
              <label htmlFor="newPassword">New password</label>
              <PasswordInput
                id="newPassword"
                name="newPassword"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                required
                disabled={loading}
              />
              <p className="au-hint">At least 8 characters.</p>
            </div>

            <div className="au-field">
              <label htmlFor="confirmPassword">Confirm password</label>
              <PasswordInput
                id="confirmPassword"
                name="confirmPassword"
                showToggle={false}
                autoComplete="new-password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                disabled={loading}
                aria-invalid={passwordMismatch}
              />
              {passwordMismatch && (
                <p className="au-error">Passwords don't match.</p>
              )}
            </div>

            <button
              type="submit"
              className="au-button"
              disabled={loading || !passwordValid}
            >
              {loading ? "Resetting..." : "Reset password"}
            </button>
          </form>
        </>
      )}

      <p className="au-switch">
        Remembered it?{" "}
        <Link to={teamLogin ? "/team-login" : "/login"}>
          {teamLogin ? "Back to Team Login" : "Back to sign in"}
        </Link>
      </p>
    </AuthShell>
  );
}
