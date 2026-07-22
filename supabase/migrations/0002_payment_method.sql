-- Phase 4, Step 1 — record payment manually.
-- Adds a nullable payment-method tag to transactions (cash/bKash/Nagad/…).
-- Nullable so every existing row and every client that hasn't upgraded yet
-- stays valid; the sync engine upserts the whole record either way.

alter table public.transactions
  add column payment_method text
    check (payment_method in ('cash', 'bkash', 'nagad', 'rocket', 'bank', 'other'));
