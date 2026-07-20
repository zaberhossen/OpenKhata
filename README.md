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

✅ **Phase 2 — Auth, Cloud Sync & Backup** is done: OTP login (phone/email via
Supabase), background sync with an offline queue, last-write-wins conflict
resolution, a live sync indicator, and manual "backup now" — on top of the
fully offline Phase 1 ledger. Cloud sync is **optional**: without
configuration the app stays 100% local. Setup:
[supabase/README.md](./supabase/README.md) · Design:
[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) · Plan:
[ROADMAP.md](./ROADMAP.md).

## Stack

| Layer     | Choice                                        |
| --------- | --------------------------------------------- |
| Framework | Next.js 14 (App Router) + TypeScript          |
| Styling   | Tailwind CSS (design tokens in `globals.css`) |
| Local DB  | Dexie.js / IndexedDB _(Phase 1)_              |
| Backend   | Supabase (Postgres + Auth) _(Phase 2)_        |
| PWA       | Web App Manifest + Service Worker             |

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
