import { useState } from "react";
import Sidebar from "../components/Sidebar";
import InstructorSidebar from "../components/InstructorSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AdminUtilityBar from "../components/AdminUtilityBar";
import "./AppLayout.css";
import "../pages/Home.css";

export default function AppLayout({ children }) {
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const isInstructor = currentUser?.role === "Instructor";
  const navigationTitle = isInstructor
    ? "Instructor workspace"
    : "Administration";
  const [defaultOpen] = useState(
    () =>
      typeof document === "undefined" ||
      !document.cookie.split("; ").includes("sidebar_state=false"),
  );

  return (
    <div className="admin-page app-layout">
      <SidebarProvider
        defaultOpen={defaultOpen}
        style={{ "--sidebar-width": "248px", "--sidebar-width-icon": "64px" }}
      >
        {isInstructor ? <InstructorSidebar /> : <Sidebar />}
        <main className="app-layout-main">
          <div className="app-mobile-navigation">
            <SidebarTrigger aria-label="Open navigation" />
            <span>
              BridgeTech <span> / {navigationTitle}</span>
            </span>
          </div>
          <div className="home-page admin-notification-anchor">
            <AdminUtilityBar />
          </div>
          {children}
        </main>
      </SidebarProvider>
    </div>
  );
}
