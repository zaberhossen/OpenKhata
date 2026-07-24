"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuthUser } from "@/hooks/use-sync";
import { ensureEntitlement, type Entitlement } from "@/lib/entitlement";

/**
 * The signed-in user's cloud-backup entitlement. Undefined while loading, null
 * when signed out or sync is unconfigured. Drives the backup-choice UI (trial
 * countdown / upgrade CTA).
 */
export function useEntitlement(): {
  entitlement: Entitlement | null | undefined;
  refresh: () => void;
} {
  const { user } = useAuthUser();
  const [entitlement, setEntitlement] = useState<
    Entitlement | null | undefined
  >(undefined);

  const refresh = useCallback(() => {
    if (!user) {
      setEntitlement(null);
      return;
    }
    void ensureEntitlement().then(setEntitlement);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { entitlement, refresh };
}
