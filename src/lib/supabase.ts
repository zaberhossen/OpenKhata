import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Cloud sync is optional — without env config the app stays local-only. */
export function isSyncConfigured(): boolean {
  return Boolean(url && anonKey);
}

let client: SupabaseClient | null = null;

/** Lazy singleton; only call in the browser and when isSyncConfigured(). */
export function getSupabase(): SupabaseClient {
  if (!url || !anonKey) {
    throw new Error("Supabase is not configured (see .env.example)");
  }
  if (!client) {
    client = createClient(url, anonKey);
  }
  return client;
}
