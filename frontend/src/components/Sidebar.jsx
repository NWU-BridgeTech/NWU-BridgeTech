import { Link, NavLink, useLocation } from "react-router-dom";
import {
  PanelsTopLeft, BookOpen, ClipboardCheck, Code2, GraduationCap,
  LayoutDashboard, Layers, PanelLeftClose, PanelLeftOpen,
  Settings2, ShieldCheck, Activity, X,
} from "lucide-react";
import {
  Sidebar as SidebarRoot, SidebarContent, SidebarFooter, SidebarGroup,
  SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu,
  SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";
import "./Sidebar.css";

const groups = [
  { label: "Workspace", items: [
    { label: "Overview", path: "/admin", icon: LayoutDashboard, end: true },
  ] },
  { label: "Learning", items: [
    { label: "Modules", path: "/admin/modules", icon: Layers },
    { label: "Lessons", path: "/admin/lessons", icon: BookOpen },
    { label: "Assessments", path: "/admin/assessments", icon: ClipboardCheck },
    { label: "Practical exercises", path: "/admin/practical-exercises", icon: Code2 },
  ] },
  { label: "People", items: [
    { label: "Students", path: "/admin/students", icon: GraduationCap },
    { label: "Administrators", path: "/admin/administrators", icon: ShieldCheck },
  ] },
  { label: "Manage", items: [
    { label: "System status", path: "/system-status", icon: Activity },
    { label: "Settings", path: "/admin/settings", icon: Settings2 },
  ] },
];

export default function Sidebar() {
  const { pathname } = useLocation();
  const { state, isMobile, toggleSidebar, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const closeMobile = () => { if (isMobile) setOpenMobile(false); };

  return (
    <SidebarRoot collapsible="icon" className="bt-sidebar">
      <SidebarHeader className="bt-sidebar-header">
        <Link to="/admin" className="bt-brand" aria-label="BridgeTech admin home" onClick={closeMobile}>
          <span className="bt-brand-mark" aria-hidden="true">bt</span>
          <span className="bt-brand-copy"><strong>BridgeTech</strong><span>Administration</span></span>
        </Link>
        {!isMobile && (
          <SidebarMenuButton
            onClick={toggleSidebar}
            tooltip={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            className="bt-nav-link bt-collapse-control"
          >
            {collapsed ? <PanelLeftOpen aria-hidden="true" strokeWidth={1.7} /> : <PanelLeftClose aria-hidden="true" strokeWidth={1.7} />}
            {!collapsed && <span>Collapse</span>}
          </SidebarMenuButton>
        )}
        {isMobile && (
          <button className="bt-close-navigation" onClick={closeMobile} aria-label="Close navigation">
            <X size={18} aria-hidden="true" />
          </button>
        )}
      </SidebarHeader>

      <SidebarContent className="bt-sidebar-content">
        <nav aria-label="Administration">
          {groups.map(({ label, items }) => (
            <SidebarGroup key={label} className="bt-nav-group">
              <SidebarGroupLabel>{label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map(({ label: name, path, icon: Icon, end }) => (
                    <SidebarMenuItem key={path}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === path || (!end && pathname.startsWith(`${path}/`))}
                        tooltip={name}
                        className="bt-nav-link"
                      >
                        <NavLink to={path} end={end} onClick={closeMobile} aria-label={name}>
                          <Icon aria-hidden="true" strokeWidth={1.7} />
                          <span>{name}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </nav>
      </SidebarContent>

      <SidebarFooter className="bt-sidebar-footer">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Public website" className="bt-nav-link">
              <Link to="/" onClick={closeMobile} aria-label="Public website">
                <PanelsTopLeft aria-hidden="true" strokeWidth={1.7} />
                <span>Public website</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

        </SidebarMenu>
      </SidebarFooter>
    </SidebarRoot>
  );
}
