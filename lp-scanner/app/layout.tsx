import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Manrope, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { AiHoverBot } from "@/components/AiHoverBot";
import { Providers } from "@/components/Providers";
import { SiteHeader } from "@/components/SiteHeader";

const display = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const sans = Manrope({
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
  title: "LP Scanner — Vantage CFD liquidity intelligence",
  description:
    "Scan liquidity providers by product or LP name. Knowledge base, repository, and live research for Vantage CFD desks.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f766e",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body className="font-sans antialiased">
        <Providers>
          <SiteHeader />
          <main className="mx-auto min-h-[70vh] max-w-6xl px-4 py-8 sm:px-6">{children}</main>
          <footer className="border-t border-line/70 py-6 text-center text-xs text-mist">
            LP Scanner · Vantage CFD
          </footer>
          <AiHoverBot />
        </Providers>
      </body>
    </html>
  );
}
