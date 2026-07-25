# ওপেনখাতা · OpenKhata

> **ছোট ব্যবসার জন্য ফ্রি ও ওপেন-সোর্স ডিজিটাল বাকির খাতা** — নেট ছাড়াই চলে, ডেটা কখনো হারায় না।
>
> An open-source, offline-first, mobile-friendly PWA for small business bookkeeping —
> inspired by TallyKhata & Khatabook, but community-owned.

## কেন? (Why?)

বাংলাদেশ ও দক্ষিণ এশিয়ার লাখো ছোট দোকানদার এখনো কাগজের খাতায় বাকির হিসাব রাখেন।
বিদ্যমান অ্যাপগুলো proprietary, বিজ্ঞাপন-ভরা, আর ডেটা lock-in করে রাখে।
OpenKhata-র লক্ষ্য: **২-৩ ট্যাপে লেনদেন এন্ট্রি, সম্পূর্ণ অফলাইনে, সম্পূর্ণ ফ্রি** — এবং কোডটা সবার।

## Guiding principles

- **Offline-first, always.** Network is an enhancement, not a requirement.
- **Bangla-first UI** — big tap targets, minimal screens.
- **Scope discipline** — ship the ledger perfectly before touching payments.
- Every feature must work on a cheap Android phone with flaky 3G.

## Status

✅ A working, installable PWA now running as a **hosted SaaS** at
[open-khata.vercel.app](https://open-khata.vercel.app). Anyone can install it and
start using it immediately — **no login required, all data local**.

On top of the offline Phase 1 ledger, Phase 2 cloud sync, and Phase 3
reminders/reports/sharing, the app has: manual payment-method tagging + static
merchant QR ("টাকা নিন"); a landing page at `/` with the app under `/app`;
Google sign-in + email magic-link auth; a referral "সমর্থক" badge; a Donate
link; and a PWA install banner.

### Backup — the user's choice

Login is needed **only for backup**. After signing in, the user picks one
destination (see [`backup-choice.ts`](./src/lib/backup-choice.ts)):

- **Own Google Drive** — free forever, user-owned (hidden `appDataFolder`).
- **OpenKhata Cloud** — Supabase sync across devices, gated behind an
  **entitlement** (14-day free trial, then a paid plan). A payment provider is
  not wired yet; access is granted manually via `grant_cloud` until then. See
  [`0005_entitlements.sql`](./supabase/migrations/0005_entitlements.sql).

Cloud sync, Google login, and Drive backup are all **optional** — without
configuration the app is 100% local and fully offline. Setup:
[supabase/README.md](./supabase/README.md) · Design:
[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) · Plan:
[ROADMAP.md](./ROADMAP.md) · Google verification:
[docs/GOOGLE_VERIFICATION.md](./docs/GOOGLE_VERIFICATION.md).

## Stack

| Layer     | Choice                                              |
| --------- | --------------------------------------------------- |
| Framework | Next.js 14 (App Router) + TypeScript                |
| Styling   | Tailwind CSS (design tokens in `globals.css`)       |
| Local DB  | Dexie.js / IndexedDB _(source of truth, on-device)_ |
| Backend   | Supabase (Postgres + Auth + RLS) _(optional cloud)_ |
| Icons     | lucide-react + react-icons (brand marks)            |
| PWA       | Web App Manifest + hand-rolled Service Worker       |

## Getting started

```bash
git clone https://github.com/zaberhossen/OpenKhata.git
cd OpenKhata
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The service worker only
registers in production builds — to test offline/install behaviour:

```bash
npm run build && npm run start
```

### Configuration (optional)

The app runs fully offline with **no configuration**. To enable login + cloud
features, copy `.env.example` to `.env.local` and fill in the values:

- `NEXT_PUBLIC_SUPABASE_URL` + a Supabase key — login & OpenKhata Cloud backup.
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` — Google Drive backup (see
  [supabase/README.md](./supabase/README.md)).
- `NEXT_PUBLIC_DONATE_URL` — the Donate button (Ko-fi / bKash link).
- `SUPABASE_SERVICE_ROLE_KEY` — **server-only**, for the future billing webhook.

`.env.local` is git-ignored — never commit real keys.

### Useful scripts

| Command                  | What it does                              |
| ------------------------ | ----------------------------------------- |
| `npm run dev`            | Dev server                                |
| `npm run build`          | Production build                          |
| `npm run lint`           | ESLint                                    |
| `npm run typecheck`      | TypeScript check (`tsc --noEmit`)         |
| `npm run format`         | Prettier write                            |
| `npm run generate:icons` | Regenerate PWA icons (zero-dep generator) |

Pre-commit hooks (Husky + lint-staged) run ESLint and Prettier on staged files
automatically.

## Contributing

Contributions are very welcome — especially from developers who know this
problem space firsthand. Read [CONTRIBUTING.md](./CONTRIBUTING.md) to get
started, and check the [ROADMAP.md](./ROADMAP.md) for what's being built next.

## License

[MIT](./LICENSE) — free forever, for everyone.
