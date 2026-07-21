"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useContactLedger } from "@/hooks/use-ledger";
import { deleteEntry } from "@/lib/repo";
import { formatTaka } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { reminderMessage, statementMessage } from "@/lib/share";
import {
  BackLink,
  BalanceAmount,
  ScreenLoading,
} from "@/components/ledger/shared";
import { ShareSheet } from "@/components/ledger/share-sheet";

function ContactScreen() {
  const contactId = useSearchParams().get("id");
  const ledger = useContactLedger(contactId);

  if (!ledger) {
    return <ScreenLoading />;
  }
  if (!ledger.contact) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
        <p className="font-semibold">কাস্টমার পাওয়া যায়নি</p>
        <Link href="/" className="text-primary underline underline-offset-2">
          তালিকায় ফিরে যান
        </Link>
      </div>
    );
  }

  const { contact, entries, balance } = ledger;

  return (
    <>
      <header className="flex items-center gap-2 py-3">
        <BackLink href="/" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold leading-tight">
            {contact.name}
          </h1>
          <p className="text-sm text-text-muted">
            {contact.kind === "supplier" ? "সাপ্লায়ার" : "কাস্টমার"}
            {contact.phone && ` · ${contact.phone}`}
          </p>
        </div>
        <Link
          href={`/contact-form?id=${contact.id}`}
          className="flex min-h-tap items-center rounded-full px-4 text-sm font-semibold text-primary hover:bg-primary-light"
        >
          সম্পাদনা
        </Link>
      </header>

      <section className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4">
        <span className="text-text-muted">
          {balance > 0
            ? "পাবো (উনি দেবেন)"
            : balance < 0
              ? "দেবো (আমি দেবো)"
              : "হিসাব সমান"}
        </span>
        <span className="text-xl">
          <BalanceAmount balance={balance} />
        </span>
      </section>

      {entries.length > 0 && (
        <section className="mt-3 grid grid-cols-2 gap-3">
          {balance > 0 && (
            <ShareSheet
              title={`${contact.name}-কে রিমাইন্ডার`}
              message={reminderMessage(contact, balance)}
              phone={contact.phone}
              triggerLabel="🔔 রিমাইন্ডার পাঠান"
              triggerClassName="flex min-h-tap items-center justify-center rounded-2xl border border-primary font-semibold text-primary hover:bg-primary-light"
            />
          )}
          <ShareSheet
            title={`${contact.name} — হিসাব`}
            message={statementMessage(contact, entries, balance)}
            phone={contact.phone}
            triggerLabel="📤 হিসাব শেয়ার"
            triggerClassName={`flex min-h-tap items-center justify-center rounded-2xl border border-border font-semibold text-text hover:bg-background ${
              balance > 0 ? "" : "col-span-2"
            }`}
          />
        </section>
      )}

      <main className="mt-4 flex flex-1 flex-col pb-28">
        {entries.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-16 text-center">
            <span className="text-4xl">🧾</span>
            <p className="font-semibold">এখনো কোনো লেনদেন নেই</p>
            <p className="text-sm text-text-muted">
              নিচের দিলাম/পেলাম বোতাম দিয়ে শুরু করুন
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
            {entries.map((entry) => (
              <li key={entry.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-text-muted">
                    {formatDate(entry.entry_date)}
                  </p>
                  {entry.note && <p className="truncate">{entry.note}</p>}
                </div>
                <span
                  className={`font-semibold ${
                    entry.type === "gave" ? "text-gave" : "text-got"
                  }`}
                >
                  {entry.type === "gave" ? "দিলাম" : "পেলাম"}{" "}
                  {formatTaka(entry.amount)}
                </span>
                <button
                  type="button"
                  aria-label="লেনদেন মুছুন"
                  onClick={() => {
                    if (window.confirm("এই লেনদেনটি মুছে ফেলবেন?")) {
                      void deleteEntry(entry.id);
                    }
                  }}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-muted hover:bg-gave-light hover:text-gave"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>

      <div className="fixed bottom-0 left-1/2 grid w-full max-w-md -translate-x-1/2 grid-cols-2 gap-3 bg-background/95 p-4">
        <Link
          href={`/entry?contact=${contact.id}&type=gave`}
          className="flex min-h-tap items-center justify-center rounded-2xl bg-gave py-3 text-lg font-bold text-white shadow-lg hover:opacity-90"
        >
          দিলাম ↑
        </Link>
        <Link
          href={`/entry?contact=${contact.id}&type=got`}
          className="flex min-h-tap items-center justify-center rounded-2xl bg-got py-3 text-lg font-bold text-white shadow-lg hover:opacity-90"
        >
          পেলাম ↓
        </Link>
      </div>
    </>
  );
}

export default function ContactPage() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-4">
      <Suspense fallback={<ScreenLoading />}>
        <ContactScreen />
      </Suspense>
    </div>
  );
}
