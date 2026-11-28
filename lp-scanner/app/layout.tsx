import type { Metadata, Viewport } from "next";
import { Fraunces, JetBrains_Mono, Sora } from "next/font/google";
import "./globals.css";
import { AiHoverBot } from "@/components/AiHoverBot";
import { Providers } from "@/components/Providers";
import { SiteHeader } from "@/components/SiteHeader";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const sans = Sora({
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
  title: "LP Scanner — Vantage CFD liquidity intelligence",
  description:
    "Scan liquidity providers by product or LP name. Knowledge base, repository, and live research for Vantage CFD desks.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#1d4ed8",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body className="font-sans antialiased">
        <Providers>
          <SiteHeader />
          <main className="mx-auto min-h-[70vh] max-w-6xl px-3 pb-28 pt-5 sm:px-6 sm:py-8">
            {children}
          </main>
          <footer className="border-t border-line/70 px-3 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-center text-[11px] uppercase tracking-[0.18em] text-mist sm:px-6">
            LP Scanner · Vantage CFD
          </footer>
          <AiHoverBot />
        </Providers>
      </body>
    </html>
  );
}
