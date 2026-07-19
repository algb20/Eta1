import type React from "react";
import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { APP_CONFIG } from "@/lib/app-config";
import "./globals.css";

const appName = APP_CONFIG.NAME;
const appDescription = APP_CONFIG.DESCRIPTION;

export const metadata: Metadata = {
  title: `${appName} — Pi Innovation Hub`,
  description: appDescription,
  applicationName: appName,
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/apple-icon.png",
  },
  openGraph: {
    type: "website",
    title: `${appName} — Pi Innovation Hub`,
    description: appDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: `${appName} — Pi Innovation Hub`,
    description: appDescription,
  },
  generator: "Eta",
};

export const viewport: Viewport = {
  themeColor: "#0A0A0A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${GeistSans.className}`} suppressHydrationWarning>
      <head>
        {/* Pi Network SDK — required for authentication inside the Pi Browser. */}
        <script src="https://sdk.minepi.com/pi-sdk.js" async />
      </head>
      <body className="bg-background text-foreground antialiased">{children}</body>
    </html>
  );
}
