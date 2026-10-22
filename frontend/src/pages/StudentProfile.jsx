import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import StudentLayout from "../layouts/StudentLayout";
import useCurrentUser from "../hooks/useCurrentUser";
import { clearAuthTokens, getToken } from "../utils/authStorage";
import { LogOut } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import SupportTicketForm from "../components/student/SupportTicketForm";
import "./StudentProfile.css";
import { API_URL } from "@/config";

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

export default function StudentProfile() {
  const navigate = useNavigate();
  const { user, loading, error: profileError } = useCurrentUser();
  const { theme, profilePictureUrl, setProfilePictureUrl, updateTheme } =
    useTheme();
  const [profile, setProfile] = useState(null);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileErrorMessage, setProfileErrorMessage] = useState("");
  const [passwordStep, setPasswordStep] = useState("request");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [signOutClosing, setSignOutClosing] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [savingTheme, setSavingTheme] = useState(false);
  const [pictureMessage, setPictureMessage] = useState("");
  const [pictureError, setPictureError] = useState("");
  const [editingPicture, setEditingPicture] = useState(false);
  const [selectedPictureFile, setSelectedPictureFile] = useState(null);
  const [uploadingPicture, setUploadingPicture] = useState(false);

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

  async function changeTheme(event) {
    setSavingTheme(true);
    try {
      await updateTheme(event.target.value);
    } catch (error) {
      setPictureError(error.message);
    } finally {
      setSavingTheme(false);
    }
  }

  function selectProfilePicture(event) {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    setSelectedPictureFile(file);
    setPictureMessage("");
    setPictureError("");
  }

  async function uploadProfilePicture() {
    if (!selectedPictureFile) return;

    setPictureMessage("");
    setPictureError("");
    const formData = new FormData();
    formData.append("file", selectedPictureFile);
    setUploadingPicture(true);
    try {
      const response = await fetch(`${API_URL}/api/users/me/preferences/profile-picture`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message || "Unable to upload your profile picture.");
      setProfilePictureUrl(data.profilePictureUrl ?? null);
      setSelectedPictureFile(null);
      setEditingPicture(false);
      setPictureMessage("Profile picture updated.");
    } catch (error) {
      setPictureError(error.message);
    } finally {
      setUploadingPicture(false);
    }
  }

  async function removeProfilePicture() {
    setPictureMessage("");
    setPictureError("");
    try {
      const response = await fetch(`${API_URL}/api/users/me/preferences/profile-picture`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!response.ok) throw new Error("Unable to remove your profile picture.");
      setProfilePictureUrl(null);
      setSelectedPictureFile(null);
      setEditingPicture(false);
      setPictureMessage("Profile picture removed.");
    } catch (error) {
      setPictureError(error.message);
    }
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

  async function postPasswordRequest(path, body, fallbackMessage) {
    const response = await fetch(`${API_URL}/api/auth/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || fallbackMessage);
    }
    return data;
  }

  async function sendPasswordVerificationCode() {
    setPasswordMessage("");
    setPasswordError("");
    const email = user?.email?.trim();
    if (!email) {
      setPasswordError("We couldn't find an email address for your account.");
      return;
    }

    setSavingPassword(true);
    try {
      await postPasswordRequest(
        "forgot-password",
        { email },
        "Unable to send a verification code.",
      );
      setResetCode("");
      setNewPassword("");
      setConfirmNewPassword("");
      setPasswordStep("verify");
      setPasswordMessage(
        `If your account can reset by email, a verification code has been sent to ${email}.`,
      );
    } catch (requestError) {
      setPasswordError(
        requestError.message || "Unable to send a verification code.",
      );
    } finally {
      setSavingPassword(false);
    }
  }

  async function changePassword(event) {
    event.preventDefault();
    setPasswordMessage("");
    setPasswordError("");
    if (!/^\d{6}$/.test(resetCode)) {
      setPasswordError("Enter the 6-digit verification code from your email.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("Your new password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError("Your new passwords don't match.");
      return;
    }

    const email = user?.email?.trim();
    if (!email) {
      setPasswordError("We couldn't find an email address for your account.");
      return;
    }

    setSavingPassword(true);
    try {
      await postPasswordRequest(
        "reset-password",
        { email, code: resetCode, newPassword },
        "Unable to reset your password.",
      );
      setPasswordStep("complete");
      setResetCode("");
      setNewPassword("");
      setConfirmNewPassword("");
      setPasswordMessage("Password changed successfully.");
    } catch (changeError) {
      setPasswordError(
        changeError.message || "Unable to reset your password.",
      );
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
            <section className="profile-section profile-preferences-section">
              <div className="profile-section-heading">
                <h3>Appearance and profile picture</h3>
                <p>Personalize your BridgeTech workspace across your devices.</p>
              </div>
              <div className="profile-preferences-grid">
                <div className="profile-picture-controls">
                  <div className="profile-picture-preview">
                    {profilePictureUrl ? (
                      <img src={profilePictureUrl} alt="Your profile" />
                    ) : (
                      `${profileValues.firstName?.[0] ?? ""}${profileValues.lastName?.[0] ?? ""}`
                    )}
                  </div>
                  <div>
                    <strong>Profile picture</strong>
                    <p>JPEG, PNG, or WebP up to 5 MB.</p>
                    <div className="profile-picture-actions">
                      {!editingPicture ? (
                        <button
                          className="btn profile-picture-edit-button"
                          type="button"
                          onClick={() => {
                            setPictureMessage("");
                            setPictureError("");
                            setEditingPicture(true);
                          }}
                        >
                          Edit
                        </button>
                      ) : (
                        <>
                          <label className="btn profile-picture-choose-button">
                            Choose picture
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              onChange={selectProfilePicture}
                              hidden
                            />
                          </label>
                          <button
                            className="btn blue"
                            type="button"
                            onClick={uploadProfilePicture}
                            disabled={!selectedPictureFile || uploadingPicture}
                          >
                            {uploadingPicture ? "Uploading..." : "Upload picture"}
                          </button>
                          {profilePictureUrl ? (
                            <button
                              className="btn profile-picture-remove-button"
                              type="button"
                              onClick={removeProfilePicture}
                              disabled={uploadingPicture}
                            >
                              Remove picture
                            </button>
                          ) : null}
                          <button
                            className="btn profile-picture-cancel-button"
                            type="button"
                            onClick={() => {
                              setSelectedPictureFile(null);
                              setPictureError("");
                              setEditingPicture(false);
                            }}
                            disabled={uploadingPicture}
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                    {selectedPictureFile ? (
                      <p className="profile-picture-selected-file">
                        Selected: {selectedPictureFile.name}
                      </p>
                    ) : null}
                  </div>
                </div>
                <label className="theme-select">
                  Theme
                  <select value={theme} onChange={changeTheme} disabled={savingTheme}>
                    <option value="system">System</option>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                  <span>System follows your device preference.</span>
                </label>
              </div>
              {pictureMessage ? <p className="profile-message success">{pictureMessage}</p> : null}
              {pictureError ? <p className="profile-message error" role="alert">{pictureError}</p> : null}
            </section>
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
                    className="btn blue save-profile-button"
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
                <p>
                  Verify your email before changing your password. We&apos;ll
                  send a 6-digit code to {user?.email}.
                </p>
              </div>
              {passwordStep === "request" ? (
                <div className="profile-form security-form">
                  <div className="profile-actions wide-field">
                    <button
                      className="btn blue"
                      type="button"
                      onClick={sendPasswordVerificationCode}
                      disabled={savingPassword || !user?.email}
                    >
                      {savingPassword
                        ? "Sending code..."
                        : "Email me a verification code"}
                    </button>
                    {passwordError ? (
                      <span className="profile-message error" role="alert">
                        {passwordError}
                      </span>
                    ) : null}
                  </div>
                </div>
              ) : null}
              {passwordStep === "verify" ? (
                <form
                  className="profile-form security-form"
                  onSubmit={changePassword}
                >
                  {passwordMessage ? (
                    <p className="profile-message success wide-field" role="status">
                      {passwordMessage} Check your inbox and spam folder. The
                      code expires in 10 minutes.
                    </p>
                  ) : null}
                  <label className="wide-field">
                    Email verification code
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      pattern="[0-9]{6}"
                      maxLength="6"
                      value={resetCode}
                      onChange={(event) =>
                        setResetCode(
                          event.target.value.replace(/\D/g, "").slice(0, 6),
                        )
                      }
                      required
                    />
                  </label>
                  <label>
                    New password
                    <input
                      type="password"
                      autoComplete="new-password"
                      minLength="8"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      required
                    />
                  </label>
                  <label>
                    Confirm new password
                    <input
                      type="password"
                      autoComplete="new-password"
                      minLength="8"
                      value={confirmNewPassword}
                      onChange={(event) =>
                        setConfirmNewPassword(event.target.value)
                      }
                      aria-invalid={
                        confirmNewPassword.length > 0 &&
                        confirmNewPassword !== newPassword
                      }
                      required
                    />
                    {confirmNewPassword.length > 0 &&
                    confirmNewPassword !== newPassword ? (
                      <span className="profile-message error">
                        Your new passwords don&apos;t match.
                      </span>
                    ) : null}
                  </label>
                  <div className="profile-actions wide-field">
                    <button
                      className="btn blue"
                      type="submit"
                      disabled={
                        savingPassword ||
                        resetCode.length !== 6 ||
                        newPassword.length < 8 ||
                        newPassword !== confirmNewPassword
                      }
                    >
                      {savingPassword
                        ? "Changing password..."
                        : "Change password"}
                    </button>
                    <button
                      className="btn"
                      type="button"
                      onClick={sendPasswordVerificationCode}
                      disabled={savingPassword}
                    >
                      Send a new code
                    </button>
                    <button
                      className="btn"
                      type="button"
                      onClick={() => {
                        setPasswordStep("request");
                        setResetCode("");
                        setNewPassword("");
                        setConfirmNewPassword("");
                        setPasswordMessage("");
                        setPasswordError("");
                      }}
                      disabled={savingPassword}
                    >
                      Cancel
                    </button>
                    {passwordError ? (
                      <span className="profile-message error" role="alert">
                        {passwordError}
                      </span>
                    ) : null}
                  </div>
                </form>
              ) : null}
              {passwordStep === "complete" ? (
                <div className="profile-actions">
                  <span className="profile-message success" role="status">
                    {passwordMessage}
                  </span>
                  <button
                    className="btn"
                    type="button"
                    onClick={() => {
                      setPasswordStep("request");
                      setPasswordMessage("");
                      setPasswordError("");
                    }}
                  >
                    Change password again
                  </button>
                </div>
              ) : null}
            </section>

            <section
              className="profile-section"
              aria-labelledby="report-problem-heading"
            >
              <div className="profile-section-heading">
                <h3 id="report-problem-heading">Report a problem</h3>
                <p>
                  Something not working? Tell us and an administrator will
                  look into it.
                </p>
              </div>
              <SupportTicketForm />
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
