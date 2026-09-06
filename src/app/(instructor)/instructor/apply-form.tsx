"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { applyAsInstructor } from "./actions";

export function ApplyForm({
  initial,
}: {
  initial?: { headline: string; bio: string; expertise: string[]; linkedinUrl?: string | null; portfolioUrl?: string | null };
}) {
  const router = useRouter();
  const [headline, setHeadline] = useState(initial?.headline ?? "");
  const [bio, setBio] = useState(initial?.bio ?? "");
  const [expertise, setExpertise] = useState((initial?.expertise ?? []).join(", "));
  const [linkedinUrl, setLinkedinUrl] = useState(initial?.linkedinUrl ?? "");
  const [portfolioUrl, setPortfolioUrl] = useState(initial?.portfolioUrl ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await applyAsInstructor({ headline, bio, expertise, linkedinUrl, portfolioUrl });
    setLoading(false);
    if (!res.ok) setError(res.error);
    else router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="headline">Headline</Label>
        <Input
          id="headline"
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          placeholder="e.g. Senior Data Analyst · 8 years teaching SQL"
          required
          minLength={6}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="bio">About you</Label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={6}
          required
          minLength={40}
          placeholder="Your background, what you want to teach, and why."
          className="flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="expertise">Areas of expertise</Label>
        <Input
          id="expertise"
          value={expertise}
          onChange={(e) => setExpertise(e.target.value)}
          placeholder="Comma-separated, e.g. Excel, Power BI, Data storytelling"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="linkedinUrl">LinkedIn profile</Label>
        <Input
          id="linkedinUrl"
          type="url"
          value={linkedinUrl}
          onChange={(e) => setLinkedinUrl(e.target.value)}
          placeholder="https://www.linkedin.com/in/your-name"
        />
        <p className="text-xs text-muted-foreground">Helps us verify your background. Optional but recommended.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="portfolioUrl">Portfolio or work sample</Label>
        <Input
          id="portfolioUrl"
          type="url"
          value={portfolioUrl}
          onChange={(e) => setPortfolioUrl(e.target.value)}
          placeholder="https://… (website, GitHub, a talk, a course you've made)"
        />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Submitting…" : "Submit application"}
      </Button>
    </form>
  );
}
