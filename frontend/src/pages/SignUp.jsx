import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import VerificationModal from "../components/VerificationModal";
import "./SignUp.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5174";

const SignUp = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    agree: false,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [verification, setVerification] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const signupDraftKey = "bridgetech_signup_draft";

  useEffect(() => {
    try {
      const savedDraft = sessionStorage.getItem(signupDraftKey);

      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);

        setForm((current) => ({
          ...current,
          name: parsed.name || "",
          email: parsed.email || "",
          agree: Boolean(parsed.agree),
        }));
      }
    } catch {
      sessionStorage.removeItem(signupDraftKey);
    }
  }, []);

  useEffect(() => {
    const draft = {
      name: form.name,
      email: form.email,
      agree: form.agree,
    };

    sessionStorage.setItem(
      signupDraftKey,
      JSON.stringify(draft)
    );
  }, [form.name, form.email, form.agree]);

  const update = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => ({
      ...current,
      [field]: "",
      submit: "",
    }));
  };

  const validate = () => {
    const newErrors = {};

    if (!form.name.trim()) {
      newErrors.name = "Please enter your name.";
    }

    if (!form.email.trim()) {
      newErrors.email = "Please enter your email.";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
    ) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!form.password) {
      newErrors.password = "Please enter a password.";
    } else if (form.password.length < 8) {
      newErrors.password =
        "Password must be at least 8 characters.";
    }

    if (!form.confirmPassword) {
      newErrors.confirmPassword =
        "Please confirm your password.";
    } else if (
      form.password !== form.confirmPassword
    ) {
      newErrors.confirmPassword =
        "Passwords do not match.";
    }

    if (!form.agree) {
      newErrors.agree =
        "You must agree to the Terms of Service and Privacy Policy.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) {
      return;
    }

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      const nameParts = form.name.trim().split(/\s+/);

      const firstName = nameParts[0] || "";
      const lastName =
        nameParts.length > 1
          ? nameParts.slice(1).join(" ")
          : "";

      const username =
        form.email
          .split("@")[0]
          .trim()
          .toLowerCase();

      const response = await fetch(
        `${API_URL}/api/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username,
            firstName,
            lastName,
            email: form.email.trim(),
            password: form.password,
          }),
        }
      );

      let data = null;

      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        const message =
          data?.message ||
          data?.error ||
          "Unable to create your account.";

        setErrors({
          submit: message,
        });

        return;
      }

      if (!data?.verificationExpiresAt) {
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
      console.error("Registration error:", error);

      setErrors({
        submit:
          "Unable to connect to the server. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="signup-page">
        <div className="signup-card">
          <div className="signup-content">
            <div className="signup-heading">
              <div className="signup-eyebrow">
                BRIDGETECH
              </div>

              <h1>Create your account.</h1>

              <p>
                Get closer to the work you'll actually do.
              </p>
            </div>

            <form
              className="signup-form"
              onSubmit={handleSubmit}
              noValidate
            >
              <div className="field-group">
                <label htmlFor="name">
                  Full name
                </label>

                <input
                  id="name"
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    update("name", event.target.value)
                  }
                  placeholder="Enter your full name"
                  autoComplete="name"
                  disabled={loading}
                />

                {errors.name && (
                  <span className="field-error">
                    {errors.name}
                  </span>
                )}
              </div>

              <div className="field-group">
                <label htmlFor="email">
                  Email address
                </label>

                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    update("email", event.target.value)
                  }
                  placeholder="Enter your email"
                  autoComplete="email"
                  disabled={loading}
                />

                {errors.email && (
                  <span className="field-error">
                    {errors.email}
                  </span>
                )}
              </div>

              <div className="field-group">
                <label htmlFor="password">
                  Password
                </label>

                <div className="password-input-wrap">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(event) =>
                      update(
                        "password",
                        event.target.value
                      )
                    }
                    placeholder="Create a password"
                    autoComplete="new-password"
                    disabled={loading}
                  />
                  <button
                    className="password-visibility-button"
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword((visible) => !visible)}
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {errors.password && (
                  <span className="field-error">
                    {errors.password}
                  </span>
                )}
              </div>

              <div className="field-group">
                <label htmlFor="confirmPassword">
                  Confirm password
                </label>

                <input
                  id="confirmPassword"
                  type="password"
                  value={form.confirmPassword}
                  onChange={(event) =>
                    update(
                      "confirmPassword",
                      event.target.value
                    )
                  }
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  disabled={loading}
                />

                {errors.confirmPassword && (
                  <span className="field-error">
                    {errors.confirmPassword}
                  </span>
                )}
              </div>

              <div className="agreement-row">
                <input
                  id="agree"
                  type="checkbox"
                  checked={form.agree}
                  onChange={(event) =>
                    update(
                      "agree",
                      event.target.checked
                    )
                  }
                  disabled={loading}
                />

                <span>
                  <label htmlFor="agree">
                    I agree to the{" "}
                  </label>

                  <Link to="/terms">
                    Terms of Service
                  </Link>

                  {" and "}

                  <Link to="/privacy-policy">
                    Privacy Policy
                  </Link>
                </span>
              </div>

              {errors.agree && (
                <span className="field-error">
                  {errors.agree}
                </span>
              )}

              {errors.submit && (
                <div className="submit-error">
                  {errors.submit}
                </div>
              )}

              <button
                type="submit"
                className="signup-button"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span
                      className="signup-spinner"
                      aria-hidden="true"
                    ></span>
                    Creating account...
                  </>
                ) : (
                  "Create account"
                )}
              </button>
            </form>

            <div className="signup-login">
              Already have an account?{" "}
              <Link to="/login">
                Sign in
              </Link>
            </div>
          </div>

          <div className="signup-visual">
            <div className="bridge-mark" aria-hidden="true">
              <span className="bm-line bm-line-left"></span>
              <span className="bm-line bm-line-middle"></span>
              <span className="bm-line bm-line-right"></span>
            </div>
          </div>
        </div>
      </div>

      {verification && (
        <VerificationModal
          email={verification.email}
          initialExpiresAt={verification.expiresAt}
          onVerified={() => {
            sessionStorage.removeItem(
              signupDraftKey
            );

            navigate("/home");
          }}
        />
      )}
    </>
  );
};

export default SignUp;