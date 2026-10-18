import { BookOpen, LayoutDashboard, Library } from "lucide-react";
import NavigationSidebar from "./NavigationSidebar";

const groups = [
  {
    label: "Workspace",
    items: [
      { label: "Overview", path: "/instructor", icon: LayoutDashboard, end: true },
    ],
  },
  {
    label: "Learning",
    items: [
      { label: "Courses", path: "/instructor/modules", icon: BookOpen },
      { label: "Learning materials", path: "/instructor/lessons", icon: Library },
    ],
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
