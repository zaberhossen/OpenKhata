"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { formatTaka } from "@/lib/money";
import { Logo } from "@/components/brand/logo";

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
      className="flex min-h-tap min-w-tap items-center justify-center rounded-full hover:bg-border/50"
    >
      <ArrowLeft size={22} aria-hidden />
    </Link>
  );
}

export function ScreenLoading() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-20 text-text-muted">
      <Logo className="h-12 w-12 animate-pulse" />
      লোড হচ্ছে…
    </div>
  );
}
