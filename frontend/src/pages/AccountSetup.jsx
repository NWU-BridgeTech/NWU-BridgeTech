import { useEffect, useState } from "react";
import "./AccountSetup.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5174";

export default function AccountSetup() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/users/me`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load your account.");
        return response.json();
      })
      .then((data) => {
        if (!data.accountSetupRequired) {
          return fetch(`${API_URL}/api/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              refreshToken: localStorage.getItem("refreshToken"),
            }),
          })
            .then((refreshResponse) => refreshResponse.json())
            .then((tokens) => {
              if (tokens.token) localStorage.setItem("token", tokens.token);
              if (tokens.refreshToken)
                localStorage.setItem("refreshToken", tokens.refreshToken);
              window.location.href = "/home";
            });
        }
        setUser(data);
      })
      .catch(() => setError("Unable to load your account setup."));
  }, []);

  async function completeSetup() {
    setCompleting(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/api/users/me/setup/complete`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!response.ok)
        throw new Error("Unable to finish setting up your account.");

      const refreshResponse = await fetch(`${API_URL}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          refreshToken: localStorage.getItem("refreshToken"),
        }),
      });
      const tokens = await refreshResponse.json();
      if (!refreshResponse.ok || !tokens.token)
        throw new Error("Unable to refresh your session.");
      localStorage.setItem("token", tokens.token);
      if (tokens.refreshToken)
        localStorage.setItem("refreshToken", tokens.refreshToken);
      window.location.href = "/home";
    } catch (setupError) {
      setError(setupError.message);
      setCompleting(false);
    }
  }

  return (
    <main className="account-setup-page">
      <section
        className="account-setup-card"
        aria-labelledby="account-setup-title"
      >
        <p className="account-setup-eyebrow">Welcome to BridgeTech</p>
        <h1 id="account-setup-title">
          {user
            ? `${user.firstName}, let&apos;s finish setting up your account`
            : "Let&apos;s finish setting up your account"}
        </h1>
        <p>
          Your account is verified. Take a moment to finish your profile setup
          before entering your workspace.
        </p>
        {error && (
          <p className="account-setup-error" role="alert">
            {error}
          </p>
        )}
        <button
          className="btn blue"
          onClick={completeSetup}
          disabled={completing}
        >
          {completing ? "Finishing setup..." : "Continue to your workspace"}
        </button>
        <p className="account-setup-note">
          Optional services such as GitHub can be connected later from your
          workspace.
        </p>
      </section>
    </main>
  );
}
