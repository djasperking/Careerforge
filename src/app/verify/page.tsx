import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { Brand } from "@/components/layout/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const metadata = { title: "Verify a certificate" };

async function verify(formData: FormData) {
  "use server";
  const id = String(formData.get("id") ?? "").trim().toUpperCase();
  if (id) redirect(`/verify/${encodeURIComponent(id)}`);
}

export default function VerifyIndexPage() {
  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-b from-primary/5 to-transparent p-6">
      <div className="w-full max-w-md">
        <div className="flex justify-center">
          <Brand />
        </div>
        <div className="mt-8 rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
          <div className="mb-4 grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
            <ShieldCheck className="size-6" />
          </div>
          <h1 className="font-display text-2xl font-semibold">Verify a certificate</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter the certificate ID (for example <code className="rounded bg-muted px-1">CF-7F3K9A</code>) to check that it is genuine.
          </p>
          <form action={verify} className="mt-6 space-y-3">
            <Label htmlFor="id">Certificate ID</Label>
            <Input id="id" name="id" placeholder="CF-XXXXXX" required className="h-11 font-mono" />
            <Button type="submit" className="h-11 w-full">
              Verify
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
