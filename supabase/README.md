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

> **Two different callbacks — don't mix them up.** The browser hops
> app → Supabase → Google → **Supabase** → **app**, so:
>
> - **Google Cloud's** "Authorized redirect URI" is the **Supabase** callback:
>   `https://<ref>.supabase.co/auth/v1/callback` (just this one — Google talks to
>   Supabase, not to your app, so no localhost needed here).
> - **Supabase's** "Redirect URLs" allow-list holds your **app** callback(s):
>   `http://localhost:3000/auth/callback` and
>   `https://<your-domain>/auth/callback`. These must match the app's
>   `redirectTo` exactly — a missing entry is the #1 cause of
>   "redirect not allowed".

- **Email magic link (free, default):** enabled by default — the login screen
  emails a one-click login link. Add your Site URL and the app callback(s) above
  under Dashboard → Authentication → URL Configuration (redirect allow-list).
- **Google (recommended):**
  1. Google Cloud → APIs & Services → **OAuth consent screen** (External; add
     your email as a Test user while unpublished).
  2. → **Credentials** → Create OAuth client ID → Application type **Web**.
     Authorized redirect URI = the Supabase callback above. (Optionally add
     `http://localhost:3000` and your prod origin as Authorized JavaScript
     origins.) Copy the Client ID + secret.
  3. Supabase → Authentication → **Providers → Google**: toggle on, paste the
     Client ID + secret, save.
  4. Supabase → Authentication → **URL Configuration**: set the **Site URL** and
     add both app callbacks to **Redirect URLs**.
- **Phone/OTP (optional):** Dashboard → Authentication → Providers → Phone.
  Requires an SMS provider (e.g. Twilio). Kept as a secondary login option.

### Google Drive backup (optional)

Separate from cloud sync: each user snapshots their own ledger to their own
Google Drive (hidden `appDataFolder`). It's **automatic, WhatsApp-style** —
connect once under সেটিংস and the app backs up on its own **while it's open**
(Daily by default; Off/Weekly selectable), and on a new device connecting
detects the existing backup and offers to restore. A browser can't back up while
fully closed, so this is "whenever the app is open, at most once per interval",
not an OS-scheduled job.

Setup (you can **reuse the Google login Web OAuth client**):

1. Enable the **Google Drive API** in the same Google Cloud project.
2. On that Web OAuth client, add your app origins under **Authorized JavaScript
   origins** (`http://localhost:3000` and your prod origin). This popup/token
   flow uses **JS origins, not redirect URIs** — a missing origin is the usual
   breakage.
3. OAuth consent screen → add the `drive.appdata` scope. It's a **sensitive**
   scope: for public users you must publish + get the consent screen **verified**
   (until then only Test users can back up).
4. Set `NEXT_PUBLIC_GOOGLE_CLIENT_ID=<web client id>.apps.googleusercontent.com`
   in `.env.local` and restart. Without it the Drive section stays hidden.

## 3. Wire up the app

Copy `.env.example` to `.env.local` and fill in the values from
Dashboard → Settings → API. Use **either** the new publishable key or the
legacy anon key (both authenticate the browser client — the app accepts either,
see `src/lib/supabase.ts`):

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
# New API keys (recommended):
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
# …or legacy:
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

> `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is **only** for the optional Google Drive
> backup feature (below) — it is **not** used for Google _login_, which is
> configured entirely in the Supabase dashboard. Leave it empty unless you want
> Drive backup.

Restart the dev server (`NEXT_PUBLIC_*` is inlined at build time). A sync
indicator appears in the app header and login/backup become available under
সেটিংস (settings).

## How sync works

See [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) for the full design
(outbox queue, pull cursors, last-write-wins conflict resolution).
