import { db, type Contact, type ContactKind, type EntryType } from "./db";
import { newId, nowISO } from "./ids";

const DEFAULT_BUSINESS_NAME = "আমার ব্যবসা";

/**
 * The app is single-business until Phase 5; every record still carries a
 * business_id so multi-business needs no migration later.
 */
export async function ensureDefaultBusiness(): Promise<string> {
  return db.transaction("rw", db.businesses, async () => {
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
    return id;
  });
}

export async function addContact(input: {
  name: string;
  phone: string;
  kind: ContactKind;
}): Promise<string> {
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
  return id;
}

export async function updateContact(
  id: string,
  changes: Pick<Contact, "name" | "phone" | "kind">,
): Promise<void> {
  await db.contacts.update(id, {
    name: changes.name.trim(),
    phone: changes.phone.trim(),
    kind: changes.kind,
    updated_at: nowISO(),
  });
}

/** Soft delete — the record stays for Phase 2 sync to propagate. */
export async function deleteContact(id: string): Promise<void> {
  const now = nowISO();
  await db.transaction("rw", db.contacts, db.transactions, async () => {
    await db.contacts.update(id, { deleted_at: now, updated_at: now });
    await db.transactions
      .where("contact_id")
      .equals(id)
      .modify({ deleted_at: now, updated_at: now });
  });
}

export async function addEntry(input: {
  contactId: string;
  type: EntryType;
  amount: number; // poisha
  note: string;
  entryDate: string; // YYYY-MM-DD
}): Promise<string> {
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
  return id;
}

export async function deleteEntry(id: string): Promise<void> {
  const now = nowISO();
  await db.transactions.update(id, { deleted_at: now, updated_at: now });
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
