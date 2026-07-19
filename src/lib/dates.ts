const dateFormatter = new Intl.DateTimeFormat("bn-BD", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

/** Today's date in the user's timezone as YYYY-MM-DD (for <input type=date>). */
export function todayISODate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** "2026-07-19" → "১৯ জুলাই, ২০২৬" */
export function formatDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  return dateFormatter.format(new Date(y, m - 1, d));
}
