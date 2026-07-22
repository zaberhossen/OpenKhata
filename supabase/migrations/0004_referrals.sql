-- Growth phase — referral system (cosmetic "সমর্থক" badge).
-- One profile row per auth user holds a share code and a count of successful
-- invites. Attribution runs through SECURITY DEFINER functions so a user can
-- credit a referrer without being able to touch anyone else's row directly.

create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  referral_code text unique not null,
  referred_by uuid references auth.users (id),
  referral_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Users may read and update only their own profile. Inserts go through
-- ensure_profile() (definer) so codes are generated server-side.
create policy "read own profile" on public.profiles
  for select using (user_id = auth.uid());
create policy "update own profile" on public.profiles
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Create the caller's profile (with a unique short code) if missing; return it.
create or replace function public.ensure_profile()
  returns public.profiles
  language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  p public.profiles;
  new_code text;
begin
  if me is null then
    raise exception 'not authenticated';
  end if;

  select * into p from public.profiles where user_id = me;
  if found then
    return p;
  end if;

  -- md5 of uuid + clock time, first 6 hex chars, uppercased; retry on the
  -- (rare) unique collision.
  loop
    new_code := upper(substr(md5(me::text || clock_timestamp()::text), 1, 6));
    begin
      insert into public.profiles (user_id, referral_code)
        values (me, new_code)
        returning * into p;
      return p;
    exception when unique_violation then
      -- try another code
    end;
  end loop;
end;
$$;

-- Credit `code`'s owner for referring the caller. No-op (returns false) if the
-- caller already has a referrer, the code is unknown, or it's a self-referral.
create or replace function public.redeem_referral(code text)
  returns boolean
  language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  my public.profiles;
  referrer uuid;
begin
  if me is null then
    return false;
  end if;

  select * into my from public.profiles where user_id = me;
  if not found or my.referred_by is not null then
    return false;
  end if;

  select user_id into referrer from public.profiles
    where referral_code = upper(code);
  if referrer is null or referrer = me then
    return false;
  end if;

  update public.profiles
    set referred_by = referrer, updated_at = now()
    where user_id = me;
  update public.profiles
    set referral_count = referral_count + 1, updated_at = now()
    where user_id = referrer;
  return true;
end;
$$;

grant execute on function public.ensure_profile() to authenticated;
grant execute on function public.redeem_referral(text) to authenticated;
