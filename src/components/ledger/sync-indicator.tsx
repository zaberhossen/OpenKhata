"use client";

import Link from "next/link";
import { Settings } from "lucide-react";
import { useSyncStatus, type SyncState } from "@/hooks/use-sync";

const DOT_CLASSES: Record<SyncState, string> = {
  disabled: "bg-border",
  signedOut: "bg-border",
  needsCloudPlan: "bg-amber-500",
  offline: "bg-text-muted",
  syncing: "animate-pulse bg-amber-500",
  pending: "bg-amber-500",
  error: "bg-gave",
  synced: "bg-got",
};

const TITLES: Record<SyncState, string> = {
  disabled: "সেটিংস",
  signedOut: "ব্যাকআপ চালু করুন",
  needsCloudPlan: "ক্লাউড ব্যাকআপ চালু রাখতে সাবস্ক্রাইব করুন",
  offline: "অফলাইন",
  syncing: "সিংক হচ্ছে…",
  pending: "ব্যাকআপ অপেক্ষমাণ",
  error: "সিংকে সমস্যা",
  synced: "ব্যাকআপ আছে",
};

/** Header button: settings link + live sync-state dot. */
export function SyncIndicator() {
  const { state } = useSyncStatus();

  return (
    <Link
      href="/app/settings"
      aria-label={TITLES[state]}
      title={TITLES[state]}
      className="relative flex min-h-tap min-w-tap items-center justify-center rounded-full hover:bg-border/50"
    >
      <Settings size={24} aria-hidden />
      {state !== "disabled" && (
        <span
          aria-hidden
          className={`absolute right-2 top-2 h-2.5 w-2.5 rounded-full ${DOT_CLASSES[state]}`}
        />
      )}
    </Link>
  );
}
