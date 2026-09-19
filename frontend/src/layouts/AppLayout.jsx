import Sidebar from "../components/Sidebar";
import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import "./AppLayout.css";

export default function AppLayout({ children }) {
  const [defaultOpen] = useState(() =>
    typeof document === "undefined" || !document.cookie.split("; ").includes("sidebar_state=false")
  );
  return (
    <div className="admin-page app-layout">
      <SidebarProvider defaultOpen={defaultOpen} style={{ "--sidebar-width": "248px", "--sidebar-width-icon": "64px" }}>
        <Sidebar />
        <main className="app-layout-main">
          <div className="app-mobile-navigation">
            <SidebarTrigger aria-label="Open navigation" />
            <span>BridgeTech <span> / Administration</span></span>
          </div>
          {children}
        </main>
      </SidebarProvider>
    </div>
  );
}
