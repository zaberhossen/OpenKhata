import Dexie, { type Table } from "dexie";
import type { PaymentMethod } from "./payments";

export type ContactKind = "customer" | "supplier";
export type EntryType = "got" | "gave";

/**
 * Every record carries a client-generated UUID plus created_at/updated_at
 * (ISO strings) and a soft-delete marker. Phase 2's sync engine will rely on
 * these — do not remove fields, only add.
 */
export interface Business {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Contact {
  id: string;
  business_id: string;
  name: string;
  phone: string;
  kind: ContactKind;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/** A single খাতা entry. `amount` is in poisha (integer) to avoid float drift. */
export interface LedgerEntry {
  id: string;
  business_id: string;
  contact_id: string;
  type: EntryType;
  amount: number;
  note: string;
  entry_date: string; // YYYY-MM-DD (user-chosen date, not created_at)
  /** How the money moved (Phase 4). null = not recorded; not indexed. */
  payment_method: PaymentMethod | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/** Name of a synced table — used by the outbox and the sync engine. */
export type SyncedTable = "businesses" | "contacts" | "transactions";

/**
 * One queued local change awaiting push. `id` is `${table}:${recordId}`, so
 * repeated edits to the same record collapse into a single pending push of
 * its latest state.
 */
export interface OutboxItem {
  id: string;
  table: SyncedTable;
  record_id: string;
  queued_at: string;
}

/** Key-value store for sync cursors, last-sync time, etc. */
export interface MetaItem {
  key: string;
  value: string;
}

class OpenKhataDB extends Dexie {
  businesses!: Table<Business, string>;
  contacts!: Table<Contact, string>;
  transactions!: Table<LedgerEntry, string>;
  outbox!: Table<OutboxItem, string>;
  meta!: Table<MetaItem, string>;

  constructor() {
    super("openkhata");
    this.version(1).stores({
      businesses: "id, updated_at",
      contacts: "id, business_id, name, updated_at",
      transactions: "id, contact_id, business_id, entry_date, updated_at",
    });
    this.version(2).stores({
      businesses: "id, updated_at",
      contacts: "id, business_id, name, updated_at",
      transactions: "id, contact_id, business_id, entry_date, updated_at",
      outbox: "id, table, queued_at",
      meta: "key",
    });
    // v3 adds LedgerEntry.payment_method (Phase 4). It isn't indexed, so the
    // stores are unchanged; the upgrade only backfills the field to null on
    // existing rows so every record matches the type.
    this.version(3)
      .stores({
        businesses: "id, updated_at",
        contacts: "id, business_id, name, updated_at",
        transactions: "id, contact_id, business_id, entry_date, updated_at",
        outbox: "id, table, queued_at",
        meta: "key",
      })
      .upgrade((tx) =>
        tx
          .table("transactions")
          .toCollection()
          .modify((t) => {
            if (t.payment_method === undefined) t.payment_method = null;
          }),
      );
  }
}

export const db = new OpenKhataDB();
