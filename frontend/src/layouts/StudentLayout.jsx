import { useState } from "react";
import { Link } from "react-router-dom";
import StudentSidebar from "../components/StudentSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import Notifications from "../pages/Notifications";
import useCurrentUser from "../hooks/useCurrentUser";
import { Moon, Sun } from "lucide-react";
import "../pages/Home.css";
import "./AppLayout.css";
import { useTheme } from "../contexts/ThemeContext";

export default function StudentLayout({ title, children }) {
  const { user } = useCurrentUser();
  const { effectiveTheme, profilePictureUrl, updateTheme } = useTheme();
  const [defaultOpen] = useState(
    () =>
      typeof document === "undefined" ||
      !document.cookie.split("; ").includes("sidebar_state=false"),
  );

  async function toggleTheme() {
    const nextTheme = effectiveTheme === "dark" ? "light" : "dark";
    try {
      await updateTheme(nextTheme);
    } catch (error) {
      console.error("Unable to save the selected theme.", error);
    }
  }

  return (
    <div className="student-layout app-layout">
      <SidebarProvider
        defaultOpen={defaultOpen}
        style={{ "--sidebar-width": "248px", "--sidebar-width-icon": "64px" }}
      >
        <StudentSidebar />
        <main className="app-layout-main">
          <div className="app-mobile-navigation">
            <SidebarTrigger aria-label="Open student navigation" />
            <span>
              BridgeTech <span> / Student workspace</span>
            </span>
          </div>
          <div className="home-page">
            <header className="top">
              <h1 className="page-title" id="student-page-title">
                {title}
              </h1>
              <div className="profile">
                <button
                  className="theme-switch"
                  type="button"
                  role="switch"
                  aria-checked={effectiveTheme === "dark"}
                  aria-label={`Switch to ${effectiveTheme === "dark" ? "light" : "dark"} mode`}
                  title={`Switch to ${effectiveTheme === "dark" ? "light" : "dark"} mode`}
                  onClick={toggleTheme}
                >
                  <Sun aria-hidden="true" size={15} />
                  <span className="theme-switch-track">
                    <span className="theme-switch-thumb" />
                  </span>
                  <Moon aria-hidden="true" size={15} />
                </button>
                <Notifications />
                <Link
                  to="/student/profile"
                  className="profile-link"
                  aria-label="Open your profile and settings"
                >
                  <div className="avatar">
                    {profilePictureUrl ? (
                      <img src={profilePictureUrl} alt="" />
                    ) : user ? (
                      `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`
                    ) : ""}
                  </div>
                  <span className="profile-name">
                    {user ? `${user.firstName} ${user.lastName}`.trim() : ""}
                  </span>
                </Link>
              </div>
            </header>

            {children}
          </div>
        </main>
      </SidebarProvider>
    </div>
  );
}
