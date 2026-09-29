import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import VerificationModal from "../components/VerificationModal";
import AuthShell, { PasswordInput } from "../components/AuthShell";
import { PHOTOS } from "../components/authPhotos";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5174";

const Login = () => {
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const [showVerification, setShowVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [verificationExpiresAt, setVerificationExpiresAt] = useState(null);

  const saveUserAndRedirect = (data) => {
    localStorage.setItem("token", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    localStorage.setItem(
      "user",
      JSON.stringify({
        userId: data.userId,
        username: data.username,
        email: data.email,
        role: data.role,
      })
    );

    navigate(
      data.role === "Admin" || data.role === "SuperAdmin" ? "/admin" : "/home"
    );
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        if (data.code === "EMAIL_NOT_VERIFIED") {
          setVerificationEmail(identifier);
          setVerificationExpiresAt(
            data.verificationExpiresAt ||
              new Date(Date.now() + 10 * 60 * 1000).toISOString()
          );
          setShowVerification(true);
          return;
        }
        throw new Error(data.message || "Login failed.");
      }

      saveUserAndRedirect(data);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (credentialResponse) => {
    setError("");
    setGoogleLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/google-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Google login failed.");
      }

      saveUserAndRedirect(data);
    } catch (err) {
      setError(err.message || "Google login failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <AuthShell
      photo={PHOTOS.signin}
      title="Welcome back."
      text="Pick up your tracks where you left off."
    >
      <h1>Sign in</h1>
      <p className="au-lede">Sign in to continue to your BridgeTech account.</p>

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
            onChange={(e) => setIdentifier(e.target.value)}
            required
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
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          className="au-button"
          disabled={loading}
          aria-busy={loading}
        >
          {loading ? <span className="au-spinner" aria-hidden="true" /> : "Sign in"}
        </button>
      </form>

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
            onError={() => setError("Google login was cancelled or failed.")}
            text="signin_with"
            shape="pill"
          />
        )}
      </div>

      <p className="au-switch">
        Don't have an account? <Link to="/signup">Create an account</Link>
      </p>

      {showVerification && (
        <VerificationModal
          email={verificationEmail}
          expiresAt={verificationExpiresAt}
          initialExpiresAt={verificationExpiresAt}
          onClose={() => setShowVerification(false)}
          onVerified={() => {
            setShowVerification(false);
            navigate("/home");
          }}
        />
      )}
    </AuthShell>
  );
};

export default Login;
