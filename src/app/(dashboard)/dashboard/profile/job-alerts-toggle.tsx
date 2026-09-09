"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { setJobAlerts } from "./actions";

export function JobAlertsToggle({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [pending, start] = useTransition();

  function toggle() {
    const next = !enabled;
    setEnabled(next);
    start(async () => {
      const res = await setJobAlerts(next);
      if (!res.ok) setEnabled(!next);
    });
  }

  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="font-medium">Weekly job matches</p>
        <p className="text-sm text-muted-foreground">
          Get an email when new jobs match the skills and experience in your CV. Sent at most twice a week.
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={toggle}
        disabled={pending}
        className={`relative mt-1 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
          enabled ? "bg-primary" : "bg-input"
        }`}
      >
        <span
          className={`inline-block size-4 transform rounded-full bg-white shadow transition-transform ${
            enabled ? "translate-x-6" : "translate-x-1"
          }`}
        />
        {pending ? <Loader2 className="absolute -right-6 size-4 animate-spin text-muted-foreground" /> : null}
      </button>
    </div>
  );
}
