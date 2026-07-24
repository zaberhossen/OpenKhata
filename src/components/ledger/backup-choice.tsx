"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  CloudUpload,
  HardDriveDownload,
  Cloud,
  Check,
  RefreshCw,
} from "lucide-react";
import { getBackupChoice, setBackupChoice } from "@/lib/backup-choice";
import { startCloudTrial, isCloudActive } from "@/lib/entitlement";
import { clearCloudCache, syncNow } from "@/lib/sync";
import { useEntitlement } from "@/hooks/use-entitlement";
import { useSyncStatus } from "@/hooks/use-sync";
import { DriveBackup } from "@/components/ledger/drive-backup";

const CLOUD_STATE_LABELS: Record<string, string> = {
  needsCloudPlan: "ট্রায়াল শেষ — ক্লাউড ব্যাকআপ চালু রাখতে সাবস্ক্রাইব করুন",
  offline: "অফলাইন — নেট ফিরলে সিংক হবে",
  syncing: "সিংক হচ্ছে…",
  pending: "কিছু পরিবর্তন ব্যাকআপের অপেক্ষায়",
  error: "সিংকে সমস্যা হয়েছে — আবার চেষ্টা করুন",
  synced: "সব ডেটা ক্লাউডে ব্যাকআপ হয়ে আছে",
};

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("bn-BD", { dateStyle: "medium" }).format(
    new Date(iso),
  );
}

