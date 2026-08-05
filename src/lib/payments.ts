/**
 * Payment methods (Phase 4, Step 1 — "record payment manually").
 *
 * A method is just a tag on a ledger entry: cash / bKash / Nagad / … so the
 * shopkeeper knows *how* money moved. No money actually moves through the app
 * (that's Phase 4 Step 3, and needs PSP licensing). The field is optional and
 * nullable so every existing entry stays valid without migration.
 */

import type { ComponentType, CSSProperties } from "react";
import { Banknote, Landmark, Tag } from "lucide-react";
import {
  BkashIcon,
  NagadIcon,
  RocketIcon,
} from "@/components/ledger/payment-icons";

export type PaymentMethod =
  "cash" | "bkash" | "nagad" | "rocket" | "bank" | "other";

/** Any icon usable as a payment-method mark: lucide, react-icons, or a local
 *  brand <img> wrapper — all accept size/className/style/aria-hidden. */
export type PaymentIcon = ComponentType<{
  size?: string | number;
  className?: string;
  style?: CSSProperties;
  "aria-hidden"?: boolean | "true" | "false";
}>;

export interface PaymentMethodInfo {
  value: PaymentMethod;
  /** Bangla label shown in the UI and shared statements. */
  label: string;
  /** Icon shown as a compact chip (brand logo where available). */
  Icon: PaymentIcon;
  /** Optional brand accent colour (hex) applied via the icon's `style.color`
   *  (used by glyph icons like Rocket; brand-image icons ignore it). */
  color?: string;
}

/** Display order in the picker. "cash" first — it's the common case. */
export const PAYMENT_METHODS: PaymentMethodInfo[] = [
  { value: "cash", label: "ক্যাশ", Icon: Banknote },
  { value: "bkash", label: "বিকাশ", Icon: BkashIcon },
  { value: "nagad", label: "নগদ", Icon: NagadIcon },
  { value: "rocket", label: "রকেট", Icon: RocketIcon, color: "#8C3495" },
  { value: "bank", label: "ব্যাংক", Icon: Landmark },
  { value: "other", label: "অন্যান্য", Icon: Tag },
];

/**
 * A merchant's own payment account — the number a customer sends money to.
 * Stored on the business (Phase 4, Step 2). "cash" is meaningless here, so
 * the picker for accounts excludes it.
 */
export interface PaymentAccount {
  method: PaymentMethod;
  /** The bKash/Nagad/… number or bank account, as the merchant typed it. */
  number: string;
}

/** Methods that make sense as a *collectable* account (cash can't have a QR). */
export const ACCOUNT_METHODS = PAYMENT_METHODS.filter(
  (m) => m.value !== "cash" && m.value !== "other",
);

/**
 * Trim numbers and drop blank rows — the exact shape that gets persisted.
 * Shared with the editor so it can tell "unsaved edits" from "half-typed row
 * that would be discarded anyway".
 */
export function normalizeAccounts(
  accounts: PaymentAccount[],
): PaymentAccount[] {
  return accounts
    .map((a) => ({ method: a.method, number: a.number.trim() }))
    .filter((a) => a.number.length > 0);
}

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
