import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { env } from "@/lib/env";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Log in" };

const googleEnabled = !!env.AUTH_GOOGLE_ID && !!env.AUTH_GOOGLE_SECRET;

export default function LoginPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold">Welcome back</h1>
      <p className="mt-1 text-sm text-muted-foreground">Log in to your Career Forge account.</p>
      <div className="mt-6">
        <Suspense fallback={null}>
          <LoginForm googleEnabled={googleEnabled} />
        </Suspense>
      </div>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to Career Forge?{" "}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
