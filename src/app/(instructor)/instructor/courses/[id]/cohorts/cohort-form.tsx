"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createCohort, updateCohort } from "./actions";

const TA = "flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm";

export type CohortFormValues = {
  title: string;
  startDate: string;
  endDate: string;
  enrollByDate: string;
  capacity: string;
  priceNaira: string;
  meetingUrl: string;
  scheduleNote: string;
  minAttendancePercent: string;
};

const EMPTY: CohortFormValues = {
  title: "", startDate: "", endDate: "", enrollByDate: "",
  capacity: "0", priceNaira: "", meetingUrl: "", scheduleNote: "", minAttendancePercent: "0",
};

export function CohortForm({
  courseId,
  cohortId,
  initial,
}: {
  courseId: string;
  cohortId?: string;
  initial?: Partial<CohortFormValues>;
}) {
  const router = useRouter();
  const [f, setF] = useState<CohortFormValues>({ ...EMPTY, ...initial });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const set = (k: keyof CohortFormValues, v: string) => setF((s) => ({ ...s, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const payload = {
      title: f.title,
      startDate: f.startDate,
      endDate: f.endDate,
      enrollByDate: f.enrollByDate || undefined,
      capacity: f.capacity || "0",
      priceNaira: f.priceNaira || undefined,
      meetingUrl: f.meetingUrl || "",
      scheduleNote: f.scheduleNote || "",
      minAttendancePercent: f.minAttendancePercent || "0",
    };
    const res = cohortId ? await updateCohort(cohortId, payload) : await createCohort(courseId, payload);
    setBusy(false);
    if (!res.ok) {
      setMsg({ ok: false, text: res.error });
      return;
    }
    if (cohortId) {
      setMsg({ ok: true, text: "Saved." });
      router.refresh();
    } else {
      const created = res.data as { id: string };
      router.push(`/instructor/courses/${courseId}/cohorts/${created.id}`);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="title">Class name</Label>
        <Input id="title" value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. March 2026 evening cohort" required />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1">
          <Label htmlFor="startDate">Starts</Label>
          <Input id="startDate" type="date" value={f.startDate} onChange={(e) => set("startDate", e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="endDate">Ends</Label>
          <Input id="endDate" type="date" value={f.endDate} onChange={(e) => set("endDate", e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="enrollByDate">Enrol by (optional)</Label>
          <Input id="enrollByDate" type="date" value={f.enrollByDate} onChange={(e) => set("enrollByDate", e.target.value)} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="capacity">Capacity (0 = unlimited)</Label>
          <Input id="capacity" type="number" min={0} value={f.capacity} onChange={(e) => set("capacity", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="priceNaira">Price override (₦, blank = course price)</Label>
          <Input id="priceNaira" type="number" min={0} step="0.01" value={f.priceNaira} onChange={(e) => set("priceNaira", e.target.value)} />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="meetingUrl">Main meeting link (optional)</Label>
        <Input id="meetingUrl" type="url" placeholder="https://meet.google.com/…" value={f.meetingUrl} onChange={(e) => set("meetingUrl", e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="scheduleNote">Schedule notes (optional)</Label>
        <textarea id="scheduleNote" rows={3} className={TA} placeholder="e.g. Live sessions every Tue & Thu, 7–8pm WAT" value={f.scheduleNote} onChange={(e) => set("scheduleNote", e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="minAttendancePercent">Attendance needed for a certificate (%)</Label>
        <Input
          id="minAttendancePercent"
          type="number"
          min={0}
          max={100}
          value={f.minAttendancePercent}
          onChange={(e) => set("minAttendancePercent", e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          0 = every learner on the roster gets a certificate when the class completes. Above 0, only learners marked
          present for at least this share of live sessions are certified.
        </p>
      </div>
      {msg ? <Alert variant={msg.ok ? "success" : "destructive"}><AlertDescription>{msg.text}</AlertDescription></Alert> : null}
      <Button type="submit" disabled={busy}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : null} {cohortId ? "Save changes" : "Create class"}
      </Button>
    </form>
  );
}
