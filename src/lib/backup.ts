import { db, type Business, type Contact, type LedgerEntry } from "./db";
import { isSyncConfigured } from "./supabase";
import { syncNow } from "./sync";

/**
 * Full-snapshot backup (Growth phase). Distinct from the Supabase sync engine:
 * this exports every local row to a single JSON document the user owns (e.g.
 * on their Google Drive) and restores it by merging — never wiping — so a
 * restore can't lose newer local edits. Works even when cloud sync is off.
 */

export const BACKUP_FILENAME = "openkhata-backup.json";
const BACKUP_VERSION = 1;

interface BackupEnvelope {
  app: "openkhata";
  version: number;
  exported_at: string;
  data: {
    businesses: Business[];
    contacts: Contact[];
    transactions: LedgerEntry[];
  };
}

/** Serialise every local row (including soft-deleted) to a JSON string. */
export async function exportBackup(): Promise<string> {
  const [businesses, contacts, transactions] = await Promise.all([
    db.businesses.toArray(),
    db.contacts.toArray(),
    db.transactions.toArray(),
  ]);
  const envelope: BackupEnvelope = {
    app: "openkhata",
    version: BACKUP_VERSION,
    exported_at: new Date().toISOString(),
    data: { businesses, contacts, transactions },
  };
  return JSON.stringify(envelope);
}

export interface RestoreResult {
  applied: number; // rows written (new or newer)
  skipped: number; // rows a newer local copy already covered
}

/** Merge a `{ id, updated_at }` record into its table, last-write-wins. */
async function mergeRow<T extends { id: string; updated_at: string }>(
  table: import("dexie").Table<T, string>,
  row: T,
  counters: RestoreResult,
): Promise<void> {
  const local = await table.get(row.id);
  if (!local || row.updated_at > local.updated_at) {
    await table.put(row);
    counters.applied += 1;
  } else {
    counters.skipped += 1;
  }
}

/**
 * Restore from a backup JSON string. Merges by updated_at (same rule as the
 * sync engine's pull), then triggers a sync if cloud backup is configured so
 * restored rows propagate. Throws on a malformed/foreign file.
 */
export async function importBackup(json: string): Promise<RestoreResult> {
  let parsed: BackupEnvelope;
  try {
    parsed = JSON.parse(json) as BackupEnvelope;
  } catch {
    throw new Error("ফাইলটি পড়া গেল না (invalid JSON)।");
  }
  if (parsed?.app !== "openkhata" || !parsed.data) {
    throw new Error("এটি ওপেনখাতার ব্যাকআপ ফাইল নয়।");
  }

  const result: RestoreResult = { applied: 0, skipped: 0 };
  const { businesses = [], contacts = [], transactions = [] } = parsed.data;

  await db.transaction(
    "rw",
    db.businesses,
    db.contacts,
    db.transactions,
    async () => {
      for (const row of businesses) await mergeRow(db.businesses, row, result);
      for (const row of contacts) await mergeRow(db.contacts, row, result);
      for (const row of transactions)
        await mergeRow(db.transactions, row, result);
    },
  );

  if (isSyncConfigured()) void syncNow();
  return result;
}
