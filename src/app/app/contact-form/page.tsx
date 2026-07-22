"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { ContactKind } from "@/lib/db";
import { useContactLedger } from "@/hooks/use-ledger";
import { addContact, deleteContact, updateContact } from "@/lib/repo";
import { BackLink, ScreenLoading } from "@/components/ledger/shared";

const KINDS: { value: ContactKind; label: string }[] = [
  { value: "customer", label: "কাস্টমার" },
  { value: "supplier", label: "সাপ্লায়ার" },
];

function ContactFormScreen() {
  const router = useRouter();
  const editId = useSearchParams().get("id");
  const ledger = useContactLedger(editId);
  const editing = ledger?.contact ?? null;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [kind, setKind] = useState<ContactKind>("customer");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) {
      setName(editing.name);
      setPhone(editing.phone);
      setKind(editing.kind);
    }
  }, [editing]);

  if (editId && !ledger) return <ScreenLoading />;

  const valid = name.trim().length > 0;

  async function save() {
    if (!valid || saving) return;
    setSaving(true);
    if (editing) {
      await updateContact(editing.id, { name, phone, kind });
      router.replace(`/app/contact?id=${editing.id}`);
    } else {
      const id = await addContact({ name, phone, kind });
      router.replace(`/app/contact?id=${id}`);
    }
  }

  async function remove() {
    if (!editing || saving) return;
    if (
      !window.confirm(
        `"${editing.name}" এবং তার সব লেনদেন মুছে ফেলবেন? এটা ফেরানো যাবে না।`,
      )
    ) {
      return;
    }
    setSaving(true);
    await deleteContact(editing.id);
    router.replace("/app");
  }

  return (
    <>
      <header className="flex items-center gap-2 py-3">
        <BackLink href={editing ? `/contact?id=${editing.id}` : "/"} />
        <h1 className="text-lg font-bold">
          {editing ? "তথ্য সম্পাদনা" : "নতুন কাস্টমার/সাপ্লায়ার"}
        </h1>
      </header>

      <main className="flex flex-1 flex-col gap-4 py-2">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-text-muted">নাম *</span>
          {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
          <input
            autoFocus={!editing}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="যেমন: রহিম মিয়া"
            className="min-h-tap rounded-2xl border border-border bg-surface px-4 outline-none focus:border-primary"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-text-muted">ফোন নম্বর (ঐচ্ছিক)</span>
          <input
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="01XXXXXXXXX"
            className="min-h-tap rounded-2xl border border-border bg-surface px-4 outline-none focus:border-primary"
          />
        </label>

        <fieldset className="flex flex-col gap-1">
          <legend className="text-sm text-text-muted">ধরন</legend>
          <div className="grid grid-cols-2 gap-3">
            {KINDS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setKind(value)}
                aria-pressed={kind === value}
                className={`min-h-tap rounded-2xl border font-semibold ${
                  kind === value
                    ? "border-primary bg-primary-light text-primary-dark"
                    : "border-border bg-surface text-text-muted"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>

        {editing && (
          <button
            type="button"
            onClick={remove}
            className="min-h-tap rounded-2xl border border-gave font-semibold text-gave hover:bg-gave-light"
          >
            মুছে ফেলুন
          </button>
        )}
      </main>

      <div className="sticky bottom-0 bg-background/95 py-4">
        <button
          type="button"
          onClick={save}
          disabled={!valid || saving}
          className="flex min-h-tap w-full items-center justify-center rounded-2xl bg-primary text-lg font-bold text-white shadow-lg hover:bg-primary-dark disabled:opacity-40"
        >
          {saving ? "সংরক্ষণ হচ্ছে…" : "সংরক্ষণ করুন"}
        </button>
      </div>
    </>
  );
}

export default function ContactFormPage() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-4">
      <Suspense fallback={<ScreenLoading />}>
        <ContactFormScreen />
      </Suspense>
    </div>
  );
}
