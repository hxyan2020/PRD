import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Newsreader, Noto_Sans_SC, Noto_Serif_SC } from "next/font/google";
import { DeskAccountProvider } from "@/components/DeskAccountProvider";
import { SiteShell } from "@/components/SiteShell";
import { countNews } from "@/lib/filters";
import { LocaleProvider } from "@/lib/i18n/LocaleProvider";
import { loadBriefing } from "@/lib/loadData";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const notoSans = Noto_Sans_SC({
  variable: "--font-noto-sans-sc",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const notoSerif = Noto_Serif_SC({
  variable: "--font-noto-serif-sc",
  subsets: ["latin"],
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: "Vantage Market Intelligence",
  description:
    "Daily briefing on top global banks, brokers, and crypto exchanges: listings, product releases, regulation, and risk tools. English and Chinese.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const briefing = await loadBriefing();
  const items = briefing?.items ?? [];
  const navCounts = {
    all: countNews(items),
    listing: countNews(items, "listing"),
    product: countNews(items, "product"),
    regulation: countNews(items, "regulation"),
    risk_tools: countNews(items, "risk_tools"),
  };

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${newsreader.variable} ${notoSans.variable} ${notoSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <LocaleProvider>
          <DeskAccountProvider>
            <SiteShell navCounts={navCounts}>{children}</SiteShell>
          </DeskAccountProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
