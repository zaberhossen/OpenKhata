import { db } from "./db";
import { exportBackup, importBackup, type RestoreResult } from "./backup";
import {
  clearDriveToken,
  downloadBackup,
  getAccessToken,
  isDriveConfigured,
  uploadBackup,
} from "./gdrive";

/**
 * Automatic, WhatsApp-style Google Drive backup. Connect once, then the app
 * backs up on its own (silently, no popups) whenever it's open and a backup is
 * due. Preferences live in `db.meta`; the actual transport is `gdrive.ts` and
 * the JSON snapshot is `backup.ts`.
 *
 * A browser can't run when fully closed, so "automatic" means "while the app is
 * open, at most once per interval" — not a true OS-scheduled job.
 */

export type DriveFrequency = "off" | "daily" | "weekly";

const KEY_AUTO = "drive_auto";
const KEY_EMAIL = "drive_account_email";
const KEY_LAST_AT = "last_drive_backup_at";
const KEY_LAST_MAXTS = "drive_last_backup_maxts";
const KEY_NEEDS_RECONNECT = "drive_needs_reconnect";

const INTERVAL_MS: Record<Exclude<DriveFrequency, "off">, number> = {
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
};

export interface DriveSettings {
  frequency: DriveFrequency;
  email: string | null;
  lastBackupAt: string | null;
  needsReconnect: boolean;
}

async function getMeta(key: string): Promise<string | null> {
  return (await db.meta.get(key))?.value ?? null;
}
async function setMeta(key: string, value: string): Promise<void> {
  await db.meta.put({ key, value });
}
async function delMeta(key: string): Promise<void> {
  await db.meta.delete(key);
}

export async function getDriveSettings(): Promise<DriveSettings> {
  const [frequency, email, lastBackupAt, needsReconnect] = await Promise.all([
    getMeta(KEY_AUTO),
    getMeta(KEY_EMAIL),
    getMeta(KEY_LAST_AT),
    getMeta(KEY_NEEDS_RECONNECT),
  ]);
  return {
    frequency: (frequency as DriveFrequency) ?? "off",
    email,
    lastBackupAt,
    needsReconnect: needsReconnect === "1",
  };
}

/** Turn auto-backup on (default daily) and record the connected account. */
export async function connectDrive(
  email: string | null,
  frequency: DriveFrequency = "daily",
): Promise<void> {
  await setMeta(KEY_AUTO, frequency);
  if (email) await setMeta(KEY_EMAIL, email);
  await delMeta(KEY_NEEDS_RECONNECT);
}

export async function setDriveFrequency(freq: DriveFrequency): Promise<void> {
  await setMeta(KEY_AUTO, freq);
}

export async function disconnectDrive(): Promise<void> {
  clearDriveToken();
  await Promise.all([
    delMeta(KEY_AUTO),
    delMeta(KEY_EMAIL),
    delMeta(KEY_LAST_MAXTS),
    delMeta(KEY_NEEDS_RECONNECT),
  ]);
}

/** Latest updated_at across all data tables (empty string if no data). */
async function maxUpdatedAt(): Promise<string> {
  const latest = async (
    table: typeof db.businesses | typeof db.contacts | typeof db.transactions,
  ): Promise<string> => {
    const row = await table.orderBy("updated_at").last();
    return row?.updated_at ?? "";
  };
  const [b, c, t] = await Promise.all([
    latest(db.businesses),
    latest(db.contacts),
    latest(db.transactions),
  ]);
  return [b, c, t].sort().at(-1) ?? "";
}

function isDue(freq: DriveFrequency, lastAt: string | null): boolean {
  if (freq === "off") return false;
  if (!lastAt) return true;
  const elapsed = Date.now() - new Date(lastAt).getTime();
  return elapsed >= INTERVAL_MS[freq];
}

/** Perform a backup now (interactive picks up a fresh token via popup). */
export async function backupNow(interactive: boolean): Promise<void> {
  const token = await getAccessToken({ interactive });
  await uploadBackup(token, await exportBackup());
  const now = new Date().toISOString();
  await setMeta(KEY_LAST_AT, now);
  await setMeta(KEY_LAST_MAXTS, await maxUpdatedAt());
  await delMeta(KEY_NEEDS_RECONNECT);
}

/**
 * Silent, best-effort automatic backup. No-op unless enabled, online, due, and
 * there's new data. Never shows a popup; on a silent-auth failure it records a
 * `needsReconnect` flag so the UI can offer a one-tap reconnect. Safe to call
 * often (mount / focus / interval) — it's cheap and idempotent.
 */
export async function runAutoBackup(): Promise<void> {
  if (!isDriveConfigured()) return;
  if (typeof navigator !== "undefined" && !navigator.onLine) return;

  const { frequency, lastBackupAt } = await getDriveSettings();
  if (!isDue(frequency, lastBackupAt)) return;

  const maxts = await maxUpdatedAt();
  if (!maxts) return; // nothing to back up
  const lastMaxts = await getMeta(KEY_LAST_MAXTS);
  if (lastMaxts && maxts <= lastMaxts) {
    // No new changes; treat as satisfied so we don't retry every tick.
    await setMeta(KEY_LAST_AT, new Date().toISOString());
    return;
  }

  try {
    await backupNow(false);
  } catch {
    // Silent auth (or transient) failure — flag for a manual reconnect, no popup.
    await setMeta(KEY_NEEDS_RECONNECT, "1");
  }
}

/** Restore from the Drive backup; returns null if there is none. */
export async function restoreFromDrive(
  interactive: boolean,
): Promise<RestoreResult | null> {
  const token = await getAccessToken({ interactive });
  const json = await downloadBackup(token);
  if (!json) return null;
  return importBackup(json);
}
