import Dexie, { type Table } from "dexie";

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
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

class OpenKhataDB extends Dexie {
  businesses!: Table<Business, string>;
  contacts!: Table<Contact, string>;
  transactions!: Table<LedgerEntry, string>;

  constructor() {
    super("openkhata");
    this.version(1).stores({
      businesses: "id, updated_at",
      contacts: "id, business_id, name, updated_at",
      transactions: "id, contact_id, business_id, entry_date, updated_at",
    });
  }
}

export const db = new OpenKhataDB();
