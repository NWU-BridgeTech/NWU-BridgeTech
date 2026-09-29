import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ForgotPassword.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5174";

const ForgotPassword = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPw, setShowPw] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordMismatch =
    confirmPassword.length > 0 &&
    confirmPassword !== newPassword;

  const passwordValid =
    newPassword.length >= 8 &&
    confirmPassword.length > 0 &&
    confirmPassword === newPassword;

  const handleSendCode = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/auth/forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to send reset code."
        );
      }

      setSuccess(
        "A password reset code has been sent to your email."
      );

      setStep(2);
    } catch (error) {
      setError(
        error.message ||
          "Unable to send reset code. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (code.length !== 6) {
      setError("Please enter the 6-digit reset code.");
      return;
    }

    setStep(3);
  };
  

  const handleResetPassword = async (event) => {
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
      const response = await fetch(
        `${API_URL}/api/auth/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            code: code.trim(),
            newPassword,
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to reset your password."
        );
      }

      setSuccess("Password reset successfully.");

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error) {
      setError(
        error.message ||
          "Unable to reset your password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-page">
      <div className="forgot-card">
        <div className="brand">
          <b>Bridge</b>
          <b>Tech</b>
        </div>

        {step === 1 && (
          <>
            <h2>Reset your password</h2>

            <p className="sub">
              Enter your email address and we'll send you a reset
              code.
            </p>

            {error && (
              <div className="error-message visible">
                {error}
              </div>
            )}

            {success && (
              <div className="success-message visible">
                {success}
              </div>
            )}

            <form onSubmit={handleSendCode}>
              <div className="form-group">
                <label htmlFor="email">Email address</label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  required
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                className="btn blue submit-btn"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send reset code"}
              </button>
            </form>
          </>
        )}

        {step === 2 && (
          <>
            <h2>Enter your reset code</h2>

            <p className="sub">
              Enter the 6-digit code sent to your email address.
            </p>

            {error && (
              <div className="error-message visible">
                {error}
              </div>
            )}

            {success && (
              <div className="success-message visible">
                {success}
              </div>
            )}

            <form onSubmit={handleVerifyCode}>
              <div className="form-group">
                <label htmlFor="code">Reset code</label>

                <input
                  id="code"
                  name="code"
                  type="text"
                  inputMode="numeric"
                  maxLength="6"
                  placeholder="Enter 6-digit code"
                  value={code}
                  onChange={(event) =>
                    setCode(
                      event.target.value
                        .replace(/\D/g, "")
                        .slice(0, 6)
                    )
                  }
                  required
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                className="btn blue submit-btn"
                disabled={loading}
              >
                Verify code
              </button>
            </form>
          </>
        )}

        {step === 3 && (
          <>
            <h2>Create a new password</h2>

            <p className="sub">
              Enter a new password for your BridgeTech account.
            </p>

            {error && (
              <div className="error-message visible">
                {error}
              </div>
            )}

            {success && (
              <div className="success-message visible">
                {success}
              </div>
            )}

            <form onSubmit={handleResetPassword}>
              <div className="form-group">
                <label htmlFor="newPassword">
                  New password
                </label>

                <div className="pw-row">
                  <input
                    id="newPassword"
                    name="newPassword"
                    className="input"
                    type={showPw ? "text" : "password"}
                    placeholder="At least 8 characters"
                    value={newPassword}
                    onChange={(event) =>
                      setNewPassword(event.target.value)
                    }
                    required
                    disabled={loading}
                    style={{ paddingRight: "64px" }}
                  />

                  <button
                    type="button"
                    className="pw-toggle"
                    onClick={() =>
                      setShowPw((value) => !value)
                    }
                    aria-pressed={showPw}
                  >
                    {showPw ? "Hide" : "Show"}
                  </button>
                </div>

                <p className="field-hint">
                  At least 8 characters.
                </p>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">
                  Confirm password
                </label>

                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  className="input"
                  type="password"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(event.target.value)
                  }
                  required
                  disabled={loading}
                  aria-invalid={passwordMismatch}
                />

                {passwordMismatch && (
                  <p className="field-error">
                    Passwords don't match.
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="btn blue submit-btn"
                disabled={loading || !passwordValid}
              >
                {loading ? "Resetting..." : "Reset password"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;