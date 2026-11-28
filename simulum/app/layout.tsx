import type { Metadata, Viewport } from "next";
import { Chakra_Petch, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { I18nProvider } from "@/lib/i18n/context";
import { isLocale } from "@/lib/i18n/locales";
import { FooterNote } from "@/components/FooterNote";
import type { LocaleCode } from "@/lib/types";

const display = Chakra_Petch({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const sans = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Are We Simulated? — Worldwide simulation evidence catalogue",
  description:
    "Are We Simulated? catalogues unique evidence people have posted worldwide that our universe is simulated — scanned, deduplicated, and sorted by category.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png" },
      { url: "/logo.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    shortcut: ["/favicon.ico"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#0a0e13",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jar = await cookies();
  const raw = jar.get("simulum-locale")?.value;
  const initialLocale: LocaleCode | undefined =
    raw && isLocale(raw) ? raw : undefined;

  return (
    <html
      lang={initialLocale || "en"}
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
    >
      <body className="font-sans antialiased">
        <I18nProvider initialLocale={initialLocale}>
          <div className="pointer-events-none fixed inset-0 starfield" aria-hidden />
          <div className="pointer-events-none fixed inset-0 grid-veil" aria-hidden />
          <div
            className="pointer-events-none fixed inset-0 mech-hatch animate-hatch-drift opacity-60"
            aria-hidden
          />
          <SiteHeader />
          <main className="relative mx-auto min-h-[70vh] max-w-6xl px-4 pb-[max(5rem,calc(env(safe-area-inset-bottom)+3.5rem))] pt-3 sm:px-6 sm:pt-6">
            {children}
          </main>
          <FooterNote />
        </I18nProvider>
      </body>
    </html>
  );
}
