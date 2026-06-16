import type { Role } from "@prisma/client";

export type NavIcon =
  | "LayoutDashboard"
  | "BookOpen"
  | "Video"
  | "PlayCircle"
  | "Megaphone"
  | "Users"
  | "GraduationCap"
  | "Settings"
  | "CalendarCheck";

export type NavItem = {
  label: string;
  href: string;
  icon: NavIcon;
};

export const navByRole: Record<Role, NavItem[]> = {
  STUDENT: [
    { label: "Dashboard", href: "/student", icon: "LayoutDashboard" },
    { label: "My Courses", href: "/student/courses", icon: "BookOpen" },
    { label: "Live Classes", href: "/student/live", icon: "Video" },
    { label: "Recordings", href: "/student/recordings", icon: "PlayCircle" },
    { label: "Announcements", href: "/student/announcements", icon: "Megaphone" },
  ],
  TEACHER: [
    { label: "Dashboard", href: "/teacher", icon: "LayoutDashboard" },
    { label: "Courses", href: "/teacher/courses", icon: "BookOpen" },
    { label: "Live Classes", href: "/teacher/live", icon: "Video" },
    { label: "Recordings", href: "/teacher/recordings", icon: "PlayCircle" },
    { label: "Attendance", href: "/teacher/attendance", icon: "CalendarCheck" },
  ],
  ADMIN: [
    { label: "Dashboard", href: "/admin", icon: "LayoutDashboard" },
    { label: "Users", href: "/admin/users", icon: "Users" },
    { label: "Courses", href: "/admin/courses", icon: "BookOpen" },
    { label: "Enrollments", href: "/admin/enrollments", icon: "GraduationCap" },
    { label: "Settings", href: "/admin/settings", icon: "Settings" },
  ],
};

export const roleLabel: Record<Role, string> = {
  STUDENT: "Student",
  TEACHER: "Teacher",
  ADMIN: "Administrator",
};
