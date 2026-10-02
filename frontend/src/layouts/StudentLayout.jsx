import { useState } from "react";
import { Link } from "react-router-dom";
import StudentSidebar from "../components/StudentSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import Notifications from "../pages/Notifications";
import useCurrentUser from "../hooks/useCurrentUser";
import "../pages/Home.css";
import "./AppLayout.css";

export default function StudentLayout({ title, children }) {
  const { user } = useCurrentUser();
  const [defaultOpen] = useState(
    () =>
      typeof document === "undefined" ||
      !document.cookie.split("; ").includes("sidebar_state=false"),
  );

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
                <Notifications />
                <Link
                  to="/student/profile"
                  className="profile-link"
                  aria-label="Open your profile and settings"
                >
                  <div className="avatar">
                    {user
                      ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`
                      : ""}
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
