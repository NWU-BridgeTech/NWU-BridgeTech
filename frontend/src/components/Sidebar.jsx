import {
  GraduationCap,
  LayoutDashboard,
  LifeBuoy,
  Layers,
  Settings2,
  ShieldCheck,
  BarChart3,
} from "lucide-react";
import NavigationSidebar from "./NavigationSidebar";

function getGroups() {
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const staffLabel = currentUser?.role === "SuperAdmin"
    ? "Administrators"
    : "Instructors";

  return [
  {
    label: "Workspace",
    items: [
      { label: "Overview", path: "/admin", icon: LayoutDashboard, end: true },
    ],
  },
  {
    label: "Learning",
    items: [
      { label: "Modules", path: "/admin/modules", icon: Layers },
    ],
  },
  {
    label: "People",
    items: [
      { label: "Students", path: "/admin/students", icon: GraduationCap },
      {
        label: staffLabel,
        path: "/admin/administrators",
        icon: ShieldCheck,
      },
    ],
  },
  {
    label: "Manage",
    items: [
      { label: "Reports", path: "/admin/reports", icon: BarChart3 },
      { label: "Support tickets", path: "/admin/support", icon: LifeBuoy },
      { label: "Settings", path: "/admin/settings", icon: Settings2 },
    ],
  },
  ];
}

export default function Sidebar() {
  return (
    <NavigationSidebar
      groups={getGroups()}
      homePath="/admin"
      title="Administration"
    />
  );
}
