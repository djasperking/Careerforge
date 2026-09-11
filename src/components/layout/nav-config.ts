import {
  LayoutDashboard, FileText, GraduationCap, ClipboardCheck, CreditCard, User,
  Bot, BadgeCheck, Users, BookOpen, Megaphone, LifeBuoy, BarChart3, Settings,
  ScrollText, Bell, ClipboardList, Presentation, Package, CalendarClock, ShoppingBag,
  Wallet, Banknote, Briefcase, Mail, Gift, MessageSquare, Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { PermissionKey } from "@/lib/rbac";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  permission?: PermissionKey | PermissionKey[];
  /** Section heading this item sits under (admin nav only). */
  group?: string;
}

export const customerNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "CV Builder", href: "/dashboard/cvs", icon: FileText },
  { label: "Jobs", href: "/jobs", icon: Briefcase },
  { label: "My Learning", href: "/dashboard/courses", icon: GraduationCap },
  { label: "Messages", href: "/dashboard/messages", icon: MessageSquare },
  { label: "My Purchases", href: "/dashboard/purchases", icon: ShoppingBag },
  { label: "Refer & earn", href: "/dashboard/referrals", icon: Gift },
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
  { label: "Analytics", href: "/instructor/analytics", icon: BarChart3 },
  { label: "Earnings", href: "/instructor/earnings", icon: Wallet },
  { label: "Messages", href: "/dashboard/messages", icon: MessageSquare },
  { label: "Back to dashboard", href: "/dashboard", icon: LayoutDashboard },
];

export const adminNav: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Review queue", href: "/admin/review", icon: ClipboardList, permission: ["instructors:review", "submissions:review"] },

  { group: "Learning", label: "Courses", href: "/admin/courses", icon: BookOpen, permission: "courses:read" },
  { group: "Learning", label: "Exams", href: "/admin/exams", icon: ClipboardCheck, permission: "exams:read" },
  { group: "Learning", label: "Certificates", href: "/admin/certificates", icon: BadgeCheck, permission: "courses:read" },
  { group: "Learning", label: "CV Templates", href: "/admin/cv-templates", icon: FileText, permission: "cv:templates" },
  { group: "Learning", label: "Digital products", href: "/instructor/products", icon: Package, permission: "courses:write" },
  { group: "Learning", label: "AI", href: "/admin/ai", icon: Bot, permission: "ai:config" },

  { group: "Money", label: "Payments", href: "/admin/payments", icon: CreditCard, permission: "payments:read" },
  { group: "Money", label: "Payouts", href: "/admin/payouts", icon: Banknote, permission: "payouts:manage" },
  { group: "Money", label: "Subscriptions", href: "/admin/subscriptions", icon: CreditCard, permission: "subscriptions:write" },

  { group: "Growth", label: "Analytics", href: "/admin/analytics", icon: BarChart3, permission: "analytics:read" },
  { group: "Growth", label: "Jobs board", href: "/admin/jobs", icon: Briefcase, permission: "jobs:write" },
  { group: "Growth", label: "Advertisements", href: "/admin/ads", icon: Megaphone, permission: "ads:write" },
  { group: "Growth", label: "Blog", href: "/admin/content", icon: ScrollText, permission: "content:write" },
  { group: "Growth", label: "Newsletter", href: "/admin/newsletter", icon: Mail, permission: "content:write" },

  { group: "People & system", label: "Users", href: "/admin/users", icon: Users, permission: "users:read" },
  { group: "People & system", label: "Messages", href: "/dashboard/messages", icon: MessageSquare },
  { group: "People & system", label: "Support", href: "/admin/support", icon: LifeBuoy, permission: "support:handle" },
  { group: "People & system", label: "Audit Logs", href: "/admin/audit", icon: ScrollText, permission: "audit:read" },
  { group: "People & system", label: "Settings", href: "/admin/settings", icon: Settings, permission: "settings:write" },
  { group: "People & system", label: "Maintenance mode", href: "/admin/maintenance", icon: Wrench, permission: "settings:write" },
  { group: "People & system", label: "My profile", href: "/dashboard/profile", icon: User },
];
