"use client";

import { useState } from "react";
import { Gift, Copy, Share2, Award, Check } from "lucide-react";
import { useProfile } from "@/hooks/use-profile";
import { isSupporter, referralLink, SUPPORTER_THRESHOLD } from "@/lib/referral";
import { nativeShare } from "@/lib/share";

/** "রেফার করুন" section: share code/link + invite count + supporter badge. */
export function ReferralCard() {
  const { profile } = useProfile();
  const [copied, setCopied] = useState(false);

  // Render nothing until we have a profile (signed out / loading / no sync).
  if (!profile) return null;

  const link = referralLink(profile.referral_code);
  const count = profile.referral_count;
  const supporter = isSupporter(count);
  const shareText =
    "আমি ওপেনখাতা দিয়ে আমার দোকানের বাকির হিসাব রাখি — ফ্রি, অফলাইন ও " +
    `ওপেন-সোর্স। তুমিও ব্যবহার করে দেখো:\n${link}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard blocked — the link is on screen to copy manually
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-surface p-4">
      <h2 className="flex items-center gap-1.5 text-sm text-text-muted">
        <Gift size={15} aria-hidden />
        বন্ধুকে আমন্ত্রণ / রেফার করুন
      </h2>
      <p className="mt-1 text-sm text-text-muted">
        অন্য দোকানদারকে ওপেনখাতা চেনান। আপনার লিংকে কেউ যোগ দিলে এখানে গোনা হবে।
      </p>

      <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-background p-3">
        <span className="text-sm">
          মোট রেফার:{" "}
          <span className="text-lg font-bold text-primary">{count}</span>
        </span>
        {supporter ? (
          <span className="flex items-center gap-1 rounded-full bg-primary-light px-3 py-1 text-sm font-bold text-primary-dark">
            <Award size={15} aria-hidden />
            সমর্থক
          </span>
        ) : (
          <span className="text-xs text-text-muted">
            সমর্থক ব্যাজের জন্য আর {SUPPORTER_THRESHOLD - count}টি
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <input
          readOnly
          value={link}
          className="min-h-tap min-w-0 flex-1 rounded-2xl border border-border bg-background px-3 text-sm outline-none"
        />
        <button
          type="button"
          onClick={copy}
          aria-label="লিংক কপি করুন"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border text-primary hover:bg-primary-light"
        >
          {copied ? (
            <Check size={18} aria-hidden />
          ) : (
            <Copy size={18} aria-hidden />
          )}
        </button>
      </div>

      <button
        type="button"
        onClick={async () => {
          const shared = await nativeShare("ওপেনখাতা", shareText);
          if (!shared) void copy();
        }}
        className="mt-3 flex min-h-tap w-full items-center justify-center gap-2 rounded-2xl bg-primary font-bold text-white shadow-lg hover:bg-primary-dark"
      >
        <Share2 size={18} aria-hidden />
        শেয়ার করুন
      </button>
    </section>
  );
}
