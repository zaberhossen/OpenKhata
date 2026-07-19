"use client";

import Link from "next/link";
import { useState } from "react";
import { useContactsWithBalances } from "@/hooks/use-ledger";
import { formatTaka } from "@/lib/money";
import { BalanceAmount, ScreenLoading } from "@/components/ledger/shared";

export default function Home() {
  const [search, setSearch] = useState("");
  const data = useContactsWithBalances();

  const query = search.trim().toLowerCase();
  const filtered = data?.contacts.filter(
    (c) =>
      !query || c.name.toLowerCase().includes(query) || c.phone.includes(query),
  );

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-4 pb-24">
      <header className="flex items-center gap-3 py-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-white">
          খ
        </div>
        <div>
          <h1 className="text-lg font-bold leading-tight">ওপেনখাতা</h1>
          <p className="text-sm text-text-muted">ডিজিটাল বাকির খাতা</p>
        </div>
      </header>

      <section
        aria-label="মোট হিসাব"
        className="grid grid-cols-2 divide-x divide-border rounded-2xl border border-border bg-surface"
      >
        <div className="p-4 text-center">
          <p className="text-sm text-text-muted">মোট পাবো</p>
          <p className="text-xl font-bold text-got">
            {data ? formatTaka(data.totals.receivable) : "—"}
          </p>
        </div>
        <div className="p-4 text-center">
          <p className="text-sm text-text-muted">মোট দেবো</p>
          <p className="text-xl font-bold text-gave">
            {data ? formatTaka(data.totals.payable) : "—"}
          </p>
        </div>
      </section>

      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="নাম বা ফোন নম্বর খুঁজুন…"
        className="mt-4 min-h-tap rounded-2xl border border-border bg-surface px-4 outline-none focus:border-primary"
      />

      <main className="mt-4 flex flex-1 flex-col">
        {!data ? (
          <ScreenLoading />
        ) : filtered!.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-16 text-center">
            <span className="text-4xl">📒</span>
            <p className="font-semibold">
              {query ? "কাউকে পাওয়া যায়নি" : "খাতা এখনো ফাঁকা"}
            </p>
            {!query && (
              <p className="text-sm text-text-muted">
                নিচের বোতাম দিয়ে প্রথম কাস্টমার/সাপ্লায়ার যোগ করুন
              </p>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
            {filtered!.map((contact) => (
              <li key={contact.id}>
                <Link
                  href={`/contact?id=${contact.id}`}
                  className="flex min-h-tap items-center gap-3 px-4 py-3 hover:bg-background"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-light font-bold text-primary-dark">
                    {contact.name.charAt(0)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">
                      {contact.name}
                    </span>
                    <span className="block text-sm text-text-muted">
                      {contact.kind === "supplier" ? "সাপ্লায়ার" : "কাস্টমার"}
                      {contact.phone && ` · ${contact.phone}`}
                    </span>
                  </span>
                  <BalanceAmount balance={contact.balance} withLabel />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>

      <Link
        href="/contact-form"
        className="fixed bottom-5 left-1/2 flex min-h-tap w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center justify-center rounded-2xl bg-primary text-lg font-bold text-white shadow-lg hover:bg-primary-dark"
      >
        + নতুন কাস্টমার/সাপ্লায়ার
      </Link>

      {/* Invisible prefetch targets so every screen's chunks land in the
          service-worker cache from the first online visit (offline-first). */}
      <nav aria-hidden className="hidden">
        <Link href="/contact">contact</Link>
        <Link href="/entry">entry</Link>
        <Link href="/offline">offline</Link>
      </nav>
    </div>
  );
}
