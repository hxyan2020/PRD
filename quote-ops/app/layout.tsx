import type { Metadata, Viewport } from "next";
import { Fraunces, IBM_Plex_Mono, Sora } from "next/font/google";
import "./globals.css";
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

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "QuoteOps — CFD Broker Pricing Squad KB",
  description:
    "Interactive RAG knowledge base and skill library for CFD broker pricing ops: LP→PE→MT, 86 risk scenarios, RCA playbooks.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0c1520",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body className="font-sans antialiased">
        <Providers>
          <SiteHeader />
          <main className="mx-auto min-h-[70vh] max-w-6xl px-3 pb-24 pt-5 sm:px-6 sm:py-8">
            {children}
          </main>
          <footer className="border-t border-line/70 px-3 py-5 text-center text-xs text-mist sm:px-6">
            QuoteOps · CFD Broker Pricing Squad · Broker loss ≠ client abuse
          </footer>
        </Providers>
      </body>
    </html>
  );
}
