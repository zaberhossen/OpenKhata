"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import type { User } from "@supabase/supabase-js";
import { db } from "@/lib/db";
import { getSupabase, isSyncConfigured } from "@/lib/supabase";
import { getActivity, subscribeActivity } from "@/lib/sync";
import { getBackupChoice } from "@/lib/backup-choice";
import { isCloudActive } from "@/lib/entitlement";
import { useEntitlement } from "@/hooks/use-entitlement";

/** Current Supabase user; null when signed out or sync is unconfigured. */
export function useAuthUser(): { loading: boolean; user: User | null } {
  const [state, setState] = useState<{ loading: boolean; user: User | null }>({
    loading: isSyncConfigured(),
    user: null,
  });

  useEffect(() => {
    if (!isSyncConfigured()) return;
    const supabase = getSupabase();
    void supabase.auth.getSession().then(({ data }) => {
      setState({ loading: false, user: data.session?.user ?? null });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ loading: false, user: session?.user ?? null });
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return state;
}

function useOnline(): boolean {
  return useSyncExternalStore(
    (fn) => {
      window.addEventListener("online", fn);
      window.addEventListener("offline", fn);
      return () => {
        window.removeEventListener("online", fn);
        window.removeEventListener("offline", fn);
      };
    },
    () => navigator.onLine,
    () => true,
  );
}

export type SyncState =
  | "disabled" // no Supabase config, or Cloud isn't this device's backup choice
  | "signedOut"
  | "needsCloudPlan" // Cloud chosen but trial expired / not subscribed
  | "offline"
  | "syncing"
  | "pending" // queued changes waiting to push
  | "error"
  | "synced";

export interface SyncStatus {
  state: SyncState;
  pendingCount: number;
  lastSyncAt: string | null;
}

export function useSyncStatus(): SyncStatus {
  const { user } = useAuthUser();
  const { entitlement } = useEntitlement();
  const online = useOnline();
  const activity = useSyncExternalStore(
    subscribeActivity,
    getActivity,
    () => "idle" as const,
  );
  const choice = useLiveQuery(() => getBackupChoice(), [], "none");
  const pendingCount = useLiveQuery(() => db.outbox.count(), [], 0);
  const lastSyncAt = useLiveQuery(
    async () => (await db.meta.get("last_sync_at"))?.value ?? null,
    [],
    null,
  );

  // This status reflects the Cloud sync engine only. When Cloud isn't the
  // chosen destination on this device, treat it as inactive ("disabled") — the
  // Drive backup / chooser surface their own state.
  let state: SyncState;
  if (!isSyncConfigured()) state = "disabled";
  else if (!user) state = "signedOut";
  else if (choice !== "cloud") state = "disabled";
  else if (!isCloudActive(entitlement)) state = "needsCloudPlan";
  else if (!online) state = "offline";
  else if (activity === "syncing") state = "syncing";
  else if (activity === "error") state = "error";
  else if (pendingCount > 0) state = "pending";
  else state = "synced";

  return { state, pendingCount, lastSyncAt };
}
