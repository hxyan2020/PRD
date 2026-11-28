import type { Metadata, Viewport } from "next";
import { Fraunces, IBM_Plex_Mono, Sora } from "next/font/google";
import "./globals.css";
import { MobileBottomNav } from "@/components/MobileBottomNav";
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
  title: "V Exchange Knowledge Base",
  description:
    "V Exchange Knowledge Base: perpetual risk (Funding / Mark / Index) and CFD Broker Pricing (LP→PE→MT, 86 risks).",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#0c1520",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body className="font-sans antialiased">
        <Providers>
          <SiteHeader />
          <main className="mx-auto min-h-[70vh] max-w-6xl px-3 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-3 sm:px-6 sm:pb-16 sm:pt-8">
            {children}
          </main>
          <footer className="mb-12 border-t border-line/70 px-3 py-4 text-center text-[11px] leading-relaxed text-mist sm:mb-0 sm:px-6 sm:py-5 sm:text-xs">
            V Exchange Knowledge Base · CFD Pricing · Broker loss ≠ client abuse
          </footer>
          <MobileBottomNav />
        </Providers>
      </body>
    </html>
  );
}
