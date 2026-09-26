import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import VerificationModal from "../components/VerificationModal";
import "./Login.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5174";

const Login = () => {
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verification, setVerification] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === "EMAIL_NOT_VERIFIED") {
          setVerification({
            email:
              data.email ||
              data.identifier ||
              identifier.trim(),
            expiresAt:
              data.verificationExpiresAt ||
              new Date(Date.now() + 600000).toISOString(),
          });

          return;
        }

        throw new Error(
          data.message || "Invalid username/email or password."
        );
      }

      localStorage.setItem("token", data.token);
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

      if (
        data.role === "Admin" ||
        data.role === "SuperAdmin"
      ) {
        navigate("/admin");
      } else {
        navigate("/home");
      }
    } catch (error) {
      setError(
        error.message ||
          "Unable to log in. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

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
          <span className="hero-text">
            Helping to build a better future
          </span>

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

        <p className="sub">
          Sign in to continue to BridgeTech.
        </p>

        {error && (
          <div className="login-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="identifier">
              Email or Username:
            </label>

            <input
              type="text"
              id="identifier"
              placeholder="name@gmail.com"
              value={identifier}
              onChange={(event) =>
                setIdentifier(event.target.value)
              }
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <div className="label-row">
              <label htmlFor="password">
                Password:
              </label>

              <Link
                to="/forgot-password"
                className="forgot-link"
              >
                Forgot password?
              </Link>
            </div>

            <input
              type="password"
              id="password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
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
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="login-footer">
          <p>
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="signup-link"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};


export default Login;
