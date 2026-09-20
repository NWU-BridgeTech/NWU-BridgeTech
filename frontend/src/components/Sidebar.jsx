import {
  BookOpen,
  ClipboardCheck,
  Code2,
  GraduationCap,
  LayoutDashboard,
  Layers,
  Settings2,
  ShieldCheck,
  Activity,
} from "lucide-react";
import NavigationSidebar from "./NavigationSidebar";

const groups = [
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
      { label: "Lessons", path: "/admin/lessons", icon: BookOpen },
      {
        label: "Assessments",
        path: "/admin/assessments",
        icon: ClipboardCheck,
      },
      {
        label: "Practical exercises",
        path: "/admin/practical-exercises",
        icon: Code2,
      },
    ],
  },
  {
    label: "People",
    items: [
      { label: "Students", path: "/admin/students", icon: GraduationCap },
      {
        label: "Administrators",
        path: "/admin/administrators",
        icon: ShieldCheck,
      },
    ],
  },
  {
    label: "Manage",
    items: [
      { label: "System status", path: "/system-status", icon: Activity },
      { label: "Settings", path: "/admin/settings", icon: Settings2 },
    ],
  },
];

export default function Sidebar() {
  return (
    <NavigationSidebar
      groups={groups}
      homePath="/admin"
      title="Administration"
    />
  );
}
