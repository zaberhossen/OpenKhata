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

- **Email magic link (free, default):** enabled by default — the login screen
  emails a one-click login link. Add your Site URL and `<origin>/auth/callback`
  under Dashboard → Authentication → URL Configuration (redirect allow-list).
- **Google (recommended):** Dashboard → Authentication → Providers → Google.
  Create an OAuth 2.0 **Web** client in Google Cloud, paste its Client ID +
  secret, and add the Supabase callback
  (`https://<ref>.supabase.co/auth/v1/callback`) to the Google client's
  authorized redirect URIs.
- **Phone/OTP (optional):** Dashboard → Authentication → Providers → Phone.
  Requires an SMS provider (e.g. Twilio). Kept as a secondary login option.

### Google Drive backup (optional)

Separate from cloud sync: users can snapshot their ledger to their own Drive.
Enable the **Google Drive API** in the same Google Cloud project, add the
`drive.appdata` scope on the OAuth consent screen, and set
`NEXT_PUBLIC_GOOGLE_CLIENT_ID` (the Web client ID) in `.env.local`. Without it
the Drive backup controls stay hidden.

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
