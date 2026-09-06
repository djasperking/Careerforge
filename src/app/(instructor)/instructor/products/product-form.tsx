"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ImageField } from "@/components/ui/image-field";
import { FileField } from "@/components/ui/file-field";
import { formatCurrency, minorToMajor, majorToMinor } from "@/lib/utils";
import { createMyProduct, updateMyProduct } from "./actions";

export interface ProductFormValues {
  title: string;
  description: string;
  coverImageUrl: string;
  fileUrl: string;
  fileName: string;
  fileSizeBytes: number;
  priceCents: number;
  currency: string;
  discountPercent: number;
  discountEndsAt: string;
}

const EMPTY: ProductFormValues = {
  title: "",
  description: "",
  coverImageUrl: "",
  fileUrl: "",
  fileName: "",
  fileSizeBytes: 0,
  priceCents: 0,
  currency: "NGN",
  discountPercent: 0,
  discountEndsAt: "",
};

export function ProductForm({
  productId,
  initial,
  locked = false,
}: {
  productId?: string;
  initial?: ProductFormValues;
  locked?: boolean;
}) {
  const router = useRouter();
  const [form, setForm] = useState<ProductFormValues>(initial ?? EMPTY);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  function set<K extends keyof ProductFormValues>(k: K, v: ProductFormValues[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const res = productId ? await updateMyProduct(productId, form) : await createMyProduct(form);
    setSaving(false);
    if (!res.ok) {
      setMsg({ type: "error", text: res.error });
      return;
    }
    if (productId) {
      setMsg({ type: "ok", text: "Saved." });
      router.refresh();
    } else {
      router.push(`/instructor/products/${(res.data as { id: string }).id}`);
    }
  }

  const discounted =
    form.discountPercent > 0 ? Math.round(form.priceCents * (1 - form.discountPercent / 100)) : form.priceCents;

  return (
    <form onSubmit={submit} className="space-y-4">
      {msg ? (
        <Alert variant={msg.type === "ok" ? "success" : "destructive"}>
          <AlertDescription>{msg.text}</AlertDescription>
        </Alert>
      ) : null}

      <fieldset disabled={locked} className="space-y-4 disabled:opacity-60">
        <div className="space-y-1.5">
          <Label>Title</Label>
          <Input value={form.title} onChange={(e) => set("title", e.target.value)} required minLength={3} />
        </div>
        <div className="space-y-1.5">
          <Label>Description</Label>
          <textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            rows={4}
            required
            minLength={20}
            className="flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label>Cover image</Label>
          <ImageField value={form.coverImageUrl} onChange={(v) => set("coverImageUrl", v)} kind="course-thumbnail" disabled={locked} />
        </div>

        <div className="space-y-1.5">
          <Label>Product file (PDF, ZIP or EPUB)</Label>
          <FileField
            value={form.fileUrl}
            fileName={form.fileName}
            disabled={locked}
            onChange={({ url, name, size }) => setForm((f) => ({ ...f, fileUrl: url, fileName: name, fileSizeBytes: size }))}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Price (₦)</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={minorToMajor(form.priceCents)}
              onChange={(e) => set("priceCents", majorToMinor(e.target.value as unknown as number))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Currency</Label>
            <Input value={form.currency} maxLength={3} onChange={(e) => set("currency", e.target.value.toUpperCase())} />
          </div>
        </div>

        <div className="rounded-md border p-3">
          <p className="text-sm font-medium">Discount (optional)</p>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Percent off (0–90)</Label>
              <Input
                type="number"
                min={0}
                max={90}
                value={form.discountPercent}
                onChange={(e) => set("discountPercent", Math.max(0, Math.min(90, Number(e.target.value))))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Ends on (optional)</Label>
              <Input type="date" value={form.discountEndsAt} onChange={(e) => set("discountEndsAt", e.target.value)} />
            </div>
          </div>
          {form.discountPercent > 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Buyers pay <span className="font-medium text-foreground">{formatCurrency(discounted, form.currency)}</span> instead of{" "}
              {formatCurrency(form.priceCents, form.currency)}. Subject to admin review.
            </p>
          ) : null}
        </div>
      </fieldset>

      <Button type="submit" disabled={saving || locked}>
        {saving ? <Loader2 className="size-4 animate-spin" /> : null}
        {productId ? "Save product" : "Create product"}
      </Button>
    </form>
  );
}
