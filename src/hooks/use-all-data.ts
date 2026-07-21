"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db, type Contact, type LedgerEntry } from "@/lib/db";

export interface AllData {
  entries: LedgerEntry[];
  contactsById: Map<string, Contact>;
}

/** All non-deleted entries + a contact lookup, for reports/export. */
export function useAllData(): AllData | undefined {
  return useLiveQuery(async () => {
    const [entries, contacts] = await Promise.all([
      db.transactions.filter((t) => !t.deleted_at).toArray(),
      db.contacts.filter((c) => !c.deleted_at).toArray(),
    ]);
    return {
      entries,
      contactsById: new Map(contacts.map((c) => [c.id, c])),
    };
  }, []);
}
