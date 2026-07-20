import {
  db,
  type Contact,
  type ContactKind,
  type EntryType,
  type SyncedTable,
} from "./db";
import { newId, nowISO } from "./ids";

const DEFAULT_BUSINESS_NAME = "আমার ব্যবসা";

/**
 * Queue a record for push. Must run inside the same Dexie transaction as the
 * write itself so a change can never exist without its outbox entry. Repeated
 * edits collapse into one entry per record (id = table:record_id).
 */
async function enqueue(table: SyncedTable, recordId: string): Promise<void> {
  await db.outbox.put({
    id: `${table}:${recordId}`,
    table,
    record_id: recordId,
    queued_at: nowISO(),
  });
}

/**
 * The app is single-business until Phase 5; every record still carries a
 * business_id so multi-business needs no migration later.
 */
export async function ensureDefaultBusiness(): Promise<string> {
  return db.transaction("rw", db.businesses, db.outbox, async () => {
    const existing = await db.businesses.filter((b) => !b.deleted_at).first();
    if (existing) return existing.id;
    const now = nowISO();
    const id = newId();
    await db.businesses.add({
      id,
      name: DEFAULT_BUSINESS_NAME,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    });
    await enqueue("businesses", id);
    return id;
  });
}

export async function addContact(input: {
  name: string;
  phone: string;
  kind: ContactKind;
}): Promise<string> {
  return db.transaction(
    "rw",
    db.businesses,
    db.contacts,
    db.outbox,
    async () => {
      const businessId = await ensureDefaultBusiness();
      const now = nowISO();
      const id = newId();
      await db.contacts.add({
        id,
        business_id: businessId,
        name: input.name.trim(),
        phone: input.phone.trim(),
        kind: input.kind,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      });
      await enqueue("contacts", id);
      return id;
    },
  );
}

export async function updateContact(
  id: string,
  changes: Pick<Contact, "name" | "phone" | "kind">,
): Promise<void> {
  await db.transaction("rw", db.contacts, db.outbox, async () => {
    await db.contacts.update(id, {
      name: changes.name.trim(),
      phone: changes.phone.trim(),
      kind: changes.kind,
      updated_at: nowISO(),
    });
    await enqueue("contacts", id);
  });
}

/** Soft delete — the record stays so sync can propagate the deletion. */
export async function deleteContact(id: string): Promise<void> {
  const now = nowISO();
  await db.transaction(
    "rw",
    db.contacts,
    db.transactions,
    db.outbox,
    async () => {
      await db.contacts.update(id, { deleted_at: now, updated_at: now });
      await enqueue("contacts", id);
      const entryIds = await db.transactions
        .where("contact_id")
        .equals(id)
        .primaryKeys();
      for (const entryId of entryIds) {
        await db.transactions.update(entryId, {
          deleted_at: now,
          updated_at: now,
        });
        await enqueue("transactions", entryId);
      }
    },
  );
}

export async function addEntry(input: {
  contactId: string;
  type: EntryType;
  amount: number; // poisha
  note: string;
  entryDate: string; // YYYY-MM-DD
}): Promise<string> {
  return db.transaction(
    "rw",
    db.businesses,
    db.transactions,
    db.outbox,
    async () => {
      const businessId = await ensureDefaultBusiness();
      const now = nowISO();
      const id = newId();
      await db.transactions.add({
        id,
        business_id: businessId,
        contact_id: input.contactId,
        type: input.type,
        amount: input.amount,
        note: input.note.trim(),
        entry_date: input.entryDate,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      });
      await enqueue("transactions", id);
      return id;
    },
  );
}

export async function deleteEntry(id: string): Promise<void> {
  const now = nowISO();
  await db.transaction("rw", db.transactions, db.outbox, async () => {
    await db.transactions.update(id, { deleted_at: now, updated_at: now });
    await enqueue("transactions", id);
  });
}

/**
 * Balance convention (shopkeeper's perspective):
 *   দিলাম (gave)  → they owe me more  → balance increases
 *   পেলাম (got)   → they paid me back → balance decreases
 * Positive balance = পাবো (receivable), negative = দেবো (payable).
 */
export function entrySign(type: EntryType): 1 | -1 {
  return type === "gave" ? 1 : -1;
}
