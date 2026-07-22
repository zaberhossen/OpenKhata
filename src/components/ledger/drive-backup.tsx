"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { CloudUpload, CloudDownload, HardDriveDownload } from "lucide-react";
import { db } from "@/lib/db";
import { exportBackup, importBackup } from "@/lib/backup";
import {
  downloadBackup,
  getAccessToken,
  isDriveConfigured,
  uploadBackup,
} from "@/lib/gdrive";

const LAST_BACKUP_KEY = "last_drive_backup_at";

function formatTimestamp(iso: string): string {
  return new Intl.DateTimeFormat("bn-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

/**
 * Google Drive backup controls (Growth phase). Hidden entirely when no client
 * ID is configured — same pattern as cloud sync.
 */
export function DriveBackup() {
  const [busy, setBusy] = useState<null | "backup" | "restore">(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lastBackupAt = useLiveQuery(
    async () => (await db.meta.get(LAST_BACKUP_KEY))?.value ?? null,
    [],
    null,
  );

  if (!isDriveConfigured()) return null;

  async function backup() {
    if (busy) return;
    setBusy("backup");
    setMessage(null);
    setError(null);
    try {
      const token = await getAccessToken();
      await uploadBackup(token, await exportBackup());
      await db.meta.put({
        key: LAST_BACKUP_KEY,
        value: new Date().toISOString(),
      });
      setMessage("Google Drive-এ ব্যাকআপ সম্পন্ন হয়েছে।");
    } catch (e) {
      setError(e instanceof Error ? e.message : "ব্যাকআপ ব্যর্থ হয়েছে।");
    } finally {
      setBusy(null);
    }
  }

  async function restore() {
    if (busy) return;
    if (
      !window.confirm(
        "Drive থেকে রিস্টোর করবেন? আপনার বর্তমান ডেটার সাথে মিলিয়ে নেওয়া হবে (নতুন তথ্য মুছবে না)।",
      )
    ) {
      return;
    }
    setBusy("restore");
    setMessage(null);
    setError(null);
    try {
      const token = await getAccessToken();
      const json = await downloadBackup(token);
      if (!json) {
        setError("Drive-এ কোনো ব্যাকআপ পাওয়া যায়নি।");
        return;
      }
      const { applied, skipped } = await importBackup(json);
      setMessage(
        `রিস্টোর সম্পন্ন: ${applied}টি যুক্ত হয়েছে, ${skipped}টি অপরিবর্তিত।`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "রিস্টোর ব্যর্থ হয়েছে।");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-surface p-4">
      <h2 className="flex items-center gap-1.5 text-sm text-text-muted">
        <HardDriveDownload size={15} aria-hidden />
        Google Drive ব্যাকআপ
      </h2>
      <p className="mt-1 text-sm text-text-muted">
        পুরো খাতা আপনার নিজের Google Drive-এ সেভ করুন। ফোন বদলালে বা ডেটা মুছে
        গেলে এখান থেকে ফিরিয়ে আনতে পারবেন।
      </p>

      {lastBackupAt && (
        <p className="mt-2 text-sm text-text-muted">
          শেষ Drive ব্যাকআপ: {formatTimestamp(lastBackupAt)}
        </p>
      )}

      <div className="mt-3 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={backup}
          disabled={busy !== null}
          className="flex min-h-tap items-center justify-center gap-2 rounded-2xl bg-primary font-bold text-white shadow-lg hover:bg-primary-dark disabled:opacity-40"
        >
          <CloudUpload size={18} aria-hidden />
          {busy === "backup" ? "ব্যাকআপ…" : "ব্যাকআপ"}
        </button>
        <button
          type="button"
          onClick={restore}
          disabled={busy !== null}
          className="flex min-h-tap items-center justify-center gap-2 rounded-2xl border border-border font-semibold text-text hover:bg-background disabled:opacity-40"
        >
          <CloudDownload size={18} aria-hidden />
          {busy === "restore" ? "রিস্টোর…" : "রিস্টোর"}
        </button>
      </div>

      {message && <p className="mt-3 text-sm text-got">{message}</p>}
      {error && (
        <p className="mt-3 rounded-2xl bg-gave-light px-4 py-3 text-sm text-gave">
          {error}
        </p>
      )}
    </section>
  );
}
