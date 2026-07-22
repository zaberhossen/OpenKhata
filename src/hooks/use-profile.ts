"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuthUser } from "@/hooks/use-sync";
import { ensureProfile, type Profile } from "@/lib/referral";

/**
 * The signed-in user's referral profile (code + invite count). Undefined while
 * loading, null when signed out or sync is unconfigured.
 */
export function useProfile(): {
  profile: Profile | null | undefined;
  refresh: () => void;
} {
  const { user } = useAuthUser();
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);

  const refresh = useCallback(() => {
    if (!user) {
      setProfile(null);
      return;
    }
    void ensureProfile().then(setProfile);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { profile, refresh };
}
