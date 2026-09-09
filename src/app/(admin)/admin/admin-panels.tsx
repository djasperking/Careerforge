"use client";

import { useState } from "react";
import { LayoutGrid, History } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Client tab switch for the admin home: the task hub vs. the recent-activity
 * log. Both panels are server-rendered and passed in as children so no
 * non-serialisable data (icons, dates) has to cross the boundary.
 */
export function AdminPanels({ hub, recent }: { hub: React.ReactNode; recent: React.ReactNode }) {
  const [tab, setTab] = useState<"hub" | "recent">("hub");
  const Tab = ({ id, icon: Icon, label }: { id: "hub" | "recent"; icon: React.ElementType; label: string }) => (
    <button
      type="button"
      onClick={() => setTab(id)}
      className={cn(
        "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
        tab === id ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="size-4" /> {label}
    </button>
  );

  return (
    <section>
      <div className="mb-4 inline-flex rounded-lg border bg-card p-1">
        <Tab id="hub" icon={LayoutGrid} label="Jump to a task" />
        <Tab id="recent" icon={History} label="Recent activity" />
      </div>
      <div hidden={tab !== "hub"}>{hub}</div>
      <div hidden={tab !== "recent"}>{recent}</div>
    </section>
  );
}
