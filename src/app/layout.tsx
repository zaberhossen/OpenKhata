import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ServiceWorkerRegistration } from "@/components/pwa/service-worker-registration";
import { SyncProvider } from "@/components/pwa/sync-provider";
import { ReferralWatcher } from "@/components/pwa/referral-watcher";

export const metadata: Metadata = {
  title: "ওপেনখাতা",
  description:
    "ছোট ব্যবসার জন্য ফ্রি ও ওপেন-সোর্স বাকির খাতা — নেট ছাড়াই চলে, ডেটা হারায় না।",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ওপেনখাতা",
  },
};

export const viewport: Viewport = {
  themeColor: "#0d9488",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn">
      <body className="font-sans antialiased">
        {children}
        <ServiceWorkerRegistration />
        <SyncProvider />
        <ReferralWatcher />
      </body>
    </html>
  );
}
