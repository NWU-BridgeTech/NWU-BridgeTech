import {
  Award,
  BookOpen,
  ClipboardCheck,
  Code2,
  GitBranch,
  LayoutDashboard,
} from "lucide-react";
import NavigationSidebar from "./NavigationSidebar";

// Student pages use their own menu, separate from administration.
const groups = [
  {
    label: "Learning",
    items: [
      { label: "Home", path: "/home", icon: LayoutDashboard, end: true },
      { label: "My courses", path: "/student/courses", icon: BookOpen },
      {
        label: "Assessments",
        path: "/student/assessments",
        icon: ClipboardCheck,
      },
      { label: "Practical work", path: "/student/practical-work", icon: Code2 },
    ],
  },
  {
    label: "Your progress",
    items: [
      {
        label: "Certificates",
        path: "/student/certificates",
        icon: Award,
      },
      {
        label: "GitHub activity",
        path: "/student/github",
        icon: GitBranch,
      },
    ],
  },
];

export default function StudentSidebar() {
  return (
    <NavigationSidebar
      groups={groups}
      homePath="/home"
      title="Student workspace"
    />
  );
}
