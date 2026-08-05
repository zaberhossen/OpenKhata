import type { Contact, LedgerEntry } from "./db";
import { formatTaka } from "./money";
import { formatDate } from "./dates";
import {
  PAYMENT_METHODS,
  paymentMethodLabel,
  type PaymentMethod,
} from "./payments";

export type RangePreset = "today" | "week" | "month" | "all";

export interface DateRange {
  from: string | null; // YYYY-MM-DD inclusive, null = open
  to: string | null; // YYYY-MM-DD inclusive, null = open
}

/** Compute a preset range relative to a given "today" (YYYY-MM-DD). */
export function presetRange(preset: RangePreset, today: string): DateRange {
  if (preset === "all") return { from: null, to: null };
  if (preset === "today") return { from: today, to: today };

  const [y, m, d] = today.split("-").map(Number);
  const base = new Date(Date.UTC(y, m - 1, d));
  const iso = (dt: Date) => dt.toISOString().slice(0, 10);

  if (preset === "week") {
    const start = new Date(base);
    start.setUTCDate(start.getUTCDate() - 6); // last 7 days incl. today
    return { from: iso(start), to: today };
  }
  // month: first of the current month → today
  return { from: `${today.slice(0, 7)}-01`, to: today };
}

export function inRange(date: string, range: DateRange): boolean {
  if (range.from && date < range.from) return false;
  if (range.to && date > range.to) return false;
  return true;
}

export interface ReportSummary {
  totalGot: number; // poisha received (পেলাম)
  totalGave: number; // poisha given out (দিলাম)
  net: number; // gave - got; >0 means net receivable grew
  count: number;
}

export function summarize(entries: LedgerEntry[]): ReportSummary {
  let totalGot = 0;
  let totalGave = 0;
  for (const e of entries) {
    if (e.type === "got") totalGot += e.amount;
    else totalGave += e.amount;
  }
  return {
    totalGot,
    totalGave,
    net: totalGave - totalGot,
    count: entries.length,
  };
}

export interface MethodBreakdownRow {
  method: PaymentMethod;
  label: string;
  got: number; // poisha received via this method
  gave: number; // poisha given via this method
}

/**
 * Money grouped by payment method (Phase 4). Untagged entries are skipped —
 * this answers "how much came in via bKash vs cash", not the full total.
 * Only methods actually used appear, in PAYMENT_METHODS order.
 */
export function breakdownByMethod(
  entries: LedgerEntry[],
): MethodBreakdownRow[] {
  const totals = new Map<PaymentMethod, { got: number; gave: number }>();
  for (const e of entries) {
    if (!e.payment_method) continue;
    const row = totals.get(e.payment_method) ?? { got: 0, gave: 0 };
    if (e.type === "got") row.got += e.amount;
    else row.gave += e.amount;
    totals.set(e.payment_method, row);
  }
  return PAYMENT_METHODS.filter((m) => totals.has(m.value)).map((m) => ({
    method: m.value,
    label: m.label,
    ...totals.get(m.value)!,
  }));
}

export interface TrendBucket {
  /** YYYY-MM-DD for daily buckets, YYYY-MM for monthly ones. */
  key: string;
  /** Short axis label ("১৯", "জুলাই"). */
  label: string;
  /** Full label for the tooltip readout. */
  fullLabel: string;
  got: number; // poisha received in this bucket
  gave: number; // poisha given out in this bucket
}

const monthFormatter = new Intl.DateTimeFormat("bn-BD", { month: "short" });
const monthYearFormatter = new Intl.DateTimeFormat("bn-BD", {
  month: "long",
  year: "numeric",
});
const dayFormatter = new Intl.NumberFormat("bn-BD");

function addDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

/**
 * Entries bucketed into a continuous time series for the trend chart.
 *
 * Empty buckets are kept: a bar chart over time whose gaps are closed up
 * silently squeezes quiet days out of existence and makes activity look
 * steadier than it was. Short ranges bucket by day, "সব" by month — 400 daily
 * bars in a phone-width chart is noise, not a trend.
 */
export function trendBuckets(
  entries: LedgerEntry[],
  range: DateRange,
): TrendBucket[] {
  const dates = entries.map((e) => e.entry_date).sort();
  const from = range.from ?? dates[0];
  const to = range.to ?? dates[dates.length - 1];
  if (!from || !to || from > to) return [];

  // ~10 weeks of daily bars is the most a phone-width chart carries.
  const spanDays =
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) /
    86400000;
  const monthly = spanDays > 70;

  const buckets = new Map<string, TrendBucket>();
  const makeBucket = (key: string): TrendBucket => {
    const [y, m, d] = `${key}${monthly ? "-01" : ""}`.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    return {
      key,
      label: monthly ? monthFormatter.format(dt) : dayFormatter.format(d),
      fullLabel: monthly ? monthYearFormatter.format(dt) : formatDate(key),
      got: 0,
      gave: 0,
    };
  };

  // Seed every bucket in the span so gaps render as gaps.
  if (monthly) {
    let [y, m] = from.split("-").map(Number);
    const end = to.slice(0, 7);
    for (let key = from.slice(0, 7); key <= end; key = `${y}-${pad(m)}`) {
      buckets.set(key, makeBucket(key));
      if (++m > 12) {
        m = 1;
        y++;
      }
    }
  } else {
    for (let day = from; day <= to; day = addDays(day, 1)) {
      buckets.set(day, makeBucket(day));
    }
  }

  for (const e of entries) {
    const key = monthly ? e.entry_date.slice(0, 7) : e.entry_date;
    const bucket = buckets.get(key);
    if (!bucket) continue; // outside the range — already filtered, but be safe
    if (e.type === "got") bucket.got += e.amount;
    else bucket.gave += e.amount;
  }

  return Array.from(buckets.values()).sort((a, b) =>
    a.key.localeCompare(b.key),
  );
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Build a CSV (with Bangla-friendly UTF-8 BOM) of the given entries. */
export function toCsv(
  entries: LedgerEntry[],
  contactName: (id: string) => string,
): string {
  const header = ["তারিখ", "নাম", "ধরন", "টাকা", "মাধ্যম", "বিবরণ"];
  const rows = [...entries]
    .sort(
      (a, b) =>
        a.entry_date.localeCompare(b.entry_date) ||
        a.created_at.localeCompare(b.created_at),
    )
    .map((e) => [
      e.entry_date,
      contactName(e.contact_id),
      e.type === "gave" ? "দিলাম" : "পেলাম",
      (e.amount / 100).toFixed(2),
      paymentMethodLabel(e.payment_method),
      e.note,
    ]);
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const body = [header, ...rows]
    .map((row) => row.map((cell) => escape(String(cell))).join(","))
    .join("\r\n");
  return `﻿${body}`; // BOM so Excel reads Bangla correctly
}

/** Trigger a client-side file download (no server, works offline). */
export function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Human-readable label for the active range (for report headings / filenames). */
export function rangeLabel(range: DateRange): string {
  if (!range.from && !range.to) return "সব সময়";
  if (range.from && range.to && range.from === range.to)
    return formatDate(range.from);
  const from = range.from ? formatDate(range.from) : "শুরু";
  const to = range.to ? formatDate(range.to) : "আজ";
  return `${from} – ${to}`;
}

export type { Contact };
export { formatTaka };
