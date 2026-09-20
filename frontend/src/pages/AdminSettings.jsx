import { useState } from "react";
import AppLayout from "../layouts/AppLayout";
import {
  adminNotificationOptions,
  initialAdminSettings,
} from "../data/adminData";
import "./Admin.css";
import "./AdminSettings.css";

export default function AdminSettings() {
  const [settings, setSettings] = useState(initialAdminSettings);
  const [savedSettings, setSavedSettings] = useState(initialAdminSettings);
  const [message, setMessage] = useState("");
  const hasChanges = Object.keys(settings).some(
    (key) => settings[key] !== savedSettings[key],
  );

  function updateSetting(key, value) {
    setSettings({ ...settings, [key]: value });
    setMessage("");
  }

  function saveSettings(event) {
    event.preventDefault();
    if (!settings.name.trim()) {
      setMessage("Enter your full name before saving.");
      return;
    }
    const updatedSettings = {
      ...settings,
      name: settings.name.trim(),
      email: settings.email.trim(),
    };
    setSettings(updatedSettings);
    setSavedSettings(updatedSettings);
    setMessage(
      "Settings saved locally. Changes reset when you leave this page or reload.",
    );
  }

  return (
    <AppLayout>
      <header className="top dashboard-header">
        <div>
          <h1>Settings</h1>
          <p>Manage your profile and notification preferences.</p>
        </div>
      </header>
      <div className="content settings-page">
        <form onSubmit={saveSettings}>
          <section
            className="card settings-section"
            aria-labelledby="profile-settings-heading"
          >
            <div className="settings-section-heading">
              <h2 id="profile-settings-heading">Profile</h2>
              <p>Your administrator details.</p>
            </div>
            <div className="settings-fields">
              <div>
                <label htmlFor="settings-name">Full name</label>
                <input
                  id="settings-name"
                  name="name"
                  autoComplete="name"
                  required
                  maxLength={100}
                  value={settings.name}
                  onChange={(event) =>
                    updateSetting("name", event.target.value)
                  }
                />
              </div>
              <div>
                <label htmlFor="settings-email">Email address</label>
                <input
                  id="settings-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                  value={settings.email}
                  onChange={(event) =>
                    updateSetting("email", event.target.value)
                  }
                />
              </div>
              <div className="settings-role">
                <span>Role</span>
                <strong>{settings.role}</strong>
                <p>Roles are managed on the Administrators page.</p>
              </div>
            </div>
          </section>
          <section
            className="card settings-section"
            aria-labelledby="notification-settings-heading"
          >
            <div className="settings-section-heading">
              <h2 id="notification-settings-heading">Notifications</h2>
              <p>Choose the updates you want to receive.</p>
            </div>
            <div className="settings-notifications">
              {adminNotificationOptions.map((option) => (
                <label className="settings-notification" key={option.key}>
                  <span>
                    <strong>{option.title}</strong>
                    <span id={`${option.key}-description`}>
                      {option.description}
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={settings[option.key]}
                    aria-label={option.title}
                    aria-describedby={`${option.key}-description`}
                    onChange={(event) =>
                      updateSetting(option.key, event.target.checked)
                    }
                  />
                </label>
              ))}
            </div>
          </section>
          <div className="settings-actions">
            <div>
              <p className="settings-save-note">
                Changes apply to this page only.
              </p>
              <p className="settings-message" role="status">
                {message || (hasChanges ? "You have unsaved changes." : "")}
              </p>
            </div>
            <div className="settings-buttons">
              <button
                className="btn"
                type="button"
                disabled={!hasChanges}
                onClick={() => {
                  setSettings(savedSettings);
                  setMessage("Unsaved changes discarded.");
                }}
              >
                Discard changes
              </button>
              <button className="btn blue" type="submit" disabled={!hasChanges}>
                Save changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
