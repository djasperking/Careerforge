import {
  LayoutDashboard, FileText, GraduationCap, ClipboardCheck, CreditCard, User,
  Bot, BadgeCheck, Users, BookOpen, Megaphone, LifeBuoy, BarChart3, Settings,
  ScrollText, Bell, Sparkles, ClipboardList, Presentation, Package, CalendarClock, ShoppingBag,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { PermissionKey } from "@/lib/rbac";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  permission?: PermissionKey;
}

export const customerNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "CV Builder", href: "/dashboard/cvs", icon: FileText },
  { label: "AI Career Tools", href: "/dashboard/ai", icon: Sparkles },
  { label: "My Learning", href: "/dashboard/courses", icon: GraduationCap },
  { label: "My Purchases", href: "/dashboard/purchases", icon: ShoppingBag },
  { label: "Teach & Sell", href: "/instructor", icon: Presentation },
  { label: "Exams", href: "/dashboard/exams", icon: ClipboardCheck },
  { label: "Certificates", href: "/dashboard/certificates", icon: BadgeCheck },
  { label: "Payments", href: "/dashboard/payments", icon: CreditCard },
  { label: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { label: "Support", href: "/dashboard/support", icon: LifeBuoy },
  { label: "Profile", href: "/dashboard/profile", icon: User },
];

export const instructorNav: NavItem[] = [
  { label: "Overview", href: "/instructor", icon: LayoutDashboard },
  { label: "My Courses", href: "/instructor/courses", icon: BookOpen },
  { label: "Digital Products", href: "/instructor/products", icon: Package },
  { label: "Coaching", href: "/instructor/coaching", icon: CalendarClock },
  { label: "Back to dashboard", href: "/dashboard", icon: LayoutDashboard },
];

export const adminNav: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Review queue", href: "/admin/review", icon: ClipboardList, permission: "instructors:review" },
  { label: "Users", href: "/admin/users", icon: Users, permission: "users:read" },
  { label: "Courses", href: "/admin/courses", icon: BookOpen, permission: "courses:read" },
  { label: "Exams", href: "/admin/exams", icon: ClipboardCheck, permission: "exams:read" },
  { label: "Certificates", href: "/admin/certificates", icon: BadgeCheck, permission: "courses:read" },
  { label: "CV Templates", href: "/admin/cv-templates", icon: FileText, permission: "cv:templates" },
  { label: "AI", href: "/admin/ai", icon: Bot, permission: "ai:config" },
  { label: "Payments", href: "/admin/payments", icon: CreditCard, permission: "payments:read" },
  { label: "Subscriptions", href: "/admin/subscriptions", icon: CreditCard, permission: "subscriptions:write" },
  { label: "Advertisements", href: "/admin/ads", icon: Megaphone, permission: "ads:write" },
  { label: "Content", href: "/admin/content", icon: ScrollText, permission: "content:write" },
  { label: "Support", href: "/admin/support", icon: LifeBuoy, permission: "support:handle" },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3, permission: "analytics:read" },
  { label: "Audit Logs", href: "/admin/audit", icon: ScrollText, permission: "audit:read" },
  { label: "Settings", href: "/admin/settings", icon: Settings, permission: "settings:write" },
];
