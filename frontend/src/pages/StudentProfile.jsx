import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import StudentLayout from "../layouts/StudentLayout";
import useCurrentUser from "../hooks/useCurrentUser";
import { clearAuthTokens, getToken } from "../utils/authStorage";
import { LogOut } from "lucide-react";
import "./StudentProfile.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5174";

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

export default function StudentProfile() {
  const navigate = useNavigate();
  const { user, loading, error: profileError } = useCurrentUser();
  const [profile, setProfile] = useState(null);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileErrorMessage, setProfileErrorMessage] = useState("");
  const [password, setPassword] = useState({
    currentPassword: "",
    newPassword: "",
  });
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [signOutClosing, setSignOutClosing] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const profileValues =
    profile ??
    (user
      ? {
          firstName: user.firstName ?? "",
          lastName: user.lastName ?? "",
          email: user.email ?? "",
          phoneNumber: user.phoneNumber ?? "",
          address: user.address ?? "",
          university: user.university ?? "",
        }
      : null);

  function updateProfileField(event) {
    setProfile({ ...profileValues, [event.target.name]: event.target.value });
  }

  function closeSignOut() {
    if (signingOut) return;
    setSignOutClosing(true);
    window.setTimeout(() => {
      setSignOutOpen(false);
      setSignOutClosing(false);
    }, 180);
  }

  useEffect(() => {
    if (!signOutOpen) return undefined;

    function handleEscape(event) {
      if (event.key === "Escape") closeSignOut();
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [signOutOpen, signingOut]);

  async function saveProfile(event) {
    event.preventDefault();
    setSavingProfile(true);
    setProfileMessage("");
    setProfileErrorMessage("");

    try {
      const response = await fetch(`${API_URL}/api/users/me`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(profileValues),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok)
        throw new Error(data?.message || "Unable to save your profile.");
      setProfileMessage("Profile updated successfully.");
      window.dispatchEvent(new Event("user-profile-updated"));
    } catch (saveError) {
      setProfileErrorMessage(saveError.message);
    } finally {
      setSavingProfile(false);
    }
  }

  async function changePassword(event) {
    event.preventDefault();
    setPasswordMessage("");
    setPasswordError("");
    if (password.newPassword.length < 8) {
      setPasswordError("Your new password must be at least 8 characters.");
      return;
    }

    setSavingPassword(true);
    try {
      const response = await fetch(`${API_URL}/api/users/me/password`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(password),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok)
        throw new Error(data?.message || "Unable to change your password.");
      setPassword({ currentPassword: "", newPassword: "" });
      setPasswordMessage("Password changed successfully.");
    } catch (changeError) {
      setPasswordError(changeError.message);
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <StudentLayout title="Profile">
      <div className="content student-profile-page">
        <header className="profile-page-heading">
          <p className="eyebrow">Account</p>
          <h2>Your profile and settings</h2>
          <p>
            Keep your personal details current for certificates and your
            learning record.
          </p>
        </header>

        {loading ? <p>Loading your profile...</p> : null}
        {profileError ? (
          <p className="profile-message error" role="alert">
            {profileError}
          </p>
        ) : null}

        {profileValues ? (
          <>
            <section
              className="profile-section"
              aria-labelledby="personal-details-heading"
            >
              <div className="profile-section-heading">
                <h3 id="personal-details-heading">Personal details</h3>
                <p>
                  These details are used on your BridgeTech profile and
                  certificates.
                </p>
              </div>
              <form className="profile-form" onSubmit={saveProfile}>
                <label>
                  First name
                  <input
                    name="firstName"
                    value={profileValues.firstName}
                    onChange={updateProfileField}
                    required
                  />
                </label>
                <label>
                  Last name
                  <input
                    name="lastName"
                    value={profileValues.lastName}
                    onChange={updateProfileField}
                    required
                  />
                </label>
                <label>
                  Email address
                  <input
                    name="email"
                    type="email"
                    value={profileValues.email}
                    onChange={updateProfileField}
                    required
                  />
                </label>
                <label>
                  Cellphone number
                  <input
                    name="phoneNumber"
                    type="tel"
                    value={profileValues.phoneNumber}
                    onChange={updateProfileField}
                    placeholder="+27 00 000 0000"
                  />
                </label>
                <label className="wide-field">
                  Address
                  <textarea
                    name="address"
                    value={profileValues.address}
                    onChange={updateProfileField}
                    rows="3"
                  />
                </label>
                <label className="wide-field">
                  University
                  <input
                    name="university"
                    value={profileValues.university}
                    onChange={updateProfileField}
                  />
                </label>
                <div className="profile-actions wide-field">
                  <button
                    className="btn blue"
                    type="submit"
                    disabled={savingProfile}
                  >
                    {savingProfile ? "Saving..." : "Save profile"}
                  </button>
                  {profileMessage ? (
                    <span className="profile-message success">
                      {profileMessage}
                    </span>
                  ) : null}
                  {profileErrorMessage ? (
                    <span className="profile-message error" role="alert">
                      {profileErrorMessage}
                    </span>
                  ) : null}
                </div>
              </form>
            </section>

            <section
              className="profile-section"
              aria-labelledby="security-heading"
            >
              <div className="profile-section-heading">
                <h3 id="security-heading">Security</h3>
                <p>Change your password using your current password.</p>
              </div>
              <form
                className="profile-form security-form"
                onSubmit={changePassword}
              >
                <label>
                  Current password
                  <input
                    type="password"
                    value={password.currentPassword}
                    onChange={(event) =>
                      setPassword({
                        ...password,
                        currentPassword: event.target.value,
                      })
                    }
                    required
                  />
                </label>
                <label>
                  New password
                  <input
                    type="password"
                    minLength="8"
                    value={password.newPassword}
                    onChange={(event) =>
                      setPassword({
                        ...password,
                        newPassword: event.target.value,
                      })
                    }
                    required
                  />
                </label>
                <div className="profile-actions wide-field">
                  <button
                    className="btn blue"
                    type="submit"
                    disabled={savingPassword}
                  >
                    {savingPassword ? "Updating..." : "Change password"}
                  </button>
                  {passwordMessage ? (
                    <span className="profile-message success">
                      {passwordMessage}
                    </span>
                  ) : null}
                  {passwordError ? (
                    <span className="profile-message error" role="alert">
                      {passwordError}
                    </span>
                  ) : null}
                </div>
              </form>
            </section>

            <section className="profile-section profile-signout-section">
              <div className="profile-section-heading">
                <h3>Sign out</h3>
                <p>End your current BridgeTech session on this device.</p>
              </div>
              <button
                className="btn"
                type="button"
                onClick={() => setSignOutOpen(true)}
              >
                Sign out
              </button>
            </section>
          </>
        ) : null}
      </div>
      {signOutOpen ? (
        <div
          className={`bt-signout-backdrop${signOutClosing ? " is-closing" : ""}`}
          role="presentation"
        >
          <section
            className={`bt-signout-modal${signOutClosing ? " is-closing" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-signout-heading"
            aria-describedby="profile-signout-description"
          >
            <div className="bt-signout-icon" aria-hidden="true">
              <LogOut size={22} />
            </div>
            <p className="bt-signout-eyebrow">ACCOUNT</p>
            <h2 id="profile-signout-heading">Sign out of BridgeTech?</h2>
            <p id="profile-signout-description">
              You will need to sign in again to access your workspace.
            </p>
            <div className="bt-signout-actions">
              <button
                type="button"
                className="bt-signout-cancel"
                disabled={signingOut}
                onClick={closeSignOut}
              >
                Cancel
              </button>
              <button
                type="button"
                className="bt-signout-confirm"
                disabled={signingOut}
                onClick={() => {
                  setSigningOut(true);
                  setSignOutClosing(true);
                  window.setTimeout(() => {
                    clearAuthTokens();
                    navigate("/", { replace: true });
                  }, 220);
                }}
              >
                {signingOut ? "Signing out..." : "Sign out"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </StudentLayout>
  );
}
