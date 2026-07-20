"use client";

import { useEffect } from "react";
import { initSync } from "@/lib/sync";

export function SyncProvider() {
  useEffect(() => {
    initSync();
  }, []);

  return null;
}
