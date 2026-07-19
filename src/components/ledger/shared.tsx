"use client";

import Link from "next/link";
import { formatTaka } from "@/lib/money";

/** Colored amount with the পাবো/দেবো label implied by sign. */
export function BalanceAmount({
  balance,
  withLabel = false,
}: {
  balance: number;
  withLabel?: boolean;
}) {
  if (balance === 0) {
    return (
      <span className="font-semibold text-text-muted">{formatTaka(0)}</span>
    );
  }
  const receivable = balance > 0;
  return (
    <span className={`font-semibold ${receivable ? "text-got" : "text-gave"}`}>
      {formatTaka(Math.abs(balance))}
      {withLabel && (
        <span className="ml-1 text-sm font-normal">
          {receivable ? "পাবো" : "দেবো"}
        </span>
      )}
    </span>
  );
}

export function BackLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      aria-label="ফিরে যান"
      className="flex min-h-tap min-w-tap items-center justify-center rounded-full text-2xl hover:bg-border/50"
    >
      ←
    </Link>
  );
}

export function ScreenLoading() {
  return (
    <div className="flex flex-1 items-center justify-center py-20 text-text-muted">
      লোড হচ্ছে…
    </div>
  );
}
