import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { env } from "@/lib/env";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Create account" };

const googleEnabled = !!env.AUTH_GOOGLE_ID && !!env.AUTH_GOOGLE_SECRET;

export default function RegisterPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold">Create your account</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Start building your career with Career Forge.
      </p>
      <div className="mt-6">
        <Suspense fallback={null}>
          <RegisterForm googleEnabled={googleEnabled} />
        </Suspense>
      </div>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
