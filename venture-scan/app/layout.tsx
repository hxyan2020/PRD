import type { Metadata, Viewport } from "next";
import { DM_Sans, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { withBase } from "@/lib/base-path";

const display = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});

const sans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "VentureScan — worldwide startup ideas & fundraising",
  description:
    "Scan worldwide startup ideas and fundraising events. Browse idea name, model, team, industry, funding, website, socials, and go-forward plays.",
  icons: {
    icon: [
      { url: withBase("/favicon.ico"), sizes: "16x16 32x32" },
      { url: withBase("/favicon-16.png"), type: "image/png", sizes: "16x16" },
      { url: withBase("/favicon.png"), type: "image/png", sizes: "32x32" },
      { url: withBase("/logo-192.png"), type: "image/png", sizes: "192x192" },
      { url: withBase("/logo-512.png"), type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: withBase("/apple-touch-icon.png"), sizes: "180x180" }],
    shortcut: [{ url: withBase("/favicon.png"), type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#e4b72c",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body className="font-sans antialiased">
        <Providers>
          <div className="grain" aria-hidden />
          <SiteHeader />
          <main className="relative z-10 min-w-0">{children}</main>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
