"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createSupportTicket } from "./actions";

export function NewTicketForm() {
  const router = useRouter();
  const [category, setCategory] = useState("ACCOUNT");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    const res = await createSupportTicket({ category, subject, message });
    setLoading(false);
    if (!res.ok) setError(res.error);
    else router.push(`/dashboard/support/${res.data.id}`);
  }

  return (
    <div className="space-y-4">
      {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Category</Label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-10 w-full rounded-md border border-input bg-card px-2 text-sm">
            <option value="PAYMENT">Payment</option>
            <option value="COURSE">Course</option>
            <option value="ACCOUNT">Account</option>
            <option value="CV">CV</option>
            <option value="TECHNICAL">Technical</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label>Subject</Label>
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Brief summary" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Message</Label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          placeholder="Describe the issue in detail…"
          className="flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm"
        />
      </div>
      <Button onClick={handleSubmit} disabled={loading}>
        {loading ? <Loader2 className="size-4 animate-spin" /> : null}
        Submit ticket
      </Button>
    </div>
  );
}
