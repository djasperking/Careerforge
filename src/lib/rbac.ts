/**
 * Role-based access control.
 *
 * Roles and permissions are stored in the database (Role, Permission,
 * RolePermission, UserRole) so admins can reconfigure them. These constants are
 * the canonical seed set and the keys the code checks against.
 */

export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  COURSE_MANAGER: "COURSE_MANAGER",
  FINANCE_MANAGER: "FINANCE_MANAGER",
  SUPPORT_MANAGER: "SUPPORT_MANAGER",
  CONTENT_MANAGER: "CONTENT_MANAGER",
  INSTRUCTOR: "INSTRUCTOR",
  CUSTOMER: "CUSTOMER",
} as const;

export type RoleKey = (typeof ROLES)[keyof typeof ROLES];

export const PERMISSIONS = {
  // users
  "users:read": "View users",
  "users:write": "Create / edit users",
  "users:suspend": "Suspend / ban / restore users",
  "users:delete": "Delete users",
  "users:roles": "Change roles & permissions",
  // courses
  "courses:read": "View all courses (incl. drafts)",
  "courses:write": "Create / edit courses",
  "courses:publish": "Publish / unpublish courses",
  "courses:delete": "Delete courses",
  "instructors:review": "Approve instructors & course submissions",
  // exams
  "exams:read": "View exams & attempts",
  "exams:write": "Create / edit exams & questions",
  "exams:grade": "Manually grade attempts",
  "exams:security": "Review exam security events",
  // cv
  "cv:templates": "Manage CV templates",
  // tools
  "tools:unlimited": "Unlimited AI usage & premium CV exports, no paywall",
  // payments
  "payments:read": "View transactions & payouts",
  "payments:refund": "Issue refunds",
  "payouts:manage": "Approve & mark instructor payouts paid",
  "subscriptions:write": "Manage subscription plans",
  // ai
  "ai:config": "Configure AI providers, models, limits",
  "ai:prompts": "Manage & version AI prompts",
  // ads
  "ads:write": "Manage advertising campaigns",
  // content
  "content:write": "Manage CMS content & blog",
  "jobs:write": "Manage the jobs board",
  // support
  "support:handle": "View & respond to support tickets",
  // analytics / audit / settings
  "analytics:read": "View analytics & reports",
  "audit:read": "View audit logs",
  "settings:write": "Change system settings",
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;

/** Default role -> permission mapping used by the seed. */
export const ROLE_PERMISSIONS: Record<RoleKey, PermissionKey[] | "*"> = {
  SUPER_ADMIN: "*",
  ADMIN: [
    "users:read", "users:write", "users:suspend", "users:roles",
    "courses:read", "courses:write", "courses:publish", "courses:delete", "instructors:review",
    "exams:read", "exams:write", "exams:grade", "exams:security",
    "cv:templates", "payments:read", "payouts:manage", "subscriptions:write",
    "ai:config", "ai:prompts", "ads:write", "content:write", "jobs:write",
    "support:handle", "analytics:read", "audit:read", "settings:write",
    "tools:unlimited",
  ],
  COURSE_MANAGER: [
    "courses:read", "courses:write", "courses:publish", "courses:delete", "instructors:review",
    "exams:read", "exams:write", "exams:grade", "analytics:read",
    "tools:unlimited",
  ],
  FINANCE_MANAGER: ["payments:read", "payments:refund", "payouts:manage", "subscriptions:write", "analytics:read", "tools:unlimited"],
  SUPPORT_MANAGER: ["support:handle", "users:read", "analytics:read", "tools:unlimited"],
  CONTENT_MANAGER: ["content:write", "jobs:write", "ads:write", "cv:templates", "tools:unlimited"],
  INSTRUCTOR: ["courses:read", "courses:write", "exams:write"],
  CUSTOMER: [],
};

export const ADMIN_ROLES: RoleKey[] = [
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.COURSE_MANAGER,
  ROLES.FINANCE_MANAGER,
  ROLES.SUPPORT_MANAGER,
  ROLES.CONTENT_MANAGER,
];

export function isAdminRole(roles: string[]) {
  return roles.some((r) => (ADMIN_ROLES as string[]).includes(r));
}

export function hasPermission(
  userPermissions: string[] | "*" | undefined,
  required: PermissionKey,
) {
  if (!userPermissions) return false;
  if (userPermissions === "*") return true;
  return userPermissions.includes(required);
}
