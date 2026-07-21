import type { Contact, LedgerEntry } from "./db";
import { formatTaka } from "./money";
import { formatDate } from "./dates";

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

/** Build a CSV (with Bangla-friendly UTF-8 BOM) of the given entries. */
export function toCsv(
  entries: LedgerEntry[],
  contactName: (id: string) => string,
): string {
  const header = ["তারিখ", "নাম", "ধরন", "টাকা", "বিবরণ"];
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
