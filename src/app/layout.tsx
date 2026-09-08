import type { Metadata } from "next";
import { Sora } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { env } from "@/lib/env";

const sora = Sora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
  title: {
    default: "Career Forge — Build Your Career. Forge Your Future.",
    template: "%s · Career Forge",
  },
  description:
    "Career Forge trains you in the skills companies hire for — data annotation, AI training and more — then gives you the certificate, AI-built CV and coaching to go land the work. Online courses, verifiable certificates, a weekly jobs feed and 1-on-1 coaching.",
  keywords: [
    "data annotation training",
    "AI training jobs",
    "online courses Nigeria",
    "CV builder",
    "verifiable certificates",
    "remote work skills",
    "career coaching",
    "Career Forge",
  ],
  applicationName: "Career Forge",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Career Forge — Build Your Career. Forge Your Future.",
    description:
      "Learn the skills companies hire for, prove them with a certificate, and get the CV and coaching to land the work.",
    type: "website",
    siteName: "Career Forge",
    url: env.NEXT_PUBLIC_APP_URL,
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Career Forge — Build Your Career. Forge Your Future.",
    description: "Learn in-demand skills, earn a certificate, and land the work.",
    images: ["/og-image.png"],
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
  verification: env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
};

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Career Forge",
  url: env.NEXT_PUBLIC_APP_URL,
  logo: `${env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/og-image.png`,
  description: "Skills training, verifiable certificates, an AI CV builder and career coaching.",
  sameAs: [
    "https://www.facebook.com/share/1D1M8nqboJ/",
    "https://www.instagram.com/careerforgeng",
    "https://x.com/careerforgeng",
  ],
};

const siteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Career Forge",
  url: env.NEXT_PUBLIC_APP_URL,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={sora.variable}>
      <body className="min-h-screen antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify([orgJsonLd, siteJsonLd]) }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
