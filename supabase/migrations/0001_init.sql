-- OpenKhata cloud mirror (Phase 2).
-- Mirrors the local Dexie schema; every row is owned by one auth user.
-- Clients generate UUIDs and timestamps; the server only guards ownership
-- (RLS) and stale writes (last-write-wins trigger on updated_at).

create table public.businesses (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz
);

create table public.contacts (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  business_id uuid not null,
  name text not null,
  phone text not null default '',
  kind text not null check (kind in ('customer', 'supplier')),
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz
);

create table public.transactions (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  business_id uuid not null,
  contact_id uuid not null,
  type text not null check (type in ('got', 'gave')),
  amount bigint not null check (amount > 0), -- poisha
  note text not null default '',
  entry_date date not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz
);

-- Pull queries filter by owner + cursor.
create index businesses_user_updated_idx on public.businesses (user_id, updated_at);
create index contacts_user_updated_idx on public.contacts (user_id, updated_at);
create index transactions_user_updated_idx on public.transactions (user_id, updated_at);

-- Last-write-wins: an upsert carrying an older updated_at than the stored
-- row is silently dropped, so a stale device can never clobber newer data.
create or replace function public.lww_guard() returns trigger
language plpgsql as $$
begin
  if new.updated_at <= old.updated_at then
    return null; -- skip the update, keep the newer row
  end if;
  new.user_id := old.user_id; -- ownership never changes
  return new;
end;
$$;

create trigger businesses_lww before update on public.businesses
  for each row execute function public.lww_guard();
create trigger contacts_lww before update on public.contacts
  for each row execute function public.lww_guard();
create trigger transactions_lww before update on public.transactions
  for each row execute function public.lww_guard();

-- Row Level Security: users only ever see and touch their own rows.
alter table public.businesses enable row level security;
alter table public.contacts enable row level security;
alter table public.transactions enable row level security;

create policy "own rows" on public.businesses
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own rows" on public.contacts
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own rows" on public.transactions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
