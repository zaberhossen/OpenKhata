"use client";

import { useEffect } from "react";
import { getSupabase, isSyncConfigured } from "@/lib/supabase";
import {
  capturePendingRef,
  ensureProfile,
  redeemPendingRef,
} from "@/lib/referral";

/**
 * Global, render-nothing watcher (mounted once in the root layout). Captures a
 * `?ref=` code on any page, and — once the user is signed in — ensures their
 * profile exists and redeems a pending referral.
 */
export function ReferralWatcher() {
  useEffect(() => {
    capturePendingRef();
    if (!isSyncConfigured()) return;

    const supabase = getSupabase();

    async function onSignedIn() {
      await ensureProfile();
      await redeemPendingRef();
    }

    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) void onSignedIn();
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") void onSignedIn();
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return null;
}
