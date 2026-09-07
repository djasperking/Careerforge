"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createJob, updateJob } from "./actions";

const TA = "flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm";

export type JobFormValues = {
  title: string;
  company: string;
  companyLogoUrl: string;
  location: string;
  locationType: "REMOTE" | "HYBRID" | "ONSITE";
  type: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "FREELANCE" | "INTERNSHIP";
  category: string;
  salaryText: string;
  description: string;
  howToApply: string;
  applyUrl: string;
  featured: boolean;
  expiresAt: string;
};

const EMPTY: JobFormValues = {
  title: "", company: "", companyLogoUrl: "", location: "", locationType: "REMOTE",
  type: "FULL_TIME", category: "", salaryText: "", description: "", howToApply: "",
  applyUrl: "", featured: false, expiresAt: "",
};

export function JobForm({ jobId, initial }: { jobId?: string; initial?: Partial<JobFormValues> }) {
  const router = useRouter();
  const [f, setF] = useState<JobFormValues>({ ...EMPTY, ...initial });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const set = <K extends keyof JobFormValues>(k: K, v: JobFormValues[K]) => setF((s) => ({ ...s, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const payload = { ...f, expiresAt: f.expiresAt || undefined };
    const res = jobId ? await updateJob(jobId, payload) : await createJob(payload);
    setBusy(false);
    if (!res.ok) {
      setMsg({ ok: false, text: res.error });
      return;
    }
    if (jobId) {
      setMsg({ ok: true, text: "Saved." });
      router.refresh();
    } else {
      router.push(`/admin/jobs/${(res.data as { id: string }).id}`);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="title">Job title</Label>
          <Input id="title" value={f.title} onChange={(e) => set("title", e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="company">Company</Label>
          <Input id="company" value={f.company} onChange={(e) => set("company", e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="category">Category</Label>
          <Input id="category" value={f.category} onChange={(e) => set("category", e.target.value)} placeholder="e.g. Data Annotation" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="salaryText">Pay (free text)</Label>
          <Input id="salaryText" value={f.salaryText} onChange={(e) => set("salaryText", e.target.value)} placeholder="e.g. $400–$800/mo" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="location">Location</Label>
          <Input id="location" value={f.location} onChange={(e) => set("location", e.target.value)} placeholder="e.g. Lagos, Nigeria" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="locationType">Setup</Label>
            <select id="locationType" value={f.locationType} onChange={(e) => set("locationType", e.target.value as JobFormValues["locationType"])} className="h-10 w-full rounded-md border border-input bg-card px-2 text-sm">
              <option value="REMOTE">Remote</option>
              <option value="HYBRID">Hybrid</option>
              <option value="ONSITE">On-site</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="type">Type</Label>
            <select id="type" value={f.type} onChange={(e) => set("type", e.target.value as JobFormValues["type"])} className="h-10 w-full rounded-md border border-input bg-card px-2 text-sm">
              <option value="FULL_TIME">Full-time</option>
              <option value="PART_TIME">Part-time</option>
              <option value="CONTRACT">Contract</option>
              <option value="FREELANCE">Freelance</option>
              <option value="INTERNSHIP">Internship</option>
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="applyUrl">Application URL</Label>
        <Input id="applyUrl" type="url" value={f.applyUrl} onChange={(e) => set("applyUrl", e.target.value)} placeholder="https://… (your referral link is fine)" required />
      </div>

      <div className="space-y-1">
        <Label htmlFor="description">Description</Label>
        <textarea id="description" rows={8} className={TA} value={f.description} onChange={(e) => set("description", e.target.value)} required minLength={20} />
      </div>

      <div className="space-y-1">
        <Label htmlFor="howToApply">How to apply (optional)</Label>
        <textarea id="howToApply" rows={4} className={TA} value={f.howToApply} onChange={(e) => set("howToApply", e.target.value)} placeholder="Step-by-step instructions, what to put on the form, tips…" />
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={f.featured} onChange={(e) => set("featured", e.target.checked)} className="size-4" />
          Feature this job
        </label>
        <div className="space-y-1">
          <Label htmlFor="expiresAt">Expires (optional)</Label>
          <Input id="expiresAt" type="date" value={f.expiresAt} onChange={(e) => set("expiresAt", e.target.value)} />
        </div>
      </div>

      {msg ? <Alert variant={msg.ok ? "success" : "destructive"}><AlertDescription>{msg.text}</AlertDescription></Alert> : null}
      <Button type="submit" disabled={busy}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : null} {jobId ? "Save changes" : "Create job"}
      </Button>
    </form>
  );
}
