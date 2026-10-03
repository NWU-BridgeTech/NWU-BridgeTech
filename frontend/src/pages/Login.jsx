import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import VerificationModal from "../components/VerificationModal";
import AuthShell, { PasswordInput } from "../components/AuthShell";
import { PHOTOS } from "../components/authPhotos";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5174";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5174";

export default function Login() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [verification, setVerification] = useState(null);

  function saveUserAndRedirect(data) {
    localStorage.setItem("token", data.token);
    localStorage.setItem("refreshToken", data.refreshToken);
    localStorage.setItem(
      "user",
      JSON.stringify({
        userId: data.userId,
        username: data.username,
        email: data.email,
        role: data.role,
      }),
    );
    navigate(
      data.role === "Admin" || data.role === "SuperAdmin" ? "/admin" : "/home",
    );
  }

  async function handleLogin(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/api/auth/${team ? "team-login" : "login"}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier: identifier.trim(), password }),
        },
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (data.code === "EMAIL_NOT_VERIFIED") {
          setVerification({
            email: data.email || identifier.trim(),
            expiresAt:
              data.verificationExpiresAt ||
              new Date(Date.now() + 10 * 60 * 1000).toISOString(),
          });
          return;
        }
        throw new Error(data.message || "Invalid username/email or password.");
      }
      saveUserAndRedirect(data);
    } catch (loginError) {
      setError(loginError.message || "Unable to log in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin(credentialResponse) {
    setError("");
    setGoogleLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/google-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Google login failed.");
      saveUserAndRedirect(data);
    } catch (loginError) {
      setError(loginError.message || "Google login failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  }
  }

  return (
    <AuthShell
      photo={PHOTOS.signin}
      title="Welcome back."
      text="Pick up your tracks where you left off."
    >
      <h1>{team ? "Team Login" : "Sign in"}</h1>
      <p className="au-lede">
        {team
          ? "Use your instructor or administrator account."
          : "Sign in to continue to your BridgeTech account."}
      </p>
      {error && (
        <div className="au-alert error" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin}>
        <div className="au-field">
          <label htmlFor="identifier">Email or username</label>
          <input
            id="identifier"
            className="au-input"
            type="text"
            autoComplete="username"
            placeholder="Enter your email or username"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div className="au-field">
          <div className="au-label-row">
            <label htmlFor="password">Password</label>
            <Link to="/forgot-password">Forgot password?</Link>
          </div>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          className="au-button"
          disabled={loading}
          aria-busy={loading}
        >
          {loading ? (
            <span className="au-spinner" aria-hidden="true" />
          ) : (
            "Sign in"
          )}
        </button>

        {!team && (
          <>
            <div className="au-divider">
              <span>or</span>
            </div>
            <div className="au-google">
              {googleLoading ? (
                <div className="au-google-loading">
                  <span className="au-spinner" aria-hidden="true" />
                  Signing in with Google...
                </div>
              ) : (
                <GoogleLogin
                  onSuccess={handleGoogleLogin}
                  onError={() =>
                    setError("Google login was cancelled or failed.")
                  }
                  text="signin_with"
                  shape="pill"
                />
              )}
            </div>
          </>
        )}
      </form>

      {team ? (
        <p className="au-switch">
          <Link to="/">Back to BridgeTech</Link>
        </p>
      ) : (
        <p className="au-switch">
          Don&apos;t have an account?{" "}
          <Link to="/signup">Create an account</Link>
        </p>
      )}

      {verification && (
        <VerificationModal
          email={verification.email}
          initialExpiresAt={verification.expiresAt}
          onClose={() => setVerification(null)}
          onVerified={() => navigate("/home")}
        />
      )}
    </AuthShell>
  );
};

export default Login;
