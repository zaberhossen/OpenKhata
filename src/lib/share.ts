import type { Contact, LedgerEntry } from "./db";
import { formatTaka } from "./money";
import { formatDate } from "./dates";
import { paymentMethodLabel } from "./payments";

/**
 * Sharing is device-native and free: Web Share API where available, with
 * WhatsApp and SMS deep links as explicit fallbacks. No SMS gateway, no cost
 * (roadmap Phase 3 note).
 */

/** "01712345678" / "+8801712345678" → "8801712345678" for wa.me. "" if unusable. */
function waNumber(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits.slice(1);
  if (digits.startsWith("880")) return digits;
  if (digits.startsWith("01")) return `88${digits}`;
  return digits;
}

/** A short Bangla reminder for an outstanding balance (only meaningful when পাবো). */
export function reminderMessage(contact: Contact, balance: number): string {
  const amount = formatTaka(Math.abs(balance));
  return (
    `আসসালামু আলাইকুম ${contact.name},\n\n` +
    `আমার খাতা অনুযায়ী আপনার কাছে ${amount} বাকি আছে। ` +
    `সুবিধামতো পরিশোধ করলে খুশি হবো।\n\n` +
    `ধন্যবাদ।\n— ওপেনখাতা`
  );
}

/** Full statement text: every transaction plus the closing balance. */
export function statementMessage(
  contact: Contact,
  entries: LedgerEntry[],
  balance: number,
): string {
  const lines = [`${contact.name} — লেনদেনের হিসাব`, ""];
  // Oldest first reads like a ledger.
  const ordered = [...entries].sort(
    (a, b) =>
      a.entry_date.localeCompare(b.entry_date) ||
      a.created_at.localeCompare(b.created_at),
  );
  for (const e of ordered) {
    const label = e.type === "gave" ? "দিলাম" : "পেলাম";
    const method = paymentMethodLabel(e.payment_method);
    // Bundle method + note in one parenthetical: " (বিকাশ · চাল ২ বস্তা)".
    const detail = [method, e.note].filter(Boolean).join(" · ");
    const suffix = detail ? ` (${detail})` : "";
    lines.push(
      `${formatDate(e.entry_date)} — ${label} ${formatTaka(e.amount)}${suffix}`,
    );
  }
  lines.push("");
  if (balance > 0) lines.push(`মোট পাবো: ${formatTaka(balance)}`);
  else if (balance < 0) lines.push(`মোট দেবো: ${formatTaka(-balance)}`);
  else lines.push("হিসাব সমান");
  lines.push("— ওপেনখাতা");
  return lines.join("\n");
}

export interface ShareTargets {
  /** True if the native share sheet is available (mobile browsers, installed PWA). */
  canNativeShare: boolean;
  whatsappUrl: string;
  smsUrl: string;
}

export function shareTargets(phone: string, message: string): ShareTargets {
  const text = encodeURIComponent(message);
  const wa = waNumber(phone);
  return {
    canNativeShare:
      typeof navigator !== "undefined" && typeof navigator.share === "function",
    whatsappUrl: wa
      ? `https://wa.me/${wa}?text=${text}`
      : `https://wa.me/?text=${text}`,
    // Both `?` and `;` separators exist in the wild; `?` is the modern default.
    smsUrl: `sms:${phone}?body=${text}`,
  };
}

/**
 * Outcome of a Web Share attempt. "dismissed" is deliberately distinct from
 * "unsupported": a user who closed the OS sheet has finished interacting, so
 * callers must not chain a fallback prompt on top of it. Only "unsupported"
 * means Web Share never ran and a fallback is warranted.
 */
export type NativeShareResult = "shared" | "dismissed" | "unsupported";

/** Try the native share sheet. */
export async function nativeShare(
  title: string,
  text: string,
): Promise<NativeShareResult> {
  if (
    typeof navigator === "undefined" ||
    typeof navigator.share !== "function"
  ) {
    return "unsupported";
  }
  try {
    await navigator.share({ title, text });
    return "shared";
  } catch (err) {
    // AbortError = the user closed the sheet on purpose. Anything else
    // (NotAllowedError, no share target) means Web Share couldn't serve us.
    const name = (err as DOMException | undefined)?.name;
    return name === "AbortError" ? "dismissed" : "unsupported";
  }
}
