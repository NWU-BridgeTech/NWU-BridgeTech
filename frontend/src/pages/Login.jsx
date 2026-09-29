import { useState } from "react";
import VerificationModal from "../components/VerificationModal";
import "./Login.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5174";

export default function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [verification, setVerification] = useState(null);

  async function submit(event) {
    event.preventDefault();
    setError("");
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (data.code === "EMAIL_NOT_VERIFIED")
          setVerification({
            email: identifier,
            expiresAt:
              data.verificationExpiresAt ||
              new Date(Date.now() + 600000).toISOString(),
          });
        else setError(data.message || "Unable to sign in.");
        return;
      }
      localStorage.setItem("token", data.token);
      localStorage.setItem("refreshToken", data.refreshToken);
      window.location.href = "/home";
    } catch {
      setError("Unable to connect to the server.");
    }
  }

  return (
    <div className="login-page">
      {verification && (
        <VerificationModal
          email={verification.email}
          initialExpiresAt={verification.expiresAt}
          onClose={() => setVerification(null)}
          onVerified={() => {
            window.location.href = "/home";
          }}
        />
      )}
      <div className="login-card">
        <div className="hero-image">
          <span className="hero-text">Helping to build a better future</span>
          <img
            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80"
            alt="Helping to build a better future"
          />
        </div>
        <div className="brand">
          <b>Bridge</b>
          <b>Tech</b>
        </div>
        <h2>Login</h2>
        <form onSubmit={submit}>
          <div className="form-group">
            <label htmlFor="email">Email or username:</label>
            <input
              type="text"
              id="email"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <a href="/forgot-password" className="forgot-password-link">
              Forgot password?
            </a>
          </div>
          {error && <p role="alert">{error}</p>}
          <div className="login-Footer">
            <p>
              Don't have an account? <a href="/signup">Sign up</a>
            </p>
          </div>
          <button type="submit" className="btn blue submit-btn">
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
