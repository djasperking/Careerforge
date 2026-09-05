import { redirect } from "next/navigation";
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
    <div className="grid min-h-screen place-items-center p-6">
      <div className="w-full max-w-md">
        <Brand />
        <h1 className="mt-8 font-display text-2xl font-semibold">Verify a certificate</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter the certificate ID (for example <code>CF-7F3K9A</code>) to check its authenticity.
        </p>
        <form action={verify} className="mt-6 space-y-3">
          <Label htmlFor="id">Certificate ID</Label>
          <Input id="id" name="id" placeholder="CF-XXXXXX" required />
          <Button type="submit" className="w-full">Verify</Button>
        </form>
      </div>
    </div>
  );
}
