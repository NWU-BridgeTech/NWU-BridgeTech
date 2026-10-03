import { useEffect, useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { Link, useNavigate } from "react-router-dom";
import VerificationModal from "../components/VerificationModal";
import AuthShell, { PasswordInput } from "../components/AuthShell";
import { PHOTOS } from "../components/authPhotos";

const initialForm = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  agree: false,
};

const signupDraftKey = "bridgetech-signup-draft";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5174";
const OFFLINE_MSG =
  "Unable to connect to the server. Please make sure the backend is running.";

async function post(path, body) {
  const response = await fetch(`${API_URL}/api/auth/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  let data = {};
  try {
    const type = response.headers.get("content-type") || "";
    if (type.toLowerCase().includes("application/json")) {
      data = await response.json();
    }
  } catch (error) {
    console.error("Failed to parse server response:", error);
  }

  return { response, data };
}

function Field({ id, label, error, hint, children }) {
  return (
    <div className="au-field">
      <label htmlFor={id}>{label}</label>
      {children}
      {error ? (
        <p className="au-error" id={`${id}-error`}>
          {error}
        </p>
      ) : (
        hint && (
          <p className="au-hint" id={`${id}-hint`}>
            {hint}
          </p>
        )
      )}
    </div>
  );
}

export default function SignUpPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(() => {
    try {
      const saved = sessionStorage.getItem(signupDraftKey);
      return saved ? { ...initialForm, ...JSON.parse(saved) } : initialForm;
    } catch {
      return initialForm;
    }
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [verification, setVerification] = useState(null);
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    try {
      sessionStorage.setItem(
        signupDraftKey,
        JSON.stringify({
          name: form.name,
          email: form.email,
          agree: form.agree,
        }),
      );
    } catch (error) {
      console.error("Failed to save signup draft:", error);
    }
  }, [form.name, form.email, form.agree]);

  const confirmMismatch =
    form.confirmPassword.length > 0 && form.confirmPassword !== form.password;

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    if (errors[field] || errors.submit) {
      setErrors((current) => {
        const next = { ...current };
        delete next[field];
        delete next.submit;
        return next;
      });
    }
  }

  function validate() {
    const next = {};
    if (!form.name.trim()) next.name = "Enter your full name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = "Enter a valid email address.";
    }
    if (form.password.length < 8) next.password = "Use at least 8 characters.";
    if (form.confirmPassword !== form.password) {
      next.confirmPassword = "Passwords don't match.";
    }
    if (!form.agree) next.agree = "You need to agree to continue.";
    return next;
  }

  function saveUser(data) {
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
  }

  async function handleGoogleSignup(credentialResponse) {
    if (!credentialResponse?.credential) {
      setErrors({ submit: "Google signup could not be completed." });
      return;
    }
    if (isLoading) return;

    setIsLoading(true);
    setErrors({});
    try {
      const { response, data } = await post("google-signup", {
        credential: credentialResponse.credential,
      });
      if (!response.ok) {
        setErrors({ submit: data.message || "Unable to sign up with Google." });
        return;
      }

      saveUser(data);
      sessionStorage.removeItem(signupDraftKey);
      navigate("/home");
    } catch (error) {
      console.error("Google signup error:", error);
      setErrors({ submit: OFFLINE_MSG });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (isLoading) return;

    const next = validate();
    setErrors(next);
    if (Object.keys(next).length !== 0) return;

    const nameParts = form.name.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || firstName;
    const username = form.email
      .split("@")[0]
      .replace(/[^a-zA-Z0-9._-]/g, "")
      .slice(0, 50);

    if (username.length < 3) {
      setErrors({
        email:
          "Your email address must contain at least 3 characters before the @ symbol.",
      });

      return;
    }

    setIsLoading(true);
    setErrors({});
    try {
      const { response, data } = await post("register", {
        username,
        firstName,
        lastName,
        email: form.email.trim(),
        password: form.password,
      });

      if (!response.ok) {
        setErrors({ submit: data.message || "Unable to create your account." });
        return;
      }
      if (!data.verificationExpiresAt) {
        setErrors({
          submit:
            "The server did not return a verification expiry. Please try again.",
        });
        return;
      }

      setVerification({
        email: form.email.trim(),
        expiresAt: data.verificationExpiresAt,
      });
    } catch (error) {
      console.error("Signup error:", error);
      setErrors({ submit: OFFLINE_MSG });
    } finally {
      setIsLoading(false);
    }
  }

  const describe = (id, hasError, hasHint) =>
    hasError ? `${id}-error` : hasHint ? `${id}-hint` : undefined;

  return (
    <AuthShell
      wide
      photo={PHOTOS.signup}
      title="Build skills for the work ahead."
      text="Work through tracks and keep a record of what you've practised."
    >
      {verification && (
        <VerificationModal
          email={verification.email}
          initialExpiresAt={verification.expiresAt}
          onClose={() => setVerification(null)}
          onVerified={() => {
            sessionStorage.removeItem(signupDraftKey);
            navigate("/home");
          }}
        />
      )}
      <a className="bt-skip" href="#main">
        Skip to content
      </a>

      <header className="su-top">
        <a className="logo" href="/" aria-label="BridgeTech home">
          Bridge<i>Tech</i>
        </a>
      </header>

      <main id="main" className="su-grid">
        <div className="su-form-wrap">
          <form className="su-form" onSubmit={handleSubmit} noValidate>
            <p className="eyebrow">Get started</p>

            <h1>Create your account.</h1>

            <p className="lede">
              Set up your BridgeTech account to start working through tracks and
              keep a record of what you've practised.
            </p>

            <div className="field">
              <label htmlFor="su-name">Full name</label>

              <input
                id="su-name"
                className="input"
                type="text"
                autoComplete="name"
                placeholder="Jordan Ellis"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "su-name-error" : undefined}
              />

              {errors.name && (
                <p className="field-error" id="su-name-error">
                  {errors.name}
                </p>
              )}
            </div>

            <div className="field">
              <label htmlFor="su-email">Email</label>

              <input
                id="su-email"
                className="input"
                type="email"
                autoComplete="email"
                placeholder="you@university.edu"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "su-email-error" : undefined}
              />

              {errors.email && (
                <p className="field-error" id="su-email-error">
                  {errors.email}
                </p>
              )}
            </div>

            <div className="field">
              <label htmlFor="su-password">Password</label>

              <div className="pw-row">
                <input
                  id="su-password"
                  className="input"
                  type={showPw ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={
                    errors.password ? "su-password-error" : "su-password-hint"
                  }
                  style={{ paddingRight: "64px" }}
                />

                <button
                  type="button"
                  className="pw-toggle"
                  onClick={() => setShowPw((value) => !value)}
                  aria-pressed={showPw}
                >
                  {showPw ? "Hide" : "Show"}
                </button>
              </div>

              {errors.password ? (
                <p className="field-error" id="su-password-error">
                  {errors.password}
                </p>
              ) : (
                <p className="field-hint" id="su-password-hint">
                  At least 8 characters.
                </p>
              )}
            </div>

            <div className="field">
              <label htmlFor="su-confirm-password">Confirm password</label>

              <input
                id="su-confirm-password"
                className="input"
                type="password"
                autoComplete="new-password"
                placeholder="Re-enter your password"
                value={form.confirmPassword}
                onChange={(e) => update("confirmPassword", e.target.value)}
                aria-invalid={Boolean(
                  errors.confirmPassword || confirmMismatch,
                )}
                aria-describedby={
                  errors.confirmPassword || confirmMismatch
                    ? "su-confirm-password-error"
                    : undefined
                }
              />

              {(errors.confirmPassword || confirmMismatch) && (
                <p className="field-error" id="su-confirm-password-error">
                  {errors.confirmPassword || "Passwords don't match."}
                </p>
              )}
            </div>

            <div className="checkbox-row">
              <input
                id="su-agree"
                type="checkbox"
                checked={form.agree}
                onChange={(e) => update("agree", e.target.checked)}
                aria-invalid={Boolean(errors.agree)}
                aria-describedby={errors.agree ? "su-agree-error" : undefined}
              />

              <span>
                <label htmlFor="su-agree">I agree to the</label>{" "}
                <Link to="/terms">Terms of Service</Link> and{" "}
                <Link to="/privacy-policy">Privacy Policy</Link>.
              </span>
            </div>

            {errors.agree && (
              <p className="field-error" id="su-agree-error">
                {errors.agree}
              </p>
            )}

            {errors.submit && <p className="field-error">{errors.submit}</p>}

            <button
              type="submit"
              className="button dark button-full"
              disabled={isLoading}
              aria-busy={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="signup-spinner" aria-hidden="true" />
                  Creating account...
                </>
              ) : (
                "Create account"
              )}
            </button>

            <p className="su-switch">
              Already have an account? <a href="/login">Sign in</a>
            </p>
          </form>
        </div>

        <div className="au-google">
          <GoogleLogin
            onSuccess={handleGoogleSignup}
            onError={() => {
              if (!isLoading) {
                setErrors({ submit: "Google signup was cancelled or failed." });
              }
            }}
            useOneTap={false}
            text="signup_with"
            shape="pill"
          />
        </div>

        <p className="au-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </main>
    </AuthShell>
  );
}
