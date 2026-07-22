"use client";

import Link from "next/link";
import { useSyncStatus, type SyncState } from "@/hooks/use-sync";

const DOT_CLASSES: Record<SyncState, string> = {
  disabled: "bg-border",
  signedOut: "bg-border",
  offline: "bg-text-muted",
  syncing: "animate-pulse bg-amber-500",
  pending: "bg-amber-500",
  error: "bg-gave",
  synced: "bg-got",
};

const TITLES: Record<SyncState, string> = {
  disabled: "সেটিংস",
  signedOut: "ব্যাকআপ চালু করুন",
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
      className="relative flex min-h-tap min-w-tap items-center justify-center rounded-full text-2xl hover:bg-border/50"
    >
      ⚙️
      {state !== "disabled" && (
        <span
          aria-hidden
          className={`absolute right-2 top-2 h-2.5 w-2.5 rounded-full ${DOT_CLASSES[state]}`}
        />
      )}
    </Link>
  );
}
