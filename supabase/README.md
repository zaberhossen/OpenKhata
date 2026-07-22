# Supabase setup (Phase 2 — cloud sync & backup)

Cloud sync is **optional**. Without it, OpenKhata works fully offline with all
data on the device. With it, data is backed up to your own Supabase project
and syncs across devices.

## 1. Create a project

Create a free project at [supabase.com](https://supabase.com), then run the
migrations in `migrations/` in order (`0001_init.sql`, `0002_…`) — either paste
them into the SQL Editor (Dashboard → SQL Editor → New query) or use the CLI:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

## 2. Configure auth

- **Phone/OTP (production):** Dashboard → Authentication → Providers → Phone.
  Requires an SMS provider (e.g. Twilio); follow the Supabase docs to connect
  one.
- **Email/OTP (free, good for development):** enabled by default — no
  configuration needed. The login screen supports both.

## 3. Wire up the app

Copy `.env.example` to `.env.local` and fill in the values from
Dashboard → Settings → API:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
```

Restart the dev server. A sync indicator appears in the app header and
login/backup become available under সেটিংস (settings).

## How sync works

See [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) for the full design
(outbox queue, pull cursors, last-write-wins conflict resolution).
