"use client";

import { BackLink, ScreenLoading } from "@/components/ledger/shared";
import { TrendChart } from "@/components/ledger/trend-chart";
import { useAllData } from "@/hooks/use-all-data";
import { todayISODate } from "@/lib/dates";
import { formatTaka } from "@/lib/money";
import {
  breakdownByMethod,
  downloadFile,
  inRange,
  presetRange,
  rangeLabel,
  summarize,
  toCsv,
  trendBuckets,
  type RangePreset,
} from "@/lib/reports";
import { Download, Printer } from "lucide-react";
import { useMemo, useState } from "react";

const PRESETS: { value: RangePreset; label: string }[] = [
  { value: "today", label: "আজ" },
  { value: "week", label: "৭ দিন" },
  { value: "month", label: "এ মাস" },
  { value: "all", label: "সব" },
];

export default function ReportsPage() {
  const [preset, setPreset] = useState<RangePreset>("month");
  const data = useAllData();
  const today = todayISODate();
  const range = useMemo(() => presetRange(preset, today), [preset, today]);

  const filtered = useMemo(
    () => data?.entries.filter((e) => inRange(e.entry_date, range)) ?? [],
    [data, range],
  );
  const summary = useMemo(() => summarize(filtered), [filtered]);
  const byMethod = useMemo(() => breakdownByMethod(filtered), [filtered]);
  const buckets = useMemo(
    () => trendBuckets(filtered, range),
    [filtered, range],
  );

  // Per-contact net within the range, biggest receivable first.
  const perContact = useMemo(() => {
    if (!data) return [];
    const byContact = new Map<string, number>();
    for (const e of filtered) {
      const sign = e.type === "gave" ? 1 : -1;
      byContact.set(
        e.contact_id,
        (byContact.get(e.contact_id) ?? 0) + sign * e.amount,
      );
    }
    return Array.from(byContact.entries())
      .map(([id, net]) => ({
        name: data.contactsById.get(id)?.name ?? "—",
        net,
      }))
      .sort((a, b) => b.net - a.net);
  }, [data, filtered]);

  function exportCsv() {
    if (!data) return;
    const csv = toCsv(filtered, (id) => data.contactsById.get(id)?.name ?? "");
    downloadFile(`openkhata-${preset}.csv`, csv, "text/csv;charset=utf-8");
  }

  if (!data) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col px-4">
        <ScreenLoading />
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-dvh max-w-md flex-col overflow-hidden px-4">
      <header className="-mx-4 flex shrink-0 items-center gap-2 border-b border-border bg-background px-4 py-3 print:hidden">
        <BackLink href="/app" />
        <h1 className="text-lg font-bold">রিপোর্ট</h1>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto pb-8 pt-4 print:overflow-visible">
        <div
          className="mb-4 grid grid-cols-4 gap-2 print:hidden"
          role="tablist"
          aria-label="সময়সীমা"
        >
          {PRESETS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={preset === value}
              onClick={() => setPreset(value)}
              className={`min-h-tap rounded-2xl border text-sm font-semibold ${
                preset === value
                  ? "border-primary bg-primary-light text-primary-dark"
                  : "border-border bg-surface text-text-muted"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <p className="mb-3 text-center text-sm text-text-muted">
          {rangeLabel(range)} · {summary.count}টি লেনদেন
        </p>

        <section className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border bg-surface p-4 text-center">
            <p className="text-sm text-text-muted">পেলাম (মোট)</p>
            <p className="text-lg font-bold text-got">
              {formatTaka(summary.totalGot)}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-4 text-center">
            <p className="text-sm text-text-muted">দিলাম (মোট)</p>
            <p className="text-lg font-bold text-gave">
              {formatTaka(summary.totalGave)}
            </p>
          </div>
        </section>

        <section className="mt-3 rounded-2xl border border-border bg-surface p-4 text-center">
          <p className="text-sm text-text-muted">এই সময়ে নিট বাকির পরিবর্তন</p>
          <p
            className={`text-2xl font-bold ${
              summary.net > 0
                ? "text-got"
                : summary.net < 0
                  ? "text-gave"
                  : "text-text-muted"
            }`}
          >
            {summary.net >= 0 ? "+" : "−"}
            {formatTaka(Math.abs(summary.net))}
          </p>
          <p className="mt-1 text-xs text-text-muted">
            দিলাম − পেলাম (বাড়লে পাওনা বেড়েছে)
          </p>
        </section>

        <TrendChart buckets={buckets} />

        {perContact.length > 0 && (
          <section className="mt-4">
            <h2 className="mb-2 text-sm font-semibold text-text-muted">
              কাস্টমার অনুযায়ী
            </h2>
            <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
              {perContact.map((row) => (
                <li
                  key={row.name}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <span className="truncate">{row.name}</span>
                  <span
                    className={`font-semibold ${
                      row.net > 0
                        ? "text-got"
                        : row.net < 0
                          ? "text-gave"
                          : "text-text-muted"
                    }`}
                  >
                    {row.net >= 0 ? "+" : "−"}
                    {formatTaka(Math.abs(row.net))}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {byMethod.length > 0 && (
          <section className="mt-4">
            <h2 className="mb-2 text-sm font-semibold text-text-muted">
              মাধ্যম অনুযায়ী
            </h2>
            <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
              {byMethod.map((row) => (
                <li
                  key={row.method}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <span className="truncate">{row.label}</span>
                  <span className="flex shrink-0 items-center gap-3 text-sm font-semibold">
                    {row.got > 0 && (
                      <span className="text-got">
                        পেলাম {formatTaka(row.got)}
                      </span>
                    )}
                    {row.gave > 0 && (
                      <span className="text-gave">
                        দিলাম {formatTaka(row.gave)}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="mt-6 grid grid-cols-2 gap-3 print:hidden">
          <button
            type="button"
            onClick={exportCsv}
            disabled={filtered.length === 0}
            className="flex min-h-tap items-center justify-center gap-2 rounded-2xl border border-border font-semibold text-text hover:bg-background disabled:opacity-40"
          >
            <Download size={18} aria-hidden />
            CSV
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            disabled={filtered.length === 0}
            className="flex min-h-tap items-center justify-center gap-2 rounded-2xl border border-border font-semibold text-text hover:bg-background disabled:opacity-40"
          >
            <Printer size={18} aria-hidden />
            প্রিন্ট / PDF
          </button>
        </div>
      </div>
    </div>
  );
}
