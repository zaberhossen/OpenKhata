/**
 * Amounts are stored as integer poisha (1 taka = 100 poisha) so balances
 * never accumulate floating-point drift. These helpers convert between the
 * stored integer and what the user types/sees.
 */

const BANGLA_DIGITS: Record<string, string> = {
  "০": "0",
  "১": "1",
  "২": "2",
  "৩": "3",
  "৪": "4",
  "৫": "5",
  "৬": "6",
  "৭": "7",
  "৮": "8",
  "৯": "9",
};

// Whole taka shows no decimals (৳৫০০); anything with poisha always shows
// two (৳৩৪৯.৫০, never ৳৩৪৯.৫) — trailing zeros matter for money.
const wholeFormatter = new Intl.NumberFormat("bn-BD", {
  maximumFractionDigits: 0,
});
const fractionFormatter = new Intl.NumberFormat("bn-BD", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** "১২৩.৫" / "123.5" → 12350 poisha. Returns null for invalid or ≤ 0. */
export function parseTaka(input: string): number | null {
  const normalized = input
    .trim()
    .replace(/[০-৯]/g, (d) => BANGLA_DIGITS[d])
    .replace(/[,৳\s]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const poisha = Math.round(parseFloat(normalized) * 100);
  if (!Number.isSafeInteger(poisha) || poisha <= 0) return null;
  return poisha;
}

/** 12350 → "৳১২৩.৫০" (Bangla numerals via bn-BD locale). */
export function formatTaka(poisha: number): string {
  const formatter = poisha % 100 === 0 ? wholeFormatter : fractionFormatter;
  return `৳${formatter.format(poisha / 100)}`;
}
