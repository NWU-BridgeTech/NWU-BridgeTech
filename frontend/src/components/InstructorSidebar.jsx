import {
  BookOpen,
  CalendarDays,
  LayoutDashboard,
  Library,
  Settings,
} from "lucide-react";
import NavigationSidebar from "./NavigationSidebar";

const groups = [
  {
    label: "Workspace",
    items: [
      { label: "Overview", path: "/instructor", icon: LayoutDashboard, end: true },
      { label: "Calendar & notes", path: "/instructor/calendar", icon: CalendarDays },
    ],
  },
  {
    label: "Learning",
    items: [
      { label: "Courses", path: "/instructor/modules", icon: BookOpen },
      { label: "Learning materials", path: "/instructor/lessons", icon: Library },
    ],
  },
  {
    label: "Account",
    items: [{ label: "Settings", path: "/instructor/settings", icon: Settings }],
  },
];

export default function InstructorSidebar() {
  return (
    <NavigationSidebar
      groups={groups}
      homePath="/instructor"
      title="Instructor workspace"
    />
  );
}
