import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import AppLayout from "../layouts/AppLayout";
import useCurrentUser from "../hooks/useCurrentUser";
import { useTheme } from "../contexts/ThemeContext";
import { clearAuthTokens, getToken } from "../utils/authStorage";
import "./StudentProfile.css";
import "./InstructorSettings.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5174";

const defaultNotificationPreferences = {
  notifyNewSubmissions: true,
  notifyQuizCompletions: true,
  notifyPlatformUpdates: true,
};

const notificationOptions = [
  {
    key: "notifyNewSubmissions",
    title: "New submissions",
    description: "When a student submits practical work for review.",
  },
  {
    key: "notifyQuizCompletions",
    title: "Quiz completions",
    description: "When a student completes a quiz in your module.",
  },
  {
    key: "notifyPlatformUpdates",
    title: "Platform updates",
    description: "Announcements about new BridgeTech features.",
  },
];

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

export default function InstructorSettings() {
  const navigate = useNavigate();
  const { user, loading, error: profileError } = useCurrentUser();
  const { theme, profilePictureUrl, setProfilePictureUrl, updateTheme } =
    useTheme();
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
  const [savingTheme, setSavingTheme] = useState(false);
  const [notificationPreferences, setNotificationPreferences] = useState(
    defaultNotificationPreferences,
  );
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [savingNotification, setSavingNotification] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationError, setNotificationError] = useState("");
  const [pictureMessage, setPictureMessage] = useState("");
  const [pictureError, setPictureError] = useState("");
  const [editingPicture, setEditingPicture] = useState(false);
  const [selectedPictureFile, setSelectedPictureFile] = useState(null);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
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

  useEffect(() => {
    const controller = new AbortController();

    fetch(`${API_URL}/api/users/me/preferences`, {
      headers: { Authorization: `Bearer ${getToken()}` },
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(data?.message || "Unable to load notification preferences.");
        }
        setNotificationPreferences({
          notifyNewSubmissions: data.notifyNewSubmissions ?? true,
          notifyQuizCompletions: data.notifyQuizCompletions ?? true,
          notifyPlatformUpdates: data.notifyPlatformUpdates ?? true,
        });
      })
      .catch((error) => {
        if (error.name !== "AbortError") setNotificationError(error.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingNotifications(false);
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!signOutOpen) return undefined;

    function handleEscape(event) {
      if (event.key === "Escape" && !signingOut) setSignOutOpen(false);
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [signOutOpen, signingOut]);

  function updateProfileField(event) {
    setProfile({ ...profileValues, [event.target.name]: event.target.value });
  }

  async function changeTheme(event) {
    setSavingTheme(true);
    setPictureMessage("");
    setPictureError("");
    try {
      await updateTheme(event.target.value);
      setPictureMessage("Appearance preference saved.");
    } catch (error) {
      setPictureError(error.message || "Unable to save your appearance preference.");
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
      const response = await fetch(
        `${API_URL}/api/users/me/preferences/profile-picture`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${getToken()}` },
          body: formData,
        },
      );
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.message || "Unable to upload your profile picture.");
      }
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
      const response = await fetch(
        `${API_URL}/api/users/me/preferences/profile-picture`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${getToken()}` },
        },
      );
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.message || "Unable to remove your profile picture.");
      }
      setProfilePictureUrl(data.profilePictureUrl ?? null);
      setSelectedPictureFile(null);
      setEditingPicture(false);
      setPictureMessage("Profile picture removed.");
    } catch (error) {
      setPictureError(error.message);
    }
  }

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
      if (!response.ok) {
        throw new Error(data?.message || "Unable to save your profile.");
      }
      setProfileMessage(data?.message || "Profile updated successfully.");
      window.dispatchEvent(new Event("user-profile-updated"));
    } catch (error) {
      setProfileErrorMessage(error.message);
    } finally {
      setSavingProfile(false);
    }
  }

  async function updateNotificationPreference(key, checked) {
    const nextPreferences = {
      ...notificationPreferences,
      [key]: checked,
    };
    setSavingNotification(key);
    setNotificationMessage("");
    setNotificationError("");

    try {
      const response = await fetch(`${API_URL}/api/users/me/preferences`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({
          theme,
          ...nextPreferences,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.message || "Unable to save notification preferences.");
      }
      setNotificationPreferences({
        notifyNewSubmissions: data.notifyNewSubmissions ?? nextPreferences.notifyNewSubmissions,
        notifyQuizCompletions: data.notifyQuizCompletions ?? nextPreferences.notifyQuizCompletions,
        notifyPlatformUpdates: data.notifyPlatformUpdates ?? nextPreferences.notifyPlatformUpdates,
      });
      setNotificationMessage("Notification preference saved.");
    } catch (error) {
      setNotificationError(error.message);
    } finally {
      setSavingNotification("");
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
      if (!response.ok) {
        throw new Error(data?.message || "Unable to change your password.");
      }
      setPassword({ currentPassword: "", newPassword: "" });
      setPasswordMessage(data?.message || "Password changed successfully.");
    } catch (error) {
      setPasswordError(error.message);
    } finally {
      setSavingPassword(false);
    }
  }

  function signOut() {
    clearAuthTokens();
    navigate("/", { replace: true });
  }

  return (
    <AppLayout>
      <header className="top dashboard-header">
        <div>
          <h1>Settings</h1>
          <p>Manage your instructor profile, security, and workspace preferences.</p>
        </div>
      </header>
      <div className="content student-profile-page instructor-settings-page">
        <header className="profile-page-heading">
          <p className="eyebrow">Account</p>
          <h2>Your profile and settings</h2>
          <p>
            Keep your contact details up to date and personalize your
            instructor workspace.
          </p>
        </header>

        {loading && <p role="status">Loading your profile...</p>}
        {profileError && (
          <p className="profile-message error" role="alert">
            {profileError}
          </p>
        )}

        {profileValues && (
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
                      {profilePictureUrl && (
                        <button
                          className="btn profile-picture-remove-button"
                          type="button"
                          onClick={removeProfilePicture}
                          disabled={uploadingPicture}
                        >
                          Remove picture
                        </button>
                      )}
                    </div>
                    {selectedPictureFile && (
                      <p className="profile-picture-selected-file">
                        Selected: {selectedPictureFile.name}
                      </p>
                    )}
                  </div>
                </div>
                <label className="theme-select">
                  Theme
                  <select
                    value={theme}
                    onChange={changeTheme}
                    disabled={savingTheme}
                  >
                    <option value="system">System</option>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                  <span>System follows your device preference.</span>
                </label>
              </div>
              {pictureMessage && (
                <p className="profile-message success" role="status">
                  {pictureMessage}
                </p>
              )}
              {pictureError && (
                <p className="profile-message error" role="alert">
                  {pictureError}
                </p>
              )}
            </section>

            <section className="profile-section" aria-labelledby="personal-details-heading">
              <div className="profile-section-heading">
                <h3 id="personal-details-heading">Personal details</h3>
                <p>These details are used on your instructor profile.</p>
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
                    readOnly
                    aria-describedby="instructor-settings-email-help"
                  />
                  <span id="instructor-settings-email-help">
                    Contact an administrator to change your email address.
                  </span>
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
                  {profileMessage && (
                    <span className="profile-message success" role="status">
                      {profileMessage}
                    </span>
                  )}
                  {profileErrorMessage && (
                    <span className="profile-message error" role="alert">
                      {profileErrorMessage}
                    </span>
                  )}
                </div>
              </form>
            </section>

            <section
              className="profile-section instructor-notification-section"
              aria-labelledby="instructor-notifications-heading"
            >
              <div className="profile-section-heading">
                <h3 id="instructor-notifications-heading">Notifications</h3>
                <p>Choose the instructor updates you want to receive.</p>
              </div>
              {loadingNotifications ? (
                <p className="profile-message" role="status">
                  Loading notification preferences...
                </p>
              ) : (
                <div className="settings-notifications">
                  {notificationOptions.map((option) => (
                    <label className="settings-notification" key={option.key}>
                      <span>
                        <strong>{option.title}</strong>
                        <span id={`${option.key}-description`}>
                          {option.description}
                        </span>
                      </span>
                      <input
                        type="checkbox"
                        checked={notificationPreferences[option.key]}
                        aria-label={option.title}
                        aria-describedby={`${option.key}-description`}
                        disabled={Boolean(savingNotification)}
                        onChange={(event) =>
                          updateNotificationPreference(option.key, event.target.checked)
                        }
                      />
                    </label>
                  ))}
                </div>
              )}
              {notificationMessage && (
                <p className="profile-message success" role="status">
                  {notificationMessage}
                </p>
              )}
              {notificationError && (
                <p className="profile-message error" role="alert">
                  {notificationError}
                </p>
              )}
            </section>

            <section className="profile-section" aria-labelledby="instructor-security-heading">
              <div className="profile-section-heading">
                <h3 id="instructor-security-heading">Security</h3>
                <p>Change your password using your current password.</p>
              </div>
              <form className="profile-form security-form" onSubmit={changePassword}>
                <label>
                  Current password
                  <input
                    type="password"
                    value={password.currentPassword}
                    onChange={(event) =>
                      setPassword({ ...password, currentPassword: event.target.value })
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
                      setPassword({ ...password, newPassword: event.target.value })
                    }
                    required
                  />
                </label>
                <div className="profile-actions wide-field">
                  <button className="btn blue" type="submit" disabled={savingPassword}>
                    {savingPassword ? "Updating..." : "Change password"}
                  </button>
                  {passwordMessage && (
                    <span className="profile-message success" role="status">
                      {passwordMessage}
                    </span>
                  )}
                  {passwordError && (
                    <span className="profile-message error" role="alert">
                      {passwordError}
                    </span>
                  )}
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
        )}
      </div>

      {signOutOpen && (
        <div className="bt-signout-backdrop" role="presentation">
          <section
            className="bt-signout-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="instructor-signout-heading"
            aria-describedby="instructor-signout-description"
          >
            <div className="bt-signout-icon" aria-hidden="true">
              <LogOut size={22} />
            </div>
            <p className="bt-signout-eyebrow">ACCOUNT</p>
            <h2 id="instructor-signout-heading">Sign out of BridgeTech?</h2>
            <p id="instructor-signout-description">
              You will need to sign in again to access your workspace.
            </p>
            <div className="bt-signout-actions">
              <button
                type="button"
                className="bt-signout-cancel"
                disabled={signingOut}
                onClick={() => setSignOutOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="bt-signout-confirm"
                disabled={signingOut}
                onClick={() => {
                  setSigningOut(true);
                  window.setTimeout(signOut, 220);
                }}
              >
                {signingOut ? "Signing out..." : "Sign out"}
              </button>
            </div>
          </section>
        </div>
      )}
    </AppLayout>
  );
}
