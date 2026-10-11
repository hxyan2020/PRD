import type { Metadata, Viewport } from "next";
import { Source_Sans_3, Fraunces } from "next/font/google";
import "./globals.css";

const sourceSans = Source_Sans_3({
  variable: "--font-source",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vantage CRMP Plus",
  description: "Upgraded Centralised Risk Management Platform — original CRMP plus 24/7 CS/TR",
  icons: {
    icon: "/vantage-markets-logo.png",
    apple: "/vantage-markets-logo.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#10233a",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${sourceSans.variable} ${fraunces.variable} antialiased`}>{children}</body>
    </html>
  );
}
