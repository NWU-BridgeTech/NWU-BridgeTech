import { NavLink } from "react-router-dom";

const sideNav = [
  {
    icon: "▣",
    label: "Modules",
    path: "/admin/modules",
  },
  {
    icon: "☰",
    label: "Lessons",
    path: "/admin/lessons",
  },
  {
    icon: "✓",
    label: "Assessments",
    path: "/admin/assessments",
  },
  {
    icon: "↗",
    label: "Practical exercises",
    path: "/admin/practical-exercises",
  },
];

const peopleNav = [
  {
    icon: "◉",
    label: "Students",
    path: "/admin/students",
  },
  {
    icon: "◌",
    label: "Administrators",
    path: "/admin/administrators",
  },
];

export default function Sidebar({ sidebarCollapsed, onToggle }) {
  return (
<aside className="side">

          <div className="brand">
            Bridge<b>Tech</b>
          </div>

          <NavLink
            to="/admin"
            className={({ isActive }) => `nav${isActive ? " active" : ""}`}
            end
            title="Dashboard"
          >
            <span className="nav-icon">
              ▦
            </span>

            {!sidebarCollapsed && (
              <span>Dashboard</span>
            )}
          </NavLink>

          <div className="label">
            {!sidebarCollapsed && "LEARNING CONTENT"}
          </div>

          {sideNav.map((item) => (
            <NavLink
              to={item.path}
              className={({ isActive }) => `nav${isActive ? " active" : ""}`}
              key={item.label}
              title={item.label}
            >
              <span className="nav-icon">
                {item.icon}
              </span>

              {!sidebarCollapsed && (
                <span>{item.label}</span>
              )}
            </NavLink>
          ))}

          <div className="label">
            {!sidebarCollapsed && "PEOPLE"}
          </div>

          {peopleNav.map((item) => (
            <NavLink
              to={item.path}
              className={({ isActive }) => `nav${isActive ? " active" : ""}`}
              key={item.label}
              title={item.label}
            >
              <span className="nav-icon">
                {item.icon}
              </span>

              {!sidebarCollapsed && (
                <span>{item.label}</span>
              )}
            </NavLink>
          ))}

          <div className="label">
            {!sidebarCollapsed && "SYSTEM"}
          </div>

          <NavLink
            to="/system-status"
            className={({ isActive }) => `nav${isActive ? " active" : ""}`}
            title="System status"
          >
            <span className="nav-icon">
              ◆
            </span>

            {!sidebarCollapsed && (
              <span>System status</span>
            )}
          </NavLink>

          <NavLink
            to="/admin/settings"
            className={({ isActive }) => `nav${isActive ? " active" : ""}`}
            title="Settings"
          >
            <span className="nav-icon">
              ⚙
            </span>

            {!sidebarCollapsed && (
              <span>Settings</span>
            )}
          </NavLink>

          <NavLink
            to="/"
            className={({ isActive }) => `nav${isActive ? " active" : ""}`}
            title="Public website"
          >
            <span className="nav-icon">
              ⌂
            </span>

            {!sidebarCollapsed && (
              <span>Public website</span>
            )}
          </NavLink>

          {/* SIDEBAR TOGGLE */}
          <button
            className="sidebar-toggle"
            onClick={onToggle}
            title={
              sidebarCollapsed
                ? "Expand sidebar"
                : "Collapse sidebar"
            }
          >
            {sidebarCollapsed ? "→" : "←"}

            {!sidebarCollapsed && (
              <span>Collapse</span>
            )}
          </button>

        </aside>
  );
}
