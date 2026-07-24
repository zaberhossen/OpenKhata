-- SaaS phase — cloud-backup entitlements (monetization).
-- One row per auth user records whether they're on the free plan or the paid
-- "cloud" plan (and whether that's trialing / active / expired). Modeled on
-- 0004_referrals.sql: read-own via RLS, but every write goes through a
-- SECURITY DEFINER function so the client can NEVER self-grant a paid plan.
--
-- The `provider`/`provider_ref` columns are the seam for a future payment
-- provider (SSLCommerz / bKash / Stripe); they stay null until billing is
-- wired. Until then the operator grants access manually via grant_cloud().

create table public.entitlements (
  user_id uuid primary key references auth.users (id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'cloud')),
  status text not null default 'none'
    check (status in ('none', 'trialing', 'active', 'expired', 'canceled')),
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  provider text, -- null now; later 'sslcommerz' | 'bkash' | 'stripe'
  provider_ref text, -- external subscription/customer id, null now
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.entitlements enable row level security;

-- Read-own only. There is deliberately NO insert/update policy for
-- `authenticated`, so the anon/publishable client cannot write this table at
-- all — the only way in is a SECURITY DEFINER function below. That is what
-- makes the entitlement trustworthy.
create policy "read own entitlement" on public.entitlements
  for select using (user_id = auth.uid());

-- Create the caller's entitlement (default free/none) if missing; return it.
create or replace function public.ensure_entitlement()
  returns public.entitlements
  language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  e public.entitlements;
begin
  if me is null then
    raise exception 'not authenticated';
  end if;

  select * into e from public.entitlements where user_id = me;
  if found then
    return e;
  end if;

  insert into public.entitlements (user_id)
    values (me)
    returning * into e;
  return e;
end;
$$;

-- Start the 14-day free trial of the cloud plan. The ONLY self-service write.
-- Allowed exactly once: only when the caller has never had a plan
-- (status = 'none'), which prevents restarting the trial repeatedly. If the
-- caller is already trialing/active/expired/canceled, their row is returned
-- unchanged (idempotent, no error).
create or replace function public.start_cloud_trial()
  returns public.entitlements
  language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  e public.entitlements;
begin
  if me is null then
    raise exception 'not authenticated';
  end if;

  -- Make sure a row exists first.
  select * into e from public.entitlements where user_id = me;
  if not found then
    insert into public.entitlements (user_id) values (me) returning * into e;
  end if;

  if e.status = 'none' then
    update public.entitlements
      set plan = 'cloud',
          status = 'trialing',
          trial_ends_at = now() + interval '14 days',
          updated_at = now()
      where user_id = me
      returning * into e;
  end if;

  return e;
end;
$$;

-- Whether the caller currently has cloud access. Computed SERVER-SIDE (server
-- now()), so a device with a wrong clock can't extend a trial. This is what the
-- sync engine checks before pushing/pulling.
create or replace function public.is_cloud_active()
  returns boolean
  language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.entitlements
    where user_id = auth.uid()
      and (
        status = 'active'
        or (status = 'trialing' and trial_ends_at > now())
      )
  );
$$;

-- Manual / future-PSP activation seam. Marks a target user as paid until
-- `until`. NOT granted to `authenticated` — only the operator (service_role)
-- may call it, from the dashboard SQL editor today or from the billing webhook
-- later. Keeping the grant logic here means the webhook is just
-- "verify signature -> call this one RPC".
create or replace function public.grant_cloud(target uuid, until timestamptz)
  returns public.entitlements
  language plpgsql security definer set search_path = public as $$
declare
  e public.entitlements;
begin
  insert into public.entitlements (user_id, plan, status, current_period_end)
    values (target, 'cloud', 'active', until)
  on conflict (user_id) do update
    set plan = 'cloud',
        status = 'active',
        current_period_end = excluded.current_period_end,
        updated_at = now()
    returning * into e;
  return e;
end;
$$;

grant execute on function public.ensure_entitlement() to authenticated;
grant execute on function public.start_cloud_trial() to authenticated;
grant execute on function public.is_cloud_active() to authenticated;
-- grant_cloud is intentionally NOT granted to authenticated; service_role only.
