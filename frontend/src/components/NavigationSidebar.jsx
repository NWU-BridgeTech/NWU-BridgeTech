import { Link, NavLink, useNavigate } from "react-router-dom";
import { LogOut, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Sidebar as SidebarRoot,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import "./Sidebar.css";
import { clearAuthTokens } from "../utils/authStorage";

export default function NavigationSidebar({ groups, homePath, title }) {
  const { state, isMobile, toggleSidebar, setOpenMobile } = useSidebar();
  const navigate = useNavigate();
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [signOutClosing, setSignOutClosing] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const collapsed = state === "collapsed";
  const toggleLabel = collapsed ? "Expand sidebar" : "Collapse sidebar";
  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose;

  function closeMobile() {
    if (isMobile) setOpenMobile(false);
  }

  function closeSignOut() {
    if (signingOut) return;
    setSignOutClosing(true);
    window.setTimeout(() => {
      setSignOutOpen(false);
      setSignOutClosing(false);
    }, 180);
  }

  useEffect(() => {
    if (!signOutOpen) return undefined;

    function handleEscape(event) {
      if (event.key === "Escape") closeSignOut();
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [signOutOpen]);

  return (
    <SidebarRoot collapsible="icon" className="bt-sidebar">
      <SidebarHeader className="bt-sidebar-header">
        <Link
          to={homePath}
          className="bt-brand"
          aria-label={`BridgeTech ${title.toLowerCase()} home`}
          onClick={closeMobile}
        >
          <span className="bt-brand-mark" aria-hidden="true">
            bt
          </span>
          <span className="bt-brand-copy">
            <strong>BridgeTech</strong>
            <span>{title}</span>
          </span>
        </Link>
        {!isMobile && (
          <SidebarMenuButton
            onClick={toggleSidebar}
            tooltip={toggleLabel}
            aria-label={toggleLabel}
            aria-expanded={!collapsed}
            className="bt-nav-link bt-collapse-control"
          >
            <ToggleIcon aria-hidden="true" strokeWidth={1.7} />
            {!collapsed && <span>Collapse</span>}
          </SidebarMenuButton>
        )}
        {isMobile && (
          <button
            className="bt-close-navigation"
            onClick={closeMobile}
            aria-label="Close navigation"
          >
            <X size={18} aria-hidden="true" />
          </button>
        )}
      </SidebarHeader>

      <SidebarContent className="bt-sidebar-content">
        <nav aria-label={title}>
          {groups.map(({ label, items }) => (
            <SidebarGroup key={label} className="bt-nav-group">
              <SidebarGroupLabel>{label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map(({ label: name, path, icon: Icon, end }) => (
                    <SidebarMenuItem key={path}>
                      <SidebarMenuButton
                        asChild
                        tooltip={name}
                        className="bt-nav-link"
                      >
                        <NavLink
                          to={path}
                          end={end}
                          onClick={closeMobile}
                          aria-label={name}
                        >
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
            <SidebarMenuButton
              tooltip="Sign out"
              className="bt-nav-link"
              onClick={() => {
                closeMobile();
                setSignOutOpen(true);
              }}
              aria-label="Sign out"
            >
              <LogOut aria-hidden="true" strokeWidth={1.7} />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      {signOutOpen && (
        <div
          className={`bt-signout-backdrop${signOutClosing ? " is-closing" : ""}`}
          role="presentation"
        >
          <section
            className={`bt-signout-modal${signOutClosing ? " is-closing" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="sidebar-signout-heading"
            aria-describedby="sidebar-signout-description"
          >
            <div className="bt-signout-icon" aria-hidden="true">
              <LogOut size={22} />
            </div>
            <p className="bt-signout-eyebrow">ACCOUNT</p>
            <h2 id="sidebar-signout-heading">Sign out of BridgeTech?</h2>
            <p id="sidebar-signout-description">
              You will need to sign in again to access your workspace.
            </p>
            <div className="bt-signout-actions">
              <button
                type="button"
                className="bt-signout-cancel"
                disabled={signingOut}
                onClick={closeSignOut}
              >
                Cancel
              </button>
              <button
                type="button"
                className="bt-signout-confirm"
                disabled={signingOut}
                onClick={() => {
                  setSigningOut(true);
                  setSignOutClosing(true);
                  window.setTimeout(() => {
                    clearAuthTokens();
                    navigate("/", { replace: true });
                  }, 220);
                }}
              >
                {signingOut ? "Signing out..." : "Sign out"}
              </button>
            </div>
          </section>
        </div>
      )}
    </SidebarRoot>
  );
}
