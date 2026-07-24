import { getSupabase, isSyncConfigured } from "./supabase";

/**
 * Cloud-backup entitlement (SaaS phase). Mirrors the server `entitlements`
 * table. The paid "cloud" plan gates the Supabase sync engine (see sync.ts);
 * the free plan / Google Drive backup never touches this.
 *
 * Source of truth is the server — all writes go through SECURITY DEFINER RPCs
 * (see supabase/migrations/0005_entitlements.sql) so the client can never
 * self-grant. The functions here just wrap those RPCs and no-op without config.
 */

export type Plan = "free" | "cloud";
export type EntitlementStatus =
  "none" | "trialing" | "active" | "expired" | "canceled";

export interface Entitlement {
  user_id: string;
  plan: Plan;
  status: EntitlementStatus;
  trial_ends_at: string | null;
  current_period_end: string | null;
}

/** Ensure the signed-in user has an entitlement row; returns it (null if no sync). */
export async function ensureEntitlement(): Promise<Entitlement | null> {
  if (!isSyncConfigured()) return null;
  const { data, error } = await getSupabase().rpc("ensure_entitlement");
  if (error) return null;
  return (data as Entitlement) ?? null;
}

/** Start the one-time 14-day cloud trial; returns the (possibly unchanged) row. */
export async function startCloudTrial(): Promise<Entitlement | null> {
  if (!isSyncConfigured()) return null;
  const { data, error } = await getSupabase().rpc("start_cloud_trial");
  if (error) return null;
  return (data as Entitlement) ?? null;
}

/**
 * UI-only mirror of the server's is_cloud_active() (uses the device clock).
 * Use this to *display* trial/paid state; the actual sync gate must call the
 * server RPC (see hasCloudEntitlement in sync.ts) so a wrong clock can't cheat.
 */
export function isCloudActive(e: Entitlement | null | undefined): boolean {
  if (!e) return false;
  if (e.status === "active") return true;
  return (
    e.status === "trialing" &&
    e.trial_ends_at !== null &&
    new Date(e.trial_ends_at) > new Date()
  );
}
