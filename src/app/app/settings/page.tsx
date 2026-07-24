"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { isSyncConfigured } from "@/lib/supabase";
import { signOutKeepingData } from "@/lib/sync";
import { useAuthUser } from "@/hooks/use-sync";
import { useContactsWithBalances } from "@/hooks/use-ledger";
import { formatTaka } from "@/lib/money";
import { Check, Wallet, Heart } from "lucide-react";
import { PaymentAccountsForm } from "@/components/ledger/payment-accounts-form";
import { DriveBackup } from "@/components/ledger/drive-backup";
import { BackupChoice } from "@/components/ledger/backup-choice";
import { ReferralCard } from "@/components/ledger/referral-card";
import {
  notificationPermission,
  requestNotificationPermission,
  showLocalNotification,
} from "@/lib/notify";
import { BackLink } from "@/components/ledger/shared";

const DONATE_URL = process.env.NEXT_PUBLIC_DONATE_URL;

export default function SettingsPage() {
  const { user } = useAuthUser();
  const ledger = useContactsWithBalances();
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
        <BackLink href="/app" />
        <h1 className="text-lg font-bold">সেটিংস ও ব্যাকআপ</h1>
      </header>

      <main className="flex flex-1 flex-col gap-4 py-2">
        {!isSyncConfigured() ? (
          <>
            <section className="rounded-2xl border border-dashed border-border p-4 text-sm text-text-muted">
              এই ডিপ্লয়মেন্টে ক্লাউড ব্যাকআপ কনফিগার করা নেই। আপনার সব ডেটা এই
              ফোনেই আছে এবং অ্যাপ পুরোপুরি কাজ করে। চাইলে নিচ থেকে নিজের Google
              Drive-এ ব্যাকআপ নিতে পারেন।
            </section>
            <DriveBackup />
          </>
        ) : user ? (
          <>
            <section className="rounded-2xl border border-border bg-surface p-4">
              <h2 className="text-sm text-text-muted">অ্যাকাউন্ট</h2>
              <p className="mt-1 font-semibold">
                {user.phone || user.email || user.id}
              </p>
              <p className="mt-1 text-sm text-text-muted">
                ব্যাকআপ পদ্ধতি বেছে নিন — ফোন হারালেও খাতা ফিরে পাবেন।
              </p>
            </section>

            <BackupChoice />

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
            href="/app/login"
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
            <p className="mt-1 flex items-center gap-1 text-sm text-got">
              <Check size={15} aria-hidden />
              চালু আছে — অ্যাপ খুললে বাকির সারাংশ দেখাবে।
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

        <ReferralCard />

        {DONATE_URL && (
          <a
            href={DONATE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-tap items-center justify-center gap-2 rounded-2xl border border-primary font-bold text-primary hover:bg-primary-light"
          >
            <Heart size={18} aria-hidden />
            ওপেনখাতাকে সহায়তা করুন
          </a>
        )}

        <section className="rounded-2xl border border-border bg-surface p-4">
          <h2 className="text-sm text-text-muted">পেমেন্ট নম্বর (QR)</h2>
          <p className="mt-1 text-sm text-text-muted">
            আপনার বিকাশ/নগদ নম্বর যোগ করুন। &quot;টাকা নিন&quot; পাতায় QR ও
            নম্বর দেখিয়ে কাস্টমারের কাছ থেকে টাকা নিতে পারবেন।
          </p>
          <PaymentAccountsForm />
          <Link
            href="/app/collect"
            className="mt-3 flex min-h-tap items-center justify-center gap-2 rounded-2xl bg-primary font-bold text-white shadow-lg hover:bg-primary-dark"
          >
            <Wallet size={18} aria-hidden />
            টাকা নিন (QR দেখান)
          </Link>
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
