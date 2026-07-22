"use client";

import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { usePaymentAccounts } from "@/hooks/use-ledger";
import { setPaymentAccounts } from "@/lib/repo";
import { ACCOUNT_METHODS, type PaymentAccount } from "@/lib/payments";

/**
 * Edit the merchant's payment accounts (Phase 4, Step 2). Rows are held in
 * local state and committed on "সংরক্ষণ" so a half-typed number never syncs.
 */
export function PaymentAccountsForm() {
  const stored = usePaymentAccounts();
  const [rows, setRows] = useState<PaymentAccount[] | null>(null);
  const [saved, setSaved] = useState(false);

  // Seed local rows from the DB once it has loaded.
  useEffect(() => {
    if (stored && rows === null) setRows(stored);
  }, [stored, rows]);

  if (rows === null) {
    return <p className="mt-1 text-sm text-text-muted">লোড হচ্ছে…</p>;
  }

  function update(index: number, patch: Partial<PaymentAccount>) {
    setRows((cur) =>
      (cur ?? []).map((r, i) => (i === index ? { ...r, ...patch } : r)),
    );
    setSaved(false);
  }

  function addRow() {
    setRows((cur) => [
      ...(cur ?? []),
      { method: ACCOUNT_METHODS[0].value, number: "" },
    ]);
    setSaved(false);
  }

  function removeRow(index: number) {
    setRows((cur) => (cur ?? []).filter((_, i) => i !== index));
    setSaved(false);
  }

  async function save() {
    await setPaymentAccounts(rows ?? []);
    setSaved(true);
  }

  return (
    <div className="mt-3 flex flex-col gap-3">
      {rows.length === 0 && (
        <p className="text-sm text-text-muted">
          বিকাশ/নগদ নম্বর যোগ করলে &quot;টাকা নিন&quot; পাতায় QR দেখানো যাবে।
        </p>
      )}

      {rows.map((row, i) => (
        <div key={i} className="flex items-center gap-2">
          <select
            aria-label="মাধ্যম"
            value={row.method}
            onChange={(e) =>
              update(i, { method: e.target.value as PaymentAccount["method"] })
            }
            className="min-h-tap rounded-2xl border border-border bg-surface px-3 outline-none focus:border-primary"
          >
            {ACCOUNT_METHODS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          <input
            inputMode="numeric"
            value={row.number}
            onChange={(e) => update(i, { number: e.target.value })}
            placeholder="নম্বর"
            className="min-h-tap min-w-0 flex-1 rounded-2xl border border-border bg-surface px-3 outline-none focus:border-primary"
          />
          <button
            type="button"
            aria-label="মুছুন"
            onClick={() => removeRow(i)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-text-muted hover:bg-gave-light hover:text-gave"
          >
            <X size={16} aria-hidden />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addRow}
        className="min-h-tap rounded-2xl border border-dashed border-border font-semibold text-text-muted hover:bg-background"
      >
        + নম্বর যোগ করুন
      </button>

      <button
        type="button"
        onClick={save}
        className="flex min-h-tap items-center justify-center gap-1.5 rounded-2xl border border-primary font-semibold text-primary hover:bg-primary-light"
      >
        {saved ? (
          <>
            <Check size={18} aria-hidden />
            সংরক্ষিত
          </>
        ) : (
          "সংরক্ষণ করুন"
        )}
      </button>
    </div>
  );
}
