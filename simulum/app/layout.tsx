import type { Metadata, Viewport } from "next";
import { Fraunces, JetBrains_Mono, Outfit } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const sans = Outfit({
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
  title: "SIMULUM — Worldwide simulation evidence catalogue",
  description:
    "A living catalogue of unique evidence people have posted worldwide that our universe is simulated — scanned, deduplicated, and sorted by category.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#0d9488",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body className="font-sans antialiased">
        <div className="pointer-events-none fixed inset-0 starfield" aria-hidden />
        <div className="pointer-events-none fixed inset-0 grid-veil opacity-70" aria-hidden />
        <SiteHeader />
        <main className="relative mx-auto min-h-[70vh] max-w-6xl px-4 pb-24 pt-4 sm:px-6 sm:pt-6">
          {children}
        </main>
        <footer className="relative border-t border-line/70 px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-center text-xs text-mist sm:px-6">
          SIMULUM catalogues publicly discussed claims. Inclusion is not endorsement of truth.
        </footer>
      </body>
    </html>
  );
}
