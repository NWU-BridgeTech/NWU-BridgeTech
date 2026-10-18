
import {
  BookOpen,
  LayoutDashboard,
  Library,
  ClipboardCheck,
} from "lucide-react";

import NavigationSidebar from "./NavigationSidebar";

const groups = [
  {
    label: "Workspace",
    items: [
      {
        label: "Overview",
        path: "/instructor",
        icon: LayoutDashboard,
        end: true,
      },
    ],
  },
  {
    label: "Learning",
    items: [
      {
        label: "Courses",
        path: "/instructor/modules",
        icon: BookOpen,
      },
      {
        label: "Learning materials",
        path: "/instructor/lessons",
        icon: Library,
      },
      {
        label: "Assessments",
        path: "/instructor/assessments",
        icon: ClipboardCheck,
      },
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
