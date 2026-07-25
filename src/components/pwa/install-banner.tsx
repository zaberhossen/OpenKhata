"use client";

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";

/**
 * Sticky "Add to Home Screen" banner.
 *
 * - Chromium/Android: captures the `beforeinstallprompt` event and offers a
 *   one-tap native install.
 * - iOS Safari (no such event): shows the manual Share → "Add to Home Screen"
 *   hint instead.
 * Hidden when already running as an installed PWA, and after the user dismisses
 * it (remembered for 14 days). Mounted once globally from the root layout.
 */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "openkhata_install_dismissed_at";
const DISMISS_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

function recentlyDismissed(): boolean {
  try {
    const at = localStorage.getItem(DISMISS_KEY);
    return at !== null && Date.now() - Number(at) < DISMISS_TTL_MS;
  } catch {
    return false;
  }
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

export function InstallBanner() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (isStandalone() || recentlyDismissed()) return;

    const ua = window.navigator.userAgent;
    const iOS = /iphone|ipad|ipod/i.test(ua);
    // iOS has no beforeinstallprompt — show the manual hint instead.
    if (iOS) {
      setIsIOS(true);
      setVisible(true);
    }

    function onBeforeInstall(e: Event) {
      e.preventDefault(); // stop the mini-infobar; we drive the UI ourselves
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    }
    function onInstalled() {
      setVisible(false);
      setDeferred(null);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  function dismiss() {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // storage unavailable — banner just reappears next load
    }
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="অ্যাপ ইনস্টল করুন"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]"
    >
      <div className="mx-auto flex max-w-md items-center gap-3">
        <Logo className="h-10 w-10 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="font-bold leading-tight">ফোনে অ্যাপ হিসেবে রাখুন</p>
          {isIOS ? (
            <p className="mt-0.5 flex items-center gap-1 text-sm text-text-muted">
              Share <Share size={14} aria-hidden /> → &quot;Add to Home
              Screen&quot;
            </p>
          ) : (
            <p className="mt-0.5 text-sm text-text-muted">
              দ্রুত খুলুন, অফলাইনেও চলবে — ইনস্টল ফ্রি।
            </p>
          )}
        </div>

        {!isIOS && (
          <button
            type="button"
            onClick={install}
            className="flex min-h-tap shrink-0 items-center justify-center gap-1.5 rounded-2xl bg-primary px-4 font-bold text-white shadow-lg hover:bg-primary-dark"
          >
            <Download size={18} aria-hidden />
            ইনস্টল
          </button>
        )}

        <button
          type="button"
          onClick={dismiss}
          aria-label="বন্ধ করুন"
          className="flex min-h-tap min-w-tap shrink-0 items-center justify-center rounded-full text-text-muted hover:bg-border/50"
        >
          <X size={20} aria-hidden />
        </button>
      </div>
    </div>
  );
}
