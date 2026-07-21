"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { isSyncConfigured } from "@/lib/supabase";
import { signOutKeepingData, syncNow } from "@/lib/sync";
import { useAuthUser, useSyncStatus } from "@/hooks/use-sync";
import { useContactsWithBalances } from "@/hooks/use-ledger";
import { formatTaka } from "@/lib/money";
import {
  notificationPermission,
  requestNotificationPermission,
  showLocalNotification,
} from "@/lib/notify";
import { BackLink } from "@/components/ledger/shared";

const STATE_LABELS: Record<string, string> = {
  disabled: "ক্লাউড ব্যাকআপ কনফিগার করা নেই",
  signedOut: "লগইন করা নেই",
  offline: "অফলাইন — নেট ফিরলে সিংক হবে",
  syncing: "সিংক হচ্ছে…",
  pending: "কিছু পরিবর্তন ব্যাকআপের অপেক্ষায়",
  error: "সিংকে সমস্যা হয়েছে — আবার চেষ্টা করুন",
  synced: "সব ডেটা ব্যাকআপ হয়ে আছে ✓",
};

function formatTimestamp(iso: string): string {
  return new Intl.DateTimeFormat("bn-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export default function SettingsPage() {
  const { user } = useAuthUser();
  const status = useSyncStatus();
  const ledger = useContactsWithBalances();
  const [busy, setBusy] = useState(false);
  const [perm, setPerm] = useState<string>("default");

  useEffect(() => {
    setPerm(notificationPermission());
  }, []);

  async function enableReminders() {
    const result = await requestNotificationPermission();
    setPerm(result);
    if (result === "granted") {
      const receivable = ledger?.totals.receivable ?? 0;
      await showLocalNotification(
        "ওপেনখাতা রিমাইন্ডার",
        receivable > 0
          ? `আপনি মোট ${formatTaka(receivable)} পাবেন। বাকি কাস্টমারদের রিমাইন্ডার পাঠাতে পারেন।`
          : "রিমাইন্ডার চালু হলো। বাকি জমলে এখানে সারাংশ দেখাবে।",
      );
    }
  }

  async function backupNow() {
    if (busy) return;
    setBusy(true);
    await syncNow();
    setBusy(false);
  }

  async function logout() {
    if (
      !window.confirm(
        "লগআউট করবেন? খাতার ডেটা এই ফোনে থেকে যাবে, কিন্তু ব্যাকআপ বন্ধ থাকবে।",
      )
    ) {
      return;
    }
    await signOutKeepingData();
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-4">
      <header className="flex items-center gap-2 py-3">
        <BackLink href="/" />
        <h1 className="text-lg font-bold">সেটিংস ও ব্যাকআপ</h1>
      </header>

      <main className="flex flex-1 flex-col gap-4 py-2">
        <section className="rounded-2xl border border-border bg-surface p-4">
          <h2 className="text-sm text-text-muted">ব্যাকআপ অবস্থা</h2>
          <p className="mt-1 font-semibold">{STATE_LABELS[status.state]}</p>
          {status.pendingCount > 0 && (
            <p className="mt-1 text-sm text-text-muted">
              অপেক্ষমাণ পরিবর্তন: {status.pendingCount}টি
            </p>
          )}
          {status.lastSyncAt && (
            <p className="mt-1 text-sm text-text-muted">
              শেষ ব্যাকআপ: {formatTimestamp(status.lastSyncAt)}
            </p>
          )}
        </section>

        {!isSyncConfigured() ? (
          <section className="rounded-2xl border border-dashed border-border p-4 text-sm text-text-muted">
            এই ডিপ্লয়মেন্টে Supabase কনফিগার করা হয়নি, তাই ক্লাউড ব্যাকআপ
            বন্ধ। আপনার সব ডেটা এই ফোনেই আছে এবং অ্যাপ পুরোপুরি কাজ করে। সেটআপ:
            রিপোর <code>supabase/README.md</code>
          </section>
        ) : user ? (
          <>
            <section className="rounded-2xl border border-border bg-surface p-4">
              <h2 className="text-sm text-text-muted">অ্যাকাউন্ট</h2>
              <p className="mt-1 font-semibold">
                {user.phone || user.email || user.id}
              </p>
              <p className="mt-1 text-sm text-text-muted">
                একই অ্যাকাউন্টে অন্য ফোনে লগইন করলেই খাতা সেখানে চলে আসবে।
              </p>
            </section>

            <button
              type="button"
              onClick={backupNow}
              disabled={busy || status.state === "offline"}
              className="flex min-h-tap items-center justify-center rounded-2xl bg-primary text-lg font-bold text-white shadow-lg hover:bg-primary-dark disabled:opacity-40"
            >
              {busy || status.state === "syncing"
                ? "ব্যাকআপ হচ্ছে…"
                : "এখনই ব্যাকআপ করুন"}
            </button>

            <button
              type="button"
              onClick={logout}
              className="min-h-tap rounded-2xl border border-gave font-semibold text-gave hover:bg-gave-light"
            >
              লগআউট
            </button>
          </>
        ) : (
          <Link
            href="/login"
            className="flex min-h-tap items-center justify-center rounded-2xl bg-primary text-lg font-bold text-white shadow-lg hover:bg-primary-dark"
          >
            লগইন করে ব্যাকআপ চালু করুন
          </Link>
        )}

        <section className="rounded-2xl border border-border bg-surface p-4">
          <h2 className="text-sm text-text-muted">রিমাইন্ডার নোটিফিকেশন</h2>
          {perm === "unsupported" ? (
            <p className="mt-1 text-sm text-text-muted">
              এই ব্রাউজারে নোটিফিকেশন সমর্থিত নয়।
            </p>
          ) : perm === "granted" ? (
            <p className="mt-1 text-sm text-got">
              চালু আছে ✓ — অ্যাপ খুললে বাকির সারাংশ দেখাবে।
            </p>
          ) : perm === "denied" ? (
            <p className="mt-1 text-sm text-text-muted">
              বন্ধ আছে। ব্রাউজার সেটিংস থেকে অনুমতি দিলে চালু হবে।
            </p>
          ) : (
            <>
              <p className="mt-1 text-sm text-text-muted">
                অ্যাপ খুললে বাকির সারাংশ মনে করিয়ে দেবে।
              </p>
              <button
                type="button"
                onClick={enableReminders}
                className="mt-3 min-h-tap w-full rounded-2xl border border-primary font-semibold text-primary hover:bg-primary-light"
              >
                রিমাইন্ডার চালু করুন
              </button>
            </>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-surface p-4 text-sm text-text-muted">
          <p>
            ওপেনখাতা অফলাইন-ফার্স্ট: নেট থাকুক বা না থাকুক, খাতা সবসময় কাজ করে।
            ব্যাকআপ চালু থাকলে নেট ফেরার সাথে সাথে পরিবর্তনগুলো নিজে থেকেই
            ক্লাউডে জমা হয়।
          </p>
        </section>
      </main>
    </div>
  );
}
