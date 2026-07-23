"use client";

import { useEffect } from "react";
import { isDriveConfigured } from "@/lib/gdrive";
import { runAutoBackup } from "@/lib/drive-auto";

const CHECK_INTERVAL_MS = 30 * 60 * 1000; // re-check every 30 min while open

/**
 * Render-nothing watcher (mounted once in the root layout). Drives the
 * WhatsApp-style automatic Google Drive backup: attempts a silent backup on
 * mount, when the tab regains focus, when connectivity returns, and on a slow
 * interval while the app stays open. Every call is silent (no popups) and a
 * cheap no-op unless a backup is actually due — see `runAutoBackup`.
 */
export function DriveAutoBackup() {
  useEffect(() => {
    if (!isDriveConfigured()) return;

    const attempt = () => void runAutoBackup();

    attempt();
    const onVisible = () => {
      if (document.visibilityState === "visible") attempt();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", attempt);
    const timer = window.setInterval(attempt, CHECK_INTERVAL_MS);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", attempt);
      window.clearInterval(timer);
    };
  }, []);

  return null;
}
