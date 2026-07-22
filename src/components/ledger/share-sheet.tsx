"use client";

import { type ReactNode, useState } from "react";
import { nativeShare, shareTargets } from "@/lib/share";

/**
 * A bottom sheet offering the three free share channels. Opens the native
 * share sheet if the device has one; always shows WhatsApp + SMS deep links
 * as explicit fallbacks (they work even when Web Share doesn't).
 */
export function ShareSheet({
  title,
  message,
  phone,
  triggerLabel,
  triggerClassName,
}: {
  title: string;
  message: string;
  phone: string;
  triggerLabel: ReactNode;
  triggerClassName: string;
}) {
  const [open, setOpen] = useState(false);
  const targets = shareTargets(phone, message);

  return (
    <>
      <button
        type="button"
        onClick={async () => {
          // Prefer the OS share sheet; fall back to our own on failure.
          if (targets.canNativeShare && (await nativeShare(title, message))) {
            return;
          }
          setOpen(true);
        }}
        className={triggerClassName}
      >
        {triggerLabel}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-10 flex items-end justify-center bg-black/40"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-t-3xl bg-surface p-4 pb-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />
            <h2 className="mb-3 text-center font-semibold">{title}</h2>
            <div className="flex flex-col gap-3">
              <a
                href={targets.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="flex min-h-tap items-center justify-center gap-2 rounded-2xl bg-got py-3 font-bold text-white"
              >
                WhatsApp-এ পাঠান
              </a>
              <a
                href={targets.smsUrl}
                onClick={() => setOpen(false)}
                className="flex min-h-tap items-center justify-center gap-2 rounded-2xl bg-primary py-3 font-bold text-white"
              >
                SMS-এ পাঠান
              </a>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex min-h-tap items-center justify-center rounded-2xl border border-border font-semibold text-text-muted"
              >
                বাতিল
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
