# Security Policy

## Reporting a vulnerability

If you find a security issue in OpenKhata, please **do not open a public
issue**. Instead, email **zaber@10minuteschool.com** with:

- a description of the issue and its impact,
- steps to reproduce (a proof-of-concept if possible),
- any suggested fix.

We aim to acknowledge reports within a few days and will keep you updated on the
fix. Responsible disclosure is appreciated — please give us reasonable time to
patch before any public disclosure.

## Scope & data model (context for reviewers)

- The app is **offline-first**: all ledger data lives in the browser's local
  IndexedDB and never leaves the device unless the user enables backup.
- **Cloud sync** (optional) uses Supabase with per-user Row-Level Security — a
  user can only read/write their own rows.
- **Google Drive backup** (optional) uses the `drive.appdata` scope only; the
  snapshot is stored in the user's own hidden Drive app folder and never reaches
  our servers.
- Secrets are never committed. `.env.local` is git-ignored;
  `SUPABASE_SERVICE_ROLE_KEY` is server-only (never `NEXT_PUBLIC_`).

## Known, accepted limitations

- **Cloud entitlement is enforced app-level (v1).** The paid-tier gate lives in
  the client sync engine; the data-table RLS stays permissive, so the gate is a
  monetization/UX boundary, not a hard security boundary. A server-enforced RLS
  upgrade is the documented v2 path (see `ROADMAP.md`). This is intentional for
  the current audience — not a vulnerability to report.
