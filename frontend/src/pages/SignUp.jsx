// SignUp.jsx
import React, { useState } from "react";
import "./SignUp.css";


function BridgeMark() {
  return (
    <svg
      viewBox="0 0 520 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <line
        className="bm-line"
        pathLength="1"
        x1="0"
        y1="230"
        x2="520"
        y2="230"
        stroke="#f3f1ea"
        strokeWidth="2"
        style={{ animationDelay: "0s" }}
      />

      <line
        className="bm-line"
        pathLength="1"
        x1="90"
        y1="230"
        x2="90"
        y2="10"
        stroke="#f3f1ea"
        strokeWidth="3"
        style={{ animationDelay: ".25s" }}
      />

      <line
        className="bm-line"
        pathLength="1"
        x1="330"
        y1="230"
        x2="330"
        y2="10"
        stroke="#f3f1ea"
        strokeWidth="3"
        style={{ animationDelay: ".35s" }}
      />

      <path
        className="bm-line"
        pathLength="1"
        d="M0 230 C 90 60, 90 60, 210 230"
        stroke="#f3f1ea"
        strokeWidth="1.4"
        style={{ animationDelay: ".5s" }}
      />

      <path
        className="bm-line"
        pathLength="1"
        d="M210 230 C 330 30, 330 30, 450 230"
        stroke="#f3f1ea"
        strokeWidth="1.4"
        style={{ animationDelay: ".6s" }}
      />

      <path
        className="bm-line"
        pathLength="1"
        d="M450 230 C 470 150, 500 120, 520 100"
        stroke="#f3f1ea"
        strokeWidth="1.4"
        style={{ animationDelay: ".7s" }}
      />

      {Array.from({ length: 11 }).map((_, i) => {
        const x = 20 + i * 19;

        return (
          <line
            className="bm-line"
            pathLength="1"
            key={`a${x}`}
            x1={x}
            y1="230"
            x2={x}
            y2={230 - Math.max(6, 150 - Math.abs(x - 90) * 1.35)}
            stroke="#f3f1ea"
            strokeWidth="1"
            style={{ animationDelay: `${0.85 + i * 0.03}s` }}
          />
        );
      })}

      {Array.from({ length: 12 }).map((_, i) => {
        const x = 240 + i * 19;

        return (
          <line
            className="bm-line"
            pathLength="1"
            key={`b${x}`}
            x1={x}
            y1="230"
            x2={x}
            y2={230 - Math.max(6, 200 - Math.abs(x - 330) * 1.35)}
            stroke="#f3f1ea"
            strokeWidth="1"
            style={{ animationDelay: `${1.2 + i * 0.03}s` }}
          />
        );
      })}
    </svg>
  );
}

const initialForm = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  agree: false,
};

export default function SignUpPage() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [showPw, setShowPw] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [photoFailed, setPhotoFailed] = useState(false);

  const confirmMismatch =
    form.confirmPassword.length > 0 && form.confirmPassword !== form.password;

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function validate() {
    const next = {};

    if (!form.name.trim()) {
      next.name = "Enter your full name.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = "Enter a valid email address.";
    }

    if (form.password.length < 8) {
      next.password = "Use at least 8 characters.";
    }

    if (form.confirmPassword !== form.password) {
      next.confirmPassword = "Passwords don't match.";
    }

    if (!form.agree) {
      next.agree = "You need to agree to continue.";
    }

    return next;
  }

  function handleSubmit(e) {
    e.preventDefault();

    const next = validate();
    setErrors(next);

    if (Object.keys(next).length === 0) {
      // Replace with your real signup call.
      console.log("BridgeTech signup:", {
        name: form.name,
        email: form.email,
      });

      setSubmitted(true);
    }
  }

  return (
    <div className="bt">
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
          {submitted ? (
            <div className="su-success" role="status">
              <h2>Check your inbox</h2>

              <p>
                We've sent a confirmation link to{" "}
                <strong>{form.email}</strong>. Follow it to activate your
                account and start your first track.
              </p>
            </div>
          ) : (
            <form className="su-form" onSubmit={handleSubmit} noValidate>
              <p className="eyebrow">Get started</p>

              <h1>Create your account.</h1>

              <p className="lede">
                Set up your BridgeTech account to start working through tracks
                and keep a record of what you've practised.
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
                  aria-describedby={
                    errors.name ? "su-name-error" : undefined
                  }
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
                  aria-describedby={
                    errors.email ? "su-email-error" : undefined
                  }
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
                      errors.password
                        ? "su-password-error"
                        : "su-password-hint"
                    }
                    style={{ paddingRight: "64px" }}
                  />

                  <button
                    type="button"
                    className="pw-toggle"
                    onClick={() => setShowPw((v) => !v)}
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
                  onChange={(e) =>
                    update("confirmPassword", e.target.value)
                  }
                  aria-invalid={Boolean(errors.confirmPassword || confirmMismatch)}
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
                  aria-describedby={
                    errors.agree ? "su-agree-error" : undefined
                  }
                />

                <label htmlFor="su-agree">
                  I agree to the <a href="/terms">Terms of Service</a> and{" "}
                  <a href="/privacy">Privacy Policy</a>.
                </label>
              </div>

              {errors.agree && (
                <p className="field-error" id="su-agree-error">
                  {errors.agree}
                </p>
              )}

              <button type="submit" className="button dark button-full">
                Create account
              </button>

              <p className="su-switch">
                Already have an account?{" "}
                <a href="/login">Sign in</a>
              </p>

            </form>
          )}
        </div>

        <figure className="su-photo">
          {!photoFailed ? (
            <img
              src="https://images.unsplash.com/photo-1478191696214-796b65712719?auto=format&fit=crop&w=1200&q=85"
              alt="A steel arch bridge over calm water under a blue sky"
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => setPhotoFailed(true)}
            />
          ) : (
            <div className="su-photo-fallback" aria-hidden="true" />
          )}

          <div className="su-mark" aria-hidden="true">
            <BridgeMark />
          </div>

          <div className="su-photo-copy">
            <p className="eyebrow">BridgeTech</p>
            <h2>Build Skills for the work ahead</h2>
          </div>
        </figure>
      </main>
    </div>
  );
}