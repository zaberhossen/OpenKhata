/**
 * Payment methods (Phase 4, Step 1 — "record payment manually").
 *
 * A method is just a tag on a ledger entry: cash / bKash / Nagad / … so the
 * shopkeeper knows *how* money moved. No money actually moves through the app
 * (that's Phase 4 Step 3, and needs PSP licensing). The field is optional and
 * nullable so every existing entry stays valid without migration.
 */

export type PaymentMethod =
  "cash" | "bkash" | "nagad" | "rocket" | "bank" | "other";

export interface PaymentMethodInfo {
  value: PaymentMethod;
  /** Bangla label shown in the UI and shared statements. */
  label: string;
  /** Emoji used as a compact chip icon. */
  icon: string;
}

/** Display order in the picker. "cash" first — it's the common case. */
export const PAYMENT_METHODS: PaymentMethodInfo[] = [
  { value: "cash", label: "ক্যাশ", icon: "💵" },
  { value: "bkash", label: "বিকাশ", icon: "📱" },
  { value: "nagad", label: "নগদ", icon: "📲" },
  { value: "rocket", label: "রকেট", icon: "🚀" },
  { value: "bank", label: "ব্যাংক", icon: "🏦" },
  { value: "other", label: "অন্যান্য", icon: "🏷️" },
];

const BY_VALUE = new Map(PAYMENT_METHODS.map((m) => [m.value, m]));

/** Info for a stored method, or null for a missing/unknown value. */
export function paymentMethodInfo(
  method: string | null | undefined,
): PaymentMethodInfo | null {
  if (!method) return null;
  return BY_VALUE.get(method as PaymentMethod) ?? null;
}

/** Bangla label for a method, or "" if none/unknown (safe for share text). */
export function paymentMethodLabel(method: string | null | undefined): string {
  return paymentMethodInfo(method)?.label ?? "";
}
