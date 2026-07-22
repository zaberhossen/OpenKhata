import { getSupabase, isSyncConfigured } from "./supabase";

/**
 * Referral system (Growth phase). Each user gets a share code; a new user who
 * arrives via `/?ref=CODE` credits the referrer after they sign in. The only
 * reward is cosmetic — a "সমর্থক" (supporter) badge past a small threshold.
 */

export const SUPPORTER_THRESHOLD = 3;
const PENDING_REF_KEY = "openkhata_pending_ref";

export interface Profile {
  user_id: string;
  referral_code: string;
  referred_by: string | null;
  referral_count: number;
}

export function isSupporter(count: number): boolean {
  return count >= SUPPORTER_THRESHOLD;
}

export function referralLink(code: string): string {
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://openkhata";
  return `${origin}/?ref=${code}`;
}

/**
 * If the current URL carries `?ref=CODE`, remember it (until the user signs in
 * and it can be redeemed) and strip it from the address bar. Safe to call on
 * any page; no-op without a code.
 */
export function capturePendingRef(): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  const code = url.searchParams.get("ref");
  if (!code) return;
  try {
    localStorage.setItem(PENDING_REF_KEY, code.trim().toUpperCase());
  } catch {
    // storage unavailable — ignore
  }
  url.searchParams.delete("ref");
  window.history.replaceState({}, "", url.toString());
}

/** Ensure the signed-in user has a profile row; returns it (null if no sync). */
export async function ensureProfile(): Promise<Profile | null> {
  if (!isSyncConfigured()) return null;
  const { data, error } = await getSupabase().rpc("ensure_profile");
  if (error) return null;
  return (data as Profile) ?? null;
}

/** Redeem any pending referral code once, then clear it. */
export async function redeemPendingRef(): Promise<void> {
  if (!isSyncConfigured() || typeof window === "undefined") return;
  const code = localStorage.getItem(PENDING_REF_KEY);
  if (!code) return;
  const { error } = await getSupabase().rpc("redeem_referral", { code });
  // Clear on success or a definitive no-op; keep it only on transient/network
  // failure so a later attempt can retry.
  if (!error) localStorage.removeItem(PENDING_REF_KEY);
}
