import { describe, expect, it } from "vitest";
import { hasPermission, isAdminRole, ROLE_PERMISSIONS, ROLES } from "@/lib/rbac";

describe("rbac", () => {
  it("super admin has every permission", () => {
    expect(ROLE_PERMISSIONS.SUPER_ADMIN).toBe("*");
    expect(hasPermission("*", "settings:write")).toBe(true);
  });

  it("customer has no admin permissions", () => {
    expect(ROLE_PERMISSIONS.CUSTOMER).toHaveLength(0);
    expect(hasPermission([], "users:read")).toBe(false);
  });

  it("finance manager can refund but not publish courses", () => {
    const perms = ROLE_PERMISSIONS.FINANCE_MANAGER as string[];
    expect(perms).toContain("payments:refund");
    expect(perms).not.toContain("courses:publish");
  });

  it("identifies admin roles", () => {
    expect(isAdminRole([ROLES.ADMIN])).toBe(true);
    expect(isAdminRole([ROLES.INSTRUCTOR])).toBe(false);
    expect(isAdminRole([ROLES.CUSTOMER])).toBe(false);
  });
});
