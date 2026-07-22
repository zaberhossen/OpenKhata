-- Phase 4, Step 2 — static merchant QR / payment numbers.
-- Stores the merchant's own payment accounts on their business so they sync
-- across devices. Shape: [{ "method": "bkash", "number": "017..." }, ...].
-- Nullable, defaults null, so existing rows and older clients stay valid.

alter table public.businesses
  add column payment_accounts jsonb;
