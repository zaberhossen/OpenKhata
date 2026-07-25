"use client";

import Link from "next/link";
import { useState } from "react";
import { Wallet, Check } from "lucide-react";
import { usePaymentAccounts } from "@/hooks/use-ledger";
import { paymentMethodInfo } from "@/lib/payments";
import { BackLink, ScreenLoading } from "@/components/ledger/shared";
import { QrCode } from "@/components/ledger/qr-code";

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked (insecure context / permission) — no-op; the number
      // is on screen to type manually.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="min-h-tap shrink-0 rounded-2xl border border-border px-4 text-sm font-semibold text-primary hover:bg-primary-light"
    >
      {copied ? (
        <span className="flex items-center gap-1">
          <Check size={16} aria-hidden />
          কপি হয়েছে
        </span>
      ) : (
        "কপি করুন"
      )}
    </button>
  );
}

export default function CollectPage() {
  const accounts = usePaymentAccounts();

  return (
    <div className="mx-auto flex h-dvh max-w-md flex-col overflow-hidden px-4">
      <header className="-mx-4 flex shrink-0 items-center gap-2 border-b border-border bg-background px-4 py-3 print:hidden">
        <BackLink href="/app" />
        <h1 className="text-lg font-bold">টাকা নিন</h1>
      </header>

      {!accounts ? (
        <ScreenLoading />
      ) : accounts.length === 0 ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 overflow-y-auto py-16 text-center">
          <Wallet size={40} className="text-text-muted" aria-hidden />
          <p className="font-semibold">কোনো পেমেন্ট নম্বর যোগ করা নেই</p>
          <p className="text-sm text-text-muted">
            আপনার বিকাশ/নগদ নম্বর যোগ করলে এখানে QR দেখানো যাবে, কাস্টমার
            স্ক্যান করে টাকা পাঠাতে পারবেন।
          </p>
          <Link
            href="/app/settings"
            className="mt-2 flex min-h-tap items-center justify-center rounded-2xl bg-primary px-6 font-bold text-white shadow-lg hover:bg-primary-dark"
          >
            নম্বর যোগ করুন
          </Link>
        </div>
      ) : (
        <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto py-4">
          <p className="text-center text-sm text-text-muted">
            কাস্টমারকে QR দেখান — স্ক্যান করে অথবা নিচের নম্বরে টাকা পাঠাতে
            পারবেন।
          </p>

          {accounts.map((account) => {
            const info = paymentMethodInfo(account.method);
            return (
              <section
                key={`${account.method}-${account.number}`}
                className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface p-5"
              >
                <div className="flex items-center gap-2 text-lg font-bold">
                  {info && (
                    <info.Icon
                      size={20}
                      aria-hidden
                      style={info.color ? { color: info.color } : undefined}
                    />
                  )}
                  {info?.label ?? account.method}
                </div>
                <QrCode
                  value={account.number}
                  className="h-52 w-52 [&>svg]:h-full [&>svg]:w-full"
                />
                <div className="flex w-full items-center justify-between gap-3">
                  <span className="min-w-0 flex-1 truncate text-xl font-bold tracking-wide">
                    {account.number}
                  </span>
                  <CopyButton value={account.number} />
                </div>
              </section>
            );
          })}

          <p className="mt-1 text-center text-xs text-text-muted">
            QR-এ শুধু নম্বরটি এনকোড করা আছে। টাকা পাঠানোর পর নিজে
            &quot;পেলাম&quot; এন্ট্রি দিয়ে খাতায় লিখে রাখুন।
          </p>

          <Link
            href="/app/settings"
            className="min-h-tap rounded-2xl border border-border text-center font-semibold leading-[3rem] text-text hover:bg-background"
          >
            নম্বর সম্পাদনা করুন
          </Link>
        </main>
      )}
    </div>
  );
}
