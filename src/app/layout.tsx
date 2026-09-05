import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
  title: {
    default: "Career Forge — Build Your Career. Forge Your Future.",
    template: "%s · Career Forge",
  },
  description:
    "AI-powered CV building, online courses, certification and career guidance on one platform.",
  openGraph: {
    title: "Career Forge",
    description: "Build Your Career. Forge Your Future.",
    type: "website",
    url: env.NEXT_PUBLIC_APP_URL,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
