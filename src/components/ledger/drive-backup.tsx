"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  CloudUpload,
  CloudDownload,
  HardDriveDownload,
  Check,
  TriangleAlert,
  Link2Off,
} from "lucide-react";
import {
  getAccessToken,
  getConnectedEmail,
  hasRemoteBackup,
  isDriveConfigured,
} from "@/lib/gdrive";
import {
  backupNow,
  connectDrive,
  disconnectDrive,
  getDriveSettings,
  restoreFromDrive,
  setDriveFrequency,
  type DriveFrequency,
} from "@/lib/drive-auto";
import { useAuthUser } from "@/hooks/use-sync";

function formatTimestamp(iso: string): string {
  return new Intl.DateTimeFormat("bn-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

const FREQ_LABEL: Record<Exclude<DriveFrequency, "off">, string> = {
  daily: "প্রতিদিন",
  weekly: "সাপ্তাহিক",
};

/**
 * WhatsApp-style Google Drive backup: connect the account once, then it backs
 * up automatically while the app is open (see `DriveAutoBackup`). On a new
 * device, connecting detects an existing backup and offers to restore. Hidden
 * entirely when no client ID is configured.
 */
export function DriveBackup() {
  const settings = useLiveQuery(() => getDriveSettings(), [], null);
  const { user } = useAuthUser();
  const [busy, setBusy] = useState<null | string>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isDriveConfigured() || !settings) return null;

  // Pre-select the logged-in account in Google's chooser so the backup lands
  // in the same account the user signed in with (undefined when signed out).
  const hint = user?.email ?? undefined;

  const connected = settings.frequency !== "off";

  function fail(e: unknown, fallback: string) {
    setError(e instanceof Error ? e.message : fallback);
  }

  /** First-time connect: consent → offer restore if a backup exists → enable. */
  async function connect() {
    if (busy) return;
    setBusy("connect");
    setMessage(null);
    setError(null);
    try {
      const token = await getAccessToken({ interactive: true, hint });
      const [email, remote] = await Promise.all([
        getConnectedEmail(token),
        hasRemoteBackup(token),
      ]);
      await connectDrive(email, "daily");

      if (remote) {
        if (
          window.confirm(
            "আপনার Google Drive-এ আগের একটি ব্যাকআপ পাওয়া গেছে। এখন রিস্টোর করবেন? (বর্তমান ডেটার সাথে মিলিয়ে নেওয়া হবে — কিছু মুছবে না।)",
          )
        ) {
          const result = await restoreFromDrive(true, hint);
          setMessage(
            result
              ? `রিস্টোর সম্পন্ন: ${result.applied}টি যুক্ত হয়েছে। অটো-ব্যাকআপ চালু হলো।`
              : "অটো-ব্যাকআপ চালু হলো।",
          );
          await backupNow(true, hint); // push the merged (superset) state
        } else {
          setMessage("অটো-ব্যাকআপ চালু হলো।");
        }
      } else {
        await backupNow(true, hint); // create the first backup
        setMessage("অটো-ব্যাকআপ চালু হলো — প্রথম ব্যাকআপ সম্পন্ন।");
      }
    } catch (e) {
      fail(e, "সংযোগ দেওয়া গেল না।");
    } finally {
      setBusy(null);
    }
  }

  async function doBackupNow() {
    if (busy) return;
    setBusy("backup");
    setMessage(null);
    setError(null);
    try {
      await backupNow(true, hint);
      setMessage("Google Drive-এ ব্যাকআপ সম্পন্ন হয়েছে।");
    } catch (e) {
      fail(e, "ব্যাকআপ ব্যর্থ হয়েছে।");
    } finally {
      setBusy(null);
    }
  }

  async function doRestore() {
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
      const result = await restoreFromDrive(true, hint);
      if (!result) {
        setError("Drive-এ কোনো ব্যাকআপ পাওয়া যায়নি।");
        return;
      }
      setMessage(
        `রিস্টোর সম্পন্ন: ${result.applied}টি যুক্ত হয়েছে, ${result.skipped}টি অপরিবর্তিত।`,
      );
    } catch (e) {
      fail(e, "রিস্টোর ব্যর্থ হয়েছে।");
    } finally {
      setBusy(null);
    }
  }

  async function changeFrequency(freq: Exclude<DriveFrequency, "off">) {
    await setDriveFrequency(freq);
  }

  async function disconnect() {
    if (busy) return;
    if (!window.confirm("অটো-ব্যাকআপ বন্ধ করবেন? Drive-এর ব্যাকআপ মুছবে না।")) {
      return;
    }
    await disconnectDrive();
    setMessage(null);
    setError(null);
  }

  return (
    <section className="rounded-2xl border border-border bg-surface p-4">
      <h2 className="flex items-center gap-1.5 text-sm text-text-muted">
        <HardDriveDownload size={15} aria-hidden />
        Google Drive অটো-ব্যাকআপ
      </h2>

      {!connected ? (
        <>
          <p className="mt-1 text-sm text-text-muted">
            একবার সংযোগ দিন — এরপর অ্যাপ খোলা থাকলে পুরো খাতা নিজে থেকেই আপনার
            নিজের Google Drive-এ ব্যাকআপ হবে। ফোন বদলালে এখান থেকেই ফিরিয়ে আনতে
            পারবেন।
          </p>
          <button
            type="button"
            onClick={connect}
            disabled={busy !== null}
            className="mt-3 flex min-h-tap w-full items-center justify-center gap-2 rounded-2xl bg-primary font-bold text-white shadow-lg hover:bg-primary-dark disabled:opacity-40"
          >
            <CloudUpload size={18} aria-hidden />
            {busy === "connect"
              ? "সংযোগ হচ্ছে…"
              : "Google Drive-এ অটো-ব্যাকআপ চালু করুন"}
          </button>
        </>
      ) : (
        <>
          <div className="mt-2 flex items-center gap-2 text-sm">
            <Check size={16} className="text-got" aria-hidden />
            <span className="font-semibold text-got">চালু আছে</span>
            {settings.email && (
              <span className="min-w-0 truncate text-text-muted">
                · {settings.email}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-text-muted">
            {settings.lastBackupAt
              ? `শেষ ব্যাকআপ: ${formatTimestamp(settings.lastBackupAt)}`
              : "প্রথম ব্যাকআপের অপেক্ষায়…"}
          </p>
          <p className="mt-0.5 text-xs text-text-muted">
            অটো-ব্যাকআপ:{" "}
            {FREQ_LABEL[settings.frequency as Exclude<DriveFrequency, "off">]} —
            অ্যাপ খোলা থাকলে নিজে থেকেই।
          </p>

          {settings.needsReconnect && (
            <button
              type="button"
              onClick={doBackupNow}
              disabled={busy !== null}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-gave-light px-4 py-3 text-sm font-semibold text-gave disabled:opacity-40"
            >
              <TriangleAlert size={16} aria-hidden />
              অটো-ব্যাকআপ থমকে আছে — আবার সংযোগ দিন
            </button>
          )}

          <div
            role="group"
            aria-label="ব্যাকআপের সময়সূচি"
            className="mt-3 flex gap-2"
          >
            {(["daily", "weekly"] as const).map((freq) => (
              <button
                key={freq}
                type="button"
                onClick={() => void changeFrequency(freq)}
                className={`min-h-tap flex-1 rounded-2xl border text-sm font-semibold ${
                  settings.frequency === freq
                    ? "border-primary bg-primary-light text-primary-dark"
                    : "border-border text-text-muted hover:bg-background"
                }`}
              >
                {FREQ_LABEL[freq]}
              </button>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={doBackupNow}
              disabled={busy !== null}
              className="flex min-h-tap items-center justify-center gap-2 rounded-2xl bg-primary font-bold text-white shadow-lg hover:bg-primary-dark disabled:opacity-40"
            >
              <CloudUpload size={18} aria-hidden />
              {busy === "backup" ? "ব্যাকআপ…" : "এখনই ব্যাকআপ"}
            </button>
            <button
              type="button"
              onClick={doRestore}
              disabled={busy !== null}
              className="flex min-h-tap items-center justify-center gap-2 rounded-2xl border border-border font-semibold text-text hover:bg-background disabled:opacity-40"
            >
              <CloudDownload size={18} aria-hidden />
              {busy === "restore" ? "রিস্টোর…" : "রিস্টোর"}
            </button>
          </div>

          <button
            type="button"
            onClick={disconnect}
            disabled={busy !== null}
            className="mt-3 flex min-h-tap w-full items-center justify-center gap-1.5 text-sm text-text-muted underline underline-offset-2 disabled:opacity-40"
          >
            <Link2Off size={15} aria-hidden />
            অটো-ব্যাকআপ বন্ধ করুন
          </button>
        </>
      )}

      {message && <p className="mt-3 text-sm text-got">{message}</p>}
      {error && (
        <p className="mt-3 rounded-2xl bg-gave-light px-4 py-3 text-sm text-gave">
          {error}
        </p>
      )}
    </section>
  );
}
