import { useState } from "react";
import StudentSidebar from "../components/StudentSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import Notifications from "../pages/Notifications";
import { student } from "../data/studentDashboard";
import "../pages/Home.css";
import "./AppLayout.css";

export default function StudentLayout({ title, children }) {
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
                <div className="avatar">{student.initials}</div>
                <span className="profile-name">{student.displayName}</span>
              </div>
            </header>

            {children}
          </div>
        </main>
      </SidebarProvider>
    </div>
  );
}
