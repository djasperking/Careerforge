"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PasswordStrength } from "@/components/auth/password-strength";
import { GoogleButton } from "@/components/auth/google-button";

export function RegisterForm({ googleEnabled = false }: { googleEnabled?: boolean }) {
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<"verify" | "no-email" | null>(null);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        password: form.get("password"),
      }),
    });
    setLoading(false);
    const json = await res.json();
    if (!res.ok) {
      setError(json.error?.message ?? "Could not create your account.");
      return;
    }
    setDone(json.data?.emailSent === false ? "no-email" : "verify");
  }

  if (done) {
    return (
      <Alert variant="success">
        <AlertTitle>{done === "verify" ? "Check your inbox" : "Account created"}</AlertTitle>
        <AlertDescription>
          {done === "verify"
            ? "We've sent a verification link to your email. Click it to activate your account."
            : "Your account is ready. We couldn't send the verification email just now — log in and use the “Resend verification email” button on your dashboard."}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="name">Full name</Label>
        <Input id="name" name="name" autoComplete="name" required minLength={2} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="new-password"
          required
          minLength={10}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <PasswordStrength value={password} />
        <p className="text-xs text-muted-foreground">
          At least 10 characters, with upper &amp; lower case and a number.
        </p>
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Creating account…" : "Create account"}
      </Button>
      {googleEnabled ? (
        <>
          <div className="flex items-center gap-3 py-1">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <span className="h-px flex-1 bg-border" />
          </div>
          <GoogleButton label="Sign up with Google" />
        </>
      ) : null}
    </form>
  );
}
