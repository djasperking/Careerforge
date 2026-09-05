"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createCampaign } from "./actions";

export function NewCampaignControl() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [advertiser, setAdvertiser] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setLoading(true);
    setError(null);
    const res = await createCampaign({ name, advertiser });
    setLoading(false);
    if (!res.ok) setError(res.error);
    else router.push(`/admin/ads/${res.data.id}`);
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Campaign name" className="w-44" />
        <Input value={advertiser} onChange={(e) => setAdvertiser(e.target.value)} placeholder="Advertiser" className="w-36" />
        <Button onClick={handleCreate} disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          New campaign
        </Button>
      </div>
      {error ? <Alert variant="destructive" className="w-full max-w-sm"><AlertDescription>{error}</AlertDescription></Alert> : null}
    </div>
  );
}
