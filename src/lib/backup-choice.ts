import { db } from "./db";

/**
 * Per-device backup destination. A logged-in user picks exactly one backup
 * engine so the two never run at once (see the guards in sync.ts and
 * drive-auto.ts):
 *
 *   "none"  — not chosen yet (or signed out); no engine runs.
 *   "drive" — user-owned Google Drive backup (free).
 *   "cloud" — OpenKhata Cloud / Supabase sync (paid, gated by entitlement).
 *
 * This is a device-local UX preference (a person may back up to Drive on one
 * phone and Cloud on another), so it lives in the Dexie `meta` table — distinct
 * from the *entitlement* (trial/paid), which is server-side source of truth.
 */

export type BackupDestination = "none" | "drive" | "cloud";

const KEY = "backup_destination";

export async function getBackupChoice(): Promise<BackupDestination> {
  return ((await db.meta.get(KEY))?.value as BackupDestination) ?? "none";
}

export async function setBackupChoice(dest: BackupDestination): Promise<void> {
  await db.meta.put({ key: KEY, value: dest });
}
