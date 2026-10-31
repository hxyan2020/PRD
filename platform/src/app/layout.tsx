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
  title: "Vantage CRMP Admin",
  description: "Centralised Risk Management Platform — Admin Control Plane",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/vantage-markets-logo.png", type: "image/png", sizes: "447x447" },
    ],
    shortcut: "/favicon.ico",
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
