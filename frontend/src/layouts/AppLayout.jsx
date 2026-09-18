import { useState } from "react";
import Sidebar from "../components/Sidebar";
import "../pages/Admin.css";

export default function AppLayout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="admin-page">
      <div className={`app ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        <Sidebar
          sidebarCollapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((collapsed) => !collapsed)}
        />
        <main className="main">{children}</main>
      </div>
    </div>
  );
}
