"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, Plus, X } from "lucide-react";
import { usePaymentAccounts } from "@/hooks/use-ledger";
import { setPaymentAccounts } from "@/lib/repo";
import {
  ACCOUNT_METHODS,
  normalizeAccounts,
  paymentMethodInfo,
  type PaymentAccount,
} from "@/lib/payments";

/**
 * Edit the merchant's payment accounts (Phase 4, Step 2). Rows are held in
 * local state and committed on "সংরক্ষণ" so a half-typed number never syncs.
 *
 * Each row is one bordered field (brand mark → method → number → remove) rather
 * than three separate controls, and "সংরক্ষণ" only appears while there are
 * unsaved edits — that keeps the settings card down to a single loud button.
 */
export function PaymentAccountsForm() {
  const stored = usePaymentAccounts();
  const [rows, setRows] = useState<PaymentAccount[] | null>(null);

  // Seed local rows from the DB once it has loaded.
  useEffect(() => {
    if (stored && rows === null) setRows(stored);
  }, [stored, rows]);

  // Compared after normalization so a freshly added blank row doesn't read as
  // an unsaved edit. The live query re-emits after a save, clearing this.
  const dirty = useMemo(
    () =>
      rows !== null &&
      JSON.stringify(normalizeAccounts(rows)) !== JSON.stringify(stored ?? []),
    [rows, stored],
  );

  if (rows === null) {
    return <p className="mt-1 text-sm text-text-muted">লোড হচ্ছে…</p>;
  }

  function update(index: number, patch: Partial<PaymentAccount>) {
    setRows((cur) =>
      (cur ?? []).map((r, i) => (i === index ? { ...r, ...patch } : r)),
    );
  }

  function addRow() {
    setRows((cur) => [
      ...(cur ?? []),
      { method: ACCOUNT_METHODS[0].value, number: "" },
    ]);
  }

  function removeRow(index: number) {
    setRows((cur) => (cur ?? []).filter((_, i) => i !== index));
  }

  async function save() {
    await setPaymentAccounts(rows ?? []);
  }

  return (
    <div className="mt-3 flex flex-col gap-2">
      {rows.length === 0 && (
        <p className="text-sm text-text-muted">
          বিকাশ/নগদ নম্বর যোগ করলে &quot;টাকা নিন&quot; পাতায় QR দেখানো যাবে।
        </p>
      )}

      {rows.map((row, i) => {
        const info = paymentMethodInfo(row.method);
        return (
          <div
            key={i}
            className="flex items-center gap-2 rounded-2xl border border-border bg-surface pl-3 pr-1 focus-within:border-primary"
          >
            <div className="relative flex shrink-0 items-center gap-1.5">
              {info && (
                <info.Icon
                  size={17}
                  aria-hidden
                  style={info.color ? { color: info.color } : undefined}
                />
              )}
              <select
                aria-label="মাধ্যম"
                value={row.method}
                onChange={(e) =>
                  update(i, {
                    method: e.target.value as PaymentAccount["method"],
                  })
                }
                className="min-h-tap appearance-none bg-transparent pr-4 text-sm font-semibold outline-none"
              >
                {ACCOUNT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={13}
                aria-hidden
                className="pointer-events-none absolute right-0 text-text-muted"
              />
            </div>

            <span className="h-5 w-px shrink-0 bg-border" aria-hidden />

            <input
              inputMode="numeric"
              value={row.number}
              onChange={(e) => update(i, { number: e.target.value })}
              placeholder="নম্বর"
              aria-label={`${info?.label ?? ""} নম্বর`}
              className="min-h-tap min-w-0 flex-1 bg-transparent outline-none"
            />

            <button
              type="button"
              aria-label="মুছুন"
              onClick={() => removeRow(i)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-text-muted hover:bg-gave-light hover:text-gave"
            >
              <X size={16} aria-hidden />
            </button>
          </div>
        );
      })}

      <div className="mt-1 flex min-h-9 items-center justify-between gap-2">
        <button
          type="button"
          onClick={addRow}
          className="-ml-2 flex items-center gap-1 rounded-full px-2 py-1.5 text-sm font-semibold text-primary hover:bg-primary-light"
        >
          <Plus size={16} aria-hidden />
          নম্বর যোগ করুন
        </button>

        {dirty ? (
          <button
            type="button"
            onClick={save}
            className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-dark"
          >
            সংরক্ষণ
          </button>
        ) : (
          rows.length > 0 && (
            <span className="flex items-center gap-1 pr-1 text-sm text-got">
              <Check size={15} aria-hidden />
              সংরক্ষিত
            </span>
          )
        )}
      </div>
    </div>
  );
}
