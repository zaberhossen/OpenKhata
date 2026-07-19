"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db, type Contact, type LedgerEntry } from "@/lib/db";
import { entrySign } from "@/lib/repo";

export interface ContactWithBalance extends Contact {
  balance: number; // poisha; >0 পাবো, <0 দেবো
  lastActivity: string;
}

export interface Totals {
  receivable: number; // মোট পাবো
  payable: number; // মোট দেবো (stored positive)
}

/** All non-deleted contacts with computed balances, most recent activity first. */
export function useContactsWithBalances():
  { contacts: ContactWithBalance[]; totals: Totals } | undefined {
  return useLiveQuery(async () => {
    const [contacts, entries] = await Promise.all([
      db.contacts.filter((c) => !c.deleted_at).toArray(),
      db.transactions.filter((t) => !t.deleted_at).toArray(),
    ]);

    const balances = new Map<string, { balance: number; last: string }>();
    for (const entry of entries) {
      const current = balances.get(entry.contact_id) ?? {
        balance: 0,
        last: "",
      };
      current.balance += entrySign(entry.type) * entry.amount;
      if (entry.created_at > current.last) current.last = entry.created_at;
      balances.set(entry.contact_id, current);
    }

    const withBalances: ContactWithBalance[] = contacts.map((contact) => {
      const info = balances.get(contact.id);
      return {
        ...contact,
        balance: info?.balance ?? 0,
        lastActivity: info?.last || contact.updated_at,
      };
    });
    withBalances.sort((a, b) => b.lastActivity.localeCompare(a.lastActivity));

    const totals: Totals = { receivable: 0, payable: 0 };
    for (const { balance } of withBalances) {
      if (balance > 0) totals.receivable += balance;
      else totals.payable += -balance;
    }

    return { contacts: withBalances, totals };
  }, []);
}

export interface ContactLedger {
  contact: Contact | null;
  entries: LedgerEntry[]; // newest first
  balance: number;
}

/** One contact plus its transaction history and balance. */
export function useContactLedger(
  contactId: string | null,
): ContactLedger | undefined {
  return useLiveQuery(async () => {
    if (!contactId) return { contact: null, entries: [], balance: 0 };
    const [contact, entries] = await Promise.all([
      db.contacts.get(contactId),
      db.transactions
        .where("contact_id")
        .equals(contactId)
        .filter((t) => !t.deleted_at)
        .toArray(),
    ]);
    entries.sort(
      (a, b) =>
        b.entry_date.localeCompare(a.entry_date) ||
        b.created_at.localeCompare(a.created_at),
    );
    const balance = entries.reduce(
      (sum, e) => sum + entrySign(e.type) * e.amount,
      0,
    );
    return {
      contact: contact && !contact.deleted_at ? contact : null,
      entries,
      balance,
    };
  }, [contactId]);
}
