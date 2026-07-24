import { liveQuery } from "dexie";
import { db, type SyncedTable } from "./db";
import { getSupabase, isSyncConfigured } from "./supabase";
import { getBackupChoice } from "./backup-choice";

/**
 * Sync engine (Phase 2).
 *
 * Push: every local write queues an outbox entry (see repo.ts). Pushing
 * upserts the record's *current* state to Supabase; a server-side trigger
 * drops upserts whose updated_at is older than the stored row, so conflict
 * resolution is last-write-wins in both directions.
 *
 * Pull: per-table cursor (max updated_at seen) stored in the meta table.
 * Pulled rows are applied only when newer than the local copy, and are
 * written directly to Dexie (not via repo), so they never re-enter the
 * outbox.
 *
 * Triggers: login → full pull + push; browser 'online' → sync; outbox
 * non-empty (debounced) → push; interval → sync. All entry points funnel
 * through syncNow(), which serializes runs.
 */

const TABLES: SyncedTable[] = ["businesses", "contacts", "transactions"];
const PULL_PAGE_SIZE = 500;
const PUSH_DEBOUNCE_MS = 2_000;
const AUTO_SYNC_INTERVAL_MS = 60_000;

export type SyncActivity = "idle" | "syncing" | "error";

let activity: SyncActivity = "idle";
const listeners = new Set<() => void>();

function setActivity(next: SyncActivity) {
  activity = next;
  listeners.forEach((fn) => fn());
}

/** For React's useSyncExternalStore. */
export function subscribeActivity(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
export function getActivity(): SyncActivity {
  return activity;
}

async function getMeta(key: string): Promise<string | null> {
  return (await db.meta.get(key))?.value ?? null;
}
async function setMeta(key: string, value: string): Promise<void> {
  await db.meta.put({ key, value });
}

async function hasSession(): Promise<boolean> {
  if (!isSyncConfigured()) return false;
  const { data } = await getSupabase().auth.getSession();
  return Boolean(data.session);
}

// Cache the server-computed entitlement check so we don't fire an RPC on every
// debounce tick. TTL matches the auto-sync interval; cleared on auth change.
let cloudActiveCache: { value: boolean; at: number } | null = null;
const CLOUD_CACHE_TTL_MS = AUTO_SYNC_INTERVAL_MS;

/** Invalidate the cached entitlement check (e.g. right after starting a trial
 *  or a manual grant) so the next syncNow() re-checks the server immediately. */
export function clearCloudCache(): void {
  cloudActiveCache = null;
}

/**
 * Whether the user currently has cloud access. Uses the server RPC (server
 * now()) so a wrong device clock can't extend a trial — never trusts a locally
 * computed expiry. Returns false (fail-closed) on any error.
 */
async function hasCloudEntitlement(): Promise<boolean> {
  const now = Date.now();
  if (cloudActiveCache && now - cloudActiveCache.at < CLOUD_CACHE_TTL_MS) {
    return cloudActiveCache.value;
  }
  const { data, error } = await getSupabase().rpc("is_cloud_active");
  const value = !error && data === true;
  cloudActiveCache = { value, at: now };
  return value;
}

async function pushTable(table: SyncedTable): Promise<void> {
  const items = await db.outbox.where("table").equals(table).toArray();
  if (items.length === 0) return;

  const records = (
    await db.table(table).bulkGet(items.map((i) => i.record_id))
  ).filter((r) => r !== undefined);
  if (records.length > 0) {
    const { error } = await getSupabase().from(table).upsert(records);
    if (error) throw new Error(`push ${table}: ${error.message}`);
  }

  // Remove pushed outbox entries — unless the record was edited again while
  // the request was in flight (same id, newer queued_at stays queued).
  await db.transaction("rw", db.outbox, async () => {
    for (const item of items) {
      const current = await db.outbox.get(item.id);
      if (current && current.queued_at === item.queued_at) {
        await db.outbox.delete(item.id);
      }
    }
  });
}

async function pullTable(table: SyncedTable): Promise<void> {
  const cursorKey = `pull_cursor:${table}`;
  let cursor = (await getMeta(cursorKey)) ?? "1970-01-01T00:00:00Z";

  for (;;) {
    const { data, error } = await getSupabase()
      .from(table)
      .select("*")
      .gt("updated_at", cursor)
      .order("updated_at", { ascending: true })
      .limit(PULL_PAGE_SIZE);
    if (error) throw new Error(`pull ${table}: ${error.message}`);
    if (!data || data.length === 0) return;

    await db.transaction("rw", db.table(table), db.meta, async () => {
      for (const row of data) {
        // user_id is a server-side concern; the local schema has no such field.
        const record = { ...row };
        delete record.user_id;
        const local = await db.table(table).get(record.id);
        if (!local || record.updated_at > local.updated_at) {
          await db.table(table).put(record);
        }
      }
      cursor = data[data.length - 1].updated_at;
      await setMeta(cursorKey, cursor);
    });

    if (data.length < PULL_PAGE_SIZE) return;
  }
}

let running: Promise<void> | null = null;
let runAgain = false;

/**
 * Push all pending changes, then pull remote ones. Serialized: a call while
 * a run is in flight schedules exactly one follow-up run.
 */
export function syncNow(): Promise<void> {
  if (running) {
    runAgain = true;
    return running;
  }
  running = (async () => {
    try {
      if (typeof navigator !== "undefined" && !navigator.onLine) return;
      if (!(await hasSession())) return;
      // Cloud sync only runs when the user picked the Cloud destination AND has
      // an active paid/trial entitlement. Otherwise it's a no-op — Drive backup
      // and the fully-local experience are untouched. Local writes keep queuing
      // in the outbox; nothing is lost when access lapses.
      if ((await getBackupChoice()) !== "cloud") return;
      if (!(await hasCloudEntitlement())) return;
      setActivity("syncing");
      for (const table of TABLES) await pushTable(table);
      for (const table of TABLES) await pullTable(table);
      await setMeta("last_sync_at", new Date().toISOString());
      setActivity("idle");
    } catch (error) {
      console.error("Sync failed:", error);
      setActivity("error");
    } finally {
      running = null;
      if (runAgain) {
        runAgain = false;
        void syncNow();
      }
    }
  })();
  return running;
}

/** Sign out, keeping local data on the device. Sync cursors reset so a
 *  different account's pull starts from scratch. */
export async function signOutKeepingData(): Promise<void> {
  clearCloudCache();
  await getSupabase().auth.signOut();
  await db.meta.bulkDelete([
    "last_sync_at",
    ...TABLES.map((t) => `pull_cursor:${t}`),
  ]);
}

let started = false;

/** Wire up auto-sync. Call once from a client component; no-op without config. */
export function initSync(): void {
  if (started || typeof window === "undefined" || !isSyncConfigured()) return;
  started = true;

  getSupabase().auth.onAuthStateChange((event) => {
    clearCloudCache(); // re-check entitlement for the new session
    if (event === "SIGNED_IN" || event === "INITIAL_SESSION") void syncNow();
  });

  window.addEventListener("online", () => void syncNow());

  let debounce: ReturnType<typeof setTimeout> | undefined;
  liveQuery(() => db.outbox.count()).subscribe((count) => {
    if (count === 0) return;
    clearTimeout(debounce);
    debounce = setTimeout(() => void syncNow(), PUSH_DEBOUNCE_MS);
  });

  setInterval(() => void syncNow(), AUTO_SYNC_INTERVAL_MS);
}
