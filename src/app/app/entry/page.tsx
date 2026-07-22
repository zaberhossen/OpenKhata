"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useContactLedger } from "@/hooks/use-ledger";
import { addEntry } from "@/lib/repo";
import { parseTaka } from "@/lib/money";
import { todayISODate } from "@/lib/dates";
import { PAYMENT_METHODS, type PaymentMethod } from "@/lib/payments";
import { BackLink, ScreenLoading } from "@/components/ledger/shared";

function EntryScreen() {
  const params = useSearchParams();
  const router = useRouter();
  const contactId = params.get("contact");
  const type = params.get("type") === "got" ? "got" : "gave";
  const ledger = useContactLedger(contactId);

  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [entryDate, setEntryDate] = useState(todayISODate);
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [saving, setSaving] = useState(false);

  if (!ledger) return <ScreenLoading />;
  if (!ledger.contact) {
    return (
      <div className="flex flex-1 items-center justify-center py-16 text-text-muted">
        কাস্টমার পাওয়া যায়নি
      </div>
    );
  }

  const contact = ledger.contact;
  const gave = type === "gave";
  const poisha = parseTaka(amount);
  const valid = poisha !== null && !!entryDate;

  async function save() {
    if (!valid || saving) return;
    setSaving(true);
    await addEntry({
      contactId: contact.id,
      type,
      amount: poisha!,
      note,
      entryDate,
      paymentMethod: method,
    });
    router.replace(`/app/contact?id=${contact.id}`);
  }

  return (
    <>
      <header className="flex items-center gap-2 py-3">
        <BackLink href={`/app/contact?id=${contact.id}`} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold leading-tight">
            {contact.name}
          </h1>
          <p
            className={`text-sm font-semibold ${gave ? "text-gave" : "text-got"}`}
          >
            {gave ? "দিলাম ↑ (বাকি বাড়বে)" : "পেলাম ↓ (বাকি কমবে)"}
          </p>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-4 py-2">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-text-muted">টাকার পরিমাণ *</span>
          <div
            className={`flex items-center rounded-2xl border-2 bg-surface px-4 ${
              gave ? "border-gave" : "border-got"
            }`}
          >
            <span className="text-2xl font-bold text-text-muted">৳</span>
            {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
            <input
              autoFocus
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="০"
              className="min-h-14 w-full bg-transparent px-2 text-3xl font-bold outline-none"
            />
          </div>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-text-muted">বিবরণ (ঐচ্ছিক)</span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="যেমন: চাল ২ বস্তা"
            className="min-h-tap rounded-2xl border border-border bg-surface px-4 outline-none focus:border-primary"
          />
        </label>

        <fieldset className="flex flex-col gap-1">
          <legend className="text-sm text-text-muted">
            {gave ? "কীভাবে দিলেন?" : "কীভাবে পেলেন?"} (ঐচ্ছিক)
          </legend>
          <div className="mt-1 flex flex-wrap gap-2">
            {PAYMENT_METHODS.map((m) => {
              const selected = method === m.value;
              return (
                <button
                  key={m.value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() =>
                    setMethod((cur) => (cur === m.value ? null : m.value))
                  }
                  className={`flex min-h-tap items-center gap-1.5 rounded-2xl border px-4 text-sm font-semibold ${
                    selected
                      ? "border-primary bg-primary-light text-primary-dark"
                      : "border-border bg-surface text-text-muted"
                  }`}
                >
                  <span aria-hidden>{m.icon}</span>
                  {m.label}
                </button>
              );
            })}
          </div>
        </fieldset>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-text-muted">তারিখ</span>
          <input
            type="date"
            value={entryDate}
            max={todayISODate()}
            onChange={(e) => setEntryDate(e.target.value)}
            className="min-h-tap rounded-2xl border border-border bg-surface px-4 outline-none focus:border-primary"
          />
        </label>
      </main>

      <div className="sticky bottom-0 bg-background/95 py-4">
        <button
          type="button"
          onClick={save}
          disabled={!valid || saving}
          className={`flex min-h-tap w-full items-center justify-center rounded-2xl text-lg font-bold text-white shadow-lg disabled:opacity-40 ${
            gave ? "bg-gave" : "bg-got"
          }`}
        >
          {saving ? "সংরক্ষণ হচ্ছে…" : "সংরক্ষণ করুন"}
        </button>
      </div>
    </>
  );
}

export default function EntryPage() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-4">
      <Suspense fallback={<ScreenLoading />}>
        <EntryScreen />
      </Suspense>
    </div>
  );
}
