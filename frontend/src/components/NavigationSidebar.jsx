import { Link, NavLink, useLocation } from "react-router-dom";
import { PanelsTopLeft, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import {
  Sidebar as SidebarRoot,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import "./Sidebar.css";

export default function NavigationSidebar({ groups, homePath, title }) {
  const location = useLocation();
  const currentUrl = location.pathname + location.hash;
  const selectedSection = groups.some((group) =>
    group.items.some((item) => item.href === currentUrl),
  );
  const { state, isMobile, toggleSidebar, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const toggleLabel = collapsed ? "Expand sidebar" : "Collapse sidebar";
  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose;

  function closeMobile() {
    if (isMobile) setOpenMobile(false);
  }

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
                  {items.map(({ label: name, path, href, icon: Icon, end }) => (
                    <SidebarMenuItem key={path || href}>
                      <SidebarMenuButton
                        asChild
                        tooltip={name}
                        className="bt-nav-link"
                      >
                        {href ? (
                          <a
                            href={href}
                            onClick={closeMobile}
                            aria-label={name}
                            aria-current={
                              href === currentUrl ? "location" : undefined
                            }
                          >
                            <Icon aria-hidden="true" strokeWidth={1.7} />
                            <span>{name}</span>
                          </a>
                        ) : (
                          <NavLink
                            to={path}
                            end={end}
                            onClick={closeMobile}
                            aria-label={name}
                            aria-current={selectedSection ? false : "page"}
                          >
                            <Icon aria-hidden="true" strokeWidth={1.7} />
                            <span>{name}</span>
                          </NavLink>
                        )}
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
              asChild
              tooltip="Public website"
              className="bt-nav-link"
            >
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
