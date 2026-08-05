import { BootSplash } from "@/components/pwa/boot-splash";
import { DriveAutoBackup } from "@/components/pwa/drive-auto-backup";
import { InstallBanner } from "@/components/pwa/install-banner";
import { NoZoom } from "@/components/pwa/no-zoom";
import { PwaHead } from "@/components/pwa/pwa-head";
import { ReferralWatcher } from "@/components/pwa/referral-watcher";
import { ServiceWorkerRegistration } from "@/components/pwa/service-worker-registration";
import { SyncProvider } from "@/components/pwa/sync-provider";
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ওপেনখাতা",
  description:
    "ছোট ব্যবসার জন্য ফ্রি ও ওপেন-সোর্স বাকির খাতা — নেট ছাড়াই চলে, ডেটা হারায় না।",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon.png",
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ওপেনখাতা",
  },
};

/**
 * Zoom is off on purpose: the app is a fixed-height, single-column shell with
 * 48px tap targets, so a stray pinch only ever breaks the layout (sticky header
 * drifts, bottom দিলাম/পেলাম bar scrolls off) — it never helps readability.
 */
export const viewport: Viewport = {
  themeColor: "#0d9488",
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn">
      <head>
        <PwaHead />
      </head>
      <body className="font-sans antialiased">
        <BootSplash />
        {children}
        <InstallBanner />
        <NoZoom />
        <ServiceWorkerRegistration />
        <SyncProvider />
        <ReferralWatcher />
        <DriveAutoBackup />
      </body>
    </html>
  );
}
