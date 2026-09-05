"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Brand } from "@/components/layout/brand";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

function Verifier() {
  const token = useSearchParams().get("token") ?? "";
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setState("error");
      setMessage("Verification token is missing.");
      return;
    }
    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const json = await res.json();
        if (res.ok) setState("ok");
        else {
          setState("error");
          setMessage(json.error?.message ?? "Verification failed.");
        }
      })
      .catch(() => {
        setState("error");
        setMessage("Verification failed. Please try again.");
      });
  }, [token]);

  if (state === "loading") return <p className="text-sm text-muted-foreground">Verifying your email…</p>;

  if (state === "ok") {
    return (
      <div className="space-y-4">
        <Alert variant="success">
          <AlertTitle>Email verified</AlertTitle>
          <AlertDescription>Your account is now active.</AlertDescription>
        </Alert>
        <Button asChild className="w-full">
          <Link href="/login">Continue to log in</Link>
        </Button>
      </div>
    );
  }

  return (
    <Alert variant="destructive">
      <AlertTitle>Verification failed</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="grid min-h-screen place-items-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <Brand />
        </div>
        <h1 className="mb-4 font-display text-2xl font-semibold">Email verification</h1>
        <Suspense fallback={null}>
          <Verifier />
        </Suspense>
      </div>
    </div>
  );
}
