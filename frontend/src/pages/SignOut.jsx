import { useNavigate } from "react-router-dom";
import { clearAuthTokens } from "../utils/authStorage";
import { LogOut } from "lucide-react";
import "./SignOut.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5174";

export default function SignOut() {
  const navigate = useNavigate();

  function signOut() {
    const token = localStorage.getItem("token");
    if (token) {
      fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        keepalive: true,
      }).catch(() => {});
    }
    clearAuthTokens();
    navigate("/", { replace: true });
  }

  return (
    <main className="signout-page">
      <section
        className="signout-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="signout-heading"
        aria-describedby="signout-description"
      >
        <div className="signout-icon" aria-hidden="true">
          <LogOut size={22} />
        </div>
        <p className="signout-eyebrow">ACCOUNT</p>
        <h1 id="signout-heading">Sign out of BridgeTech?</h1>
        <p id="signout-description">
          You will need to sign in again to access your student workspace.
        </p>
        <div className="signout-actions">
          <button
            className="signout-cancel"
            type="button"
            onClick={() => navigate(-1)}
          >
            Cancel
          </button>
          <button className="signout-confirm" type="button" onClick={signOut}>
            Sign out
          </button>
        </div>
      </section>
    </main>
  );
}
