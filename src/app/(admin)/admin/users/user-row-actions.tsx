"use client";

import { useState, useTransition } from "react";
import { MailCheck, Trash2, Loader2 } from "lucide-react";
import { setUserStatus, resendVerificationEmail, deleteUserAccount, setUserRole } from "./actions";
import { Button } from "@/components/ui/button";
import { ROLE_NAMES, ADMIN_ROLES, type RoleKey } from "@/lib/rbac";

export function UserRowActions({
  userId,
  status,
  emailVerified,
  canManage,
  canDelete,
  canAssignRoles,
  isSuperAdmin,
  currentStaffRole,
}: {
  userId: string;
  status: string;
  emailVerified: boolean;
  canManage: boolean;
  canDelete: boolean;
  canAssignRoles: boolean;
  /** Whether the acting admin is a Super Admin — only they can grant/edit Super Admin. */
  isSuperAdmin: boolean;
  /** This user's current staff role, if any. */
  currentStaffRole: RoleKey | null;
}) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  if (!canManage && !canDelete && !canAssignRoles) return null;

  function run(fn: () => Promise<{ ok: boolean; error?: string }>, okText: string) {
    setMsg(null);
    start(async () => {
      const res = await fn();
      setMsg(res.ok ? { ok: true, text: okText } : { ok: false, text: res.error ?? "Action failed" });
    });
  }

  const roleOptions = ADMIN_ROLES.filter((r) => r !== "SUPER_ADMIN" || isSuperAdmin);
  const canEditThisRole = currentStaffRole !== "SUPER_ADMIN" || isSuperAdmin;

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center justify-end gap-2">
        {canAssignRoles && canEditThisRole ? (
          <select
            defaultValue={currentStaffRole ?? ""}
            disabled={pending}
            onChange={(e) => {
              const value = (e.target.value || null) as RoleKey | null;
              run(() => setUserRole(userId, value), value ? `Now ${ROLE_NAMES[value]}.` : "Staff role removed.");
            }}
            className="h-8 rounded-md border border-input bg-card px-2 text-xs"
          >
            <option value="">No staff role</option>
            {roleOptions.map((r) => (
              <option key={r} value={r}>{ROLE_NAMES[r]}</option>
            ))}
          </select>
        ) : null}

        {canManage && !emailVerified && status !== "DELETED" ? (
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => run(() => resendVerificationEmail(userId), "Verification email sent.")}
          >
            <MailCheck className="size-3.5" /> Verify email
          </Button>
        ) : null}

        {canManage && status !== "DELETED" ? (
          status === "SUSPENDED" || status === "BANNED" ? (
            <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => setUserStatus(userId, "ACTIVE"), "Restored.")}>
              Restore
            </Button>
          ) : (
            <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => setUserStatus(userId, "SUSPENDED"), "Suspended.")}>
              Suspend
            </Button>
          )
        ) : null}

        {canDelete && status !== "DELETED" ? (
          <Button
            size="sm"
            variant="outline"
            className="text-destructive hover:text-destructive"
            disabled={pending}
            onClick={() => {
              if (!confirm("Delete this account? Personal data is scrubbed and the account is hidden. This can't be undone.")) return;
              run(() => deleteUserAccount(userId), "Account deleted.");
            }}
          >
            {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />} Delete
          </Button>
        ) : null}
      </div>
      {msg ? (
        <span className={`text-xs ${msg.ok ? "text-success" : "text-destructive"}`}>{msg.text}</span>
      ) : null}
    </div>
  );
}
