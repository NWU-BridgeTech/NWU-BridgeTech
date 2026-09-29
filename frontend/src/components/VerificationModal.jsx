import { useEffect, useRef, useState } from "react";
import { Mail } from "lucide-react";
import "./VerificationModal.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5174";

export default function VerificationModal({
  email,
  initialExpiresAt,
  onVerified,
}) {
  const [digits, setDigits] = useState(Array(6).fill(""));
  const [expiresAt, setExpiresAt] = useState(initialExpiresAt);
  const [secondsLeft, setSecondsLeft] = useState(() =>
    Math.max(0, Math.floor((new Date(initialExpiresAt) - Date.now()) / 1000)),
  );
  const [resendCooldown, setResendCooldown] = useState(60);
  const [error, setError] = useState("");
  const [verificationState, setVerificationState] = useState("idle");
  const [busy, setBusy] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    function updateTimer() {
      setSecondsLeft(
        Math.max(0, Math.floor((new Date(expiresAt) - Date.now()) / 1000)),
      );
      setResendCooldown((value) => Math.max(0, value - 1));
    }
    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  async function submitCode(code) {
    if (busy || secondsLeft === 0) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/api/auth/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Unable to verify code.");
      if (data.token) localStorage.setItem("token", data.token);
      if (data.refreshToken)
        localStorage.setItem("refreshToken", data.refreshToken);
      setVerificationState("success");
      window.setTimeout(onVerified, 650);
    } catch (requestError) {
      setError(requestError.message);
      setVerificationState("error");
      setDigits(Array(6).fill(""));
      inputRefs.current[0]?.focus();
    } finally {
      setBusy(false);
    }
  }

  function handleChange(index, value) {
    if (!/^\d?$/.test(value)) return;
    const next = [...digits];
    next[index] = value;
    setVerificationState("idle");
    setError("");
    setDigits(next);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  }

  function handleKeyDown(index, event) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(event) {
    const pastedCode = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!pastedCode) return;
    event.preventDefault();
    const next = Array(6).fill("");
    pastedCode.split("").forEach((digit, index) => {
      next[index] = digit;
    });
    setDigits(next);
    setVerificationState("idle");
    setError("");
  }

  async function resend() {
    if (resendCooldown > 0 || busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/api/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Unable to resend code.");
      setExpiresAt(data.expiresAt);
      setResendCooldown(60);
      setDigits(Array(6).fill(""));
      setVerificationState("idle");
      inputRefs.current[0]?.focus();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  const time = `${String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:${String(secondsLeft % 60).padStart(2, "0")}`;
  return (
    <div
      className="verification-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="verification-title"
    >
      <div className={`verification-modal verification-${verificationState}`}>
        <div className="verification-icon" aria-hidden="true">
          <Mail size={25} strokeWidth={2.4} />
        </div>
        <h2 id="verification-title">Check your email</h2>
        <p className="verification-subtitle">
          Enter the verification code sent to
          <strong>{email}</strong>
        </p>
        <div className="verification-digits" aria-live="polite">
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(element) => {
                inputRefs.current[index] = element;
              }}
              value={digit}
              maxLength={1}
              inputMode="numeric"
              disabled={!secondsLeft || busy}
              onChange={(event) => handleChange(index, event.target.value)}
              onKeyDown={(event) => handleKeyDown(index, event)}
              onPaste={handlePaste}
              aria-label={`Verification digit ${index + 1}`}
            />
          ))}
        </div>
        {error && (
          <p className="verification-error" role="alert">
            {error}
          </p>
        )}
        <p className="verification-expiry">
          {secondsLeft
            ? `Expires in ${time}`
            : "Code expired. Request a new code to continue."}
        </p>
        <p className="verification-resend">
          Didn't receive code?{" "}
          <button
            type="button"
            onClick={resend}
            disabled={resendCooldown > 0 || busy}
          >
            {resendCooldown ? `resend (${resendCooldown}s)` : "resend"}
          </button>
        </p>
        <button
          type="button"
          className="verification-submit"
          onClick={() => submitCode(digits.join(""))}
          disabled={digits.some((digit) => !digit) || busy || !secondsLeft}
        >
          {busy ? "Verifying..." : "Verify email"}
        </button>
      </div>
    </div>
  );
}