function daysLeft(iso: string): number {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

/**
 * The signed-in user's backup-destination chooser. Exactly one engine runs per
 * device (see the guards in sync.ts / drive-auto.ts):
 *   - "নিজের Google Drive" — free, user-owned (delegates to <DriveBackup/>).
 *   - "ওপেনখাতা ক্লাউড" — paid Supabase sync, starts with a 14-day free trial.
 * Only rendered when signed in; must be mounted inside the user branch.
 */
export function BackupChoice() {
  const choice = useLiveQuery(() => getBackupChoice(), []);
  const { entitlement, refresh } = useEntitlement();
  const status = useSyncStatus();
  const [busy, setBusy] = useState<null | string>(null);
  const [error, setError] = useState<string | null>(null);

  if (choice === undefined) return null; // still loading

  async function pickDrive() {
    await setBackupChoice("drive");
  }

  async function pickCloud() {
    if (busy) return;
    setBusy("trial");
    setError(null);
    try {
      const e = await startCloudTrial();
      if (!e) {
        setError("ক্লাউড ব্যাকআপ চালু করা গেল না। আবার চেষ্টা করুন।");
        return;
      }
      await setBackupChoice("cloud");
      clearCloudCache();
      refresh();
      void syncNow();
    } finally {
      setBusy(null);
    }
  }

  async function changeMethod() {
    await setBackupChoice("none");
    setError(null);
  }

  async function backupNow() {
    if (busy) return;
    setBusy("backup");
    await syncNow();
    setBusy(null);
  }

  // ── Chooser ───────────────────────────────────────────────────────────
  if (choice === "none") {
    return (
      <section className="rounded-2xl border border-border bg-surface p-4">
        <h2 className="text-sm text-text-muted">ব্যাকআপ পদ্ধতি বেছে নিন</h2>
        <p className="mt-1 text-sm text-text-muted">
          ফোন হারালেও যেন খাতা না হারায় — একটি ব্যাকআপ পদ্ধতি বেছে নিন।
        </p>

        <button
          type="button"
          onClick={pickDrive}
          className="mt-3 flex w-full items-start gap-3 rounded-2xl border border-border p-4 text-left hover:bg-background"
        >
          <HardDriveDownload
            size={22}
            className="mt-0.5 shrink-0 text-primary"
            aria-hidden
          />
          <span>
            <span className="block font-bold">নিজের Google Drive</span>
            <span className="mt-0.5 block text-sm text-text-muted">
              আপনার নিজের ড্রাইভে ব্যাকআপ — সম্পূর্ণ ফ্রি, ডেটা আপনারই থাকে।
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={pickCloud}
          disabled={busy !== null}
          className="mt-3 flex w-full items-start gap-3 rounded-2xl border border-primary bg-primary-light p-4 text-left hover:bg-primary-light/70 disabled:opacity-40"
        >
          <Cloud
            size={22}
            className="mt-0.5 shrink-0 text-primary"
            aria-hidden
          />
          <span>
            <span className="block font-bold text-primary-dark">
              ওপেনখাতা ক্লাউড {busy === "trial" && "…"}
            </span>
            <span className="mt-0.5 block text-sm text-text-muted">
              আমাদের সার্ভারে নিরাপদ ব্যাকআপ ও একাধিক ফোনে সিংক — ১৪ দিন ফ্রি
              ট্রায়াল, পরে অল্প সার্ভিস চার্জ।
            </span>
          </span>
        </button>

        {error && (
          <p className="mt-3 rounded-2xl bg-gave-light px-4 py-3 text-sm text-gave">
            {error}
          </p>
        )}
      </section>
    );
  }

  // ── Drive chosen ──────────────────────────────────────────────────────
  if (choice === "drive") {
    return (
      <>
        <DriveBackup />
        <button
          type="button"
          onClick={changeMethod}
          className="flex min-h-tap items-center justify-center gap-1.5 text-sm text-text-muted underline underline-offset-2"
        >
          <RefreshCw size={15} aria-hidden />
          ব্যাকআপ পদ্ধতি বদলান
        </button>
      </>
    );
  }

  // ── Cloud chosen ──────────────────────────────────────────────────────
  const trialing =
    entitlement?.status === "trialing" && isCloudActive(entitlement);
  const active = entitlement?.status === "active";

  return (
    <section className="rounded-2xl border border-border bg-surface p-4">
      <h2 className="flex items-center gap-1.5 text-sm text-text-muted">
        <Cloud size={15} aria-hidden />
        ওপেনখাতা ক্লাউড ব্যাকআপ
      </h2>

      <p className="mt-1 font-semibold">
        {CLOUD_STATE_LABELS[status.state] ?? "ক্লাউড ব্যাকআপ"}
      </p>

      {trialing && entitlement?.trial_ends_at && (
        <p className="mt-1 text-sm text-text-muted">
          ফ্রি ট্রায়াল — আর {daysLeft(entitlement.trial_ends_at)} দিন বাকি (
          {formatDate(entitlement.trial_ends_at)} পর্যন্ত)।
        </p>
      )}
      {active && entitlement?.current_period_end && (
        <p className="mt-1 flex items-center gap-1 text-sm text-got">
          <Check size={15} aria-hidden />
          সাবস্ক্রিপশন চালু — {formatDate(entitlement.current_period_end)}{" "}
          পর্যন্ত।
        </p>
      )}
      {status.pendingCount > 0 && (
        <p className="mt-1 text-sm text-text-muted">
          অপেক্ষমাণ পরিবর্তন: {status.pendingCount}টি
        </p>
      )}
      {status.lastSyncAt && (
        <p className="mt-1 text-sm text-text-muted">
          শেষ ব্যাকআপ: {formatDate(status.lastSyncAt)}
        </p>
      )}

      {status.state === "needsCloudPlan" ? (
        <p className="mt-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          ট্রায়াল শেষ হয়ে গেছে। সাবস্ক্রিপশন শীঘ্রই আসছে — ততক্ষণ আপনার সব
          ডেটা এই ফোনে নিরাপদ আছে। চাইলে ফ্রি Google Drive ব্যাকআপে বদলে নিতে
          পারেন।
        </p>
      ) : (
        <button
          type="button"
          onClick={backupNow}
          disabled={busy !== null || status.state === "offline"}
          className="mt-3 flex min-h-tap w-full items-center justify-center gap-2 rounded-2xl bg-primary font-bold text-white shadow-lg hover:bg-primary-dark disabled:opacity-40"
        >
          <CloudUpload size={18} aria-hidden />
          {busy === "backup" || status.state === "syncing"
            ? "ব্যাকআপ হচ্ছে…"
            : "এখনই ব্যাকআপ করুন"}
        </button>
      )}

      <button
        type="button"
        onClick={changeMethod}
        className="mt-3 flex min-h-tap w-full items-center justify-center gap-1.5 text-sm text-text-muted underline underline-offset-2"
      >
        <RefreshCw size={15} aria-hidden />
        ব্যাকআপ পদ্ধতি বদলান
      </button>
    </section>
  );
}
