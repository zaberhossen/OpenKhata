# ROADMAP — OpenKhata (working name)

> An open-source, offline-first, mobile-friendly PWA for small business bookkeeping —
> inspired by TallyKhata & Khatabook, but community-owned.

**Vision:** ছোট ব্যবসায়ী যেন কাগজের বাকির খাতা ছেড়ে ২-৩ tap-এ লেনদেন লিখতে পারে,
নেট ছাড়া কাজ করে, ডেটা কখনো হারায় না — সম্পূর্ণ ফ্রি ও open-source।

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind + shadcn/ui · Dexie/IndexedDB · Supabase (Postgres) · Workbox PWA

**Guiding principles**

- Offline-first, always. Network is an enhancement, not a requirement.
- Bangla-first UI, big tap targets, minimal screens.
- Scope discipline — ship ledger perfectly before touching payments.
- Every feature must work on a ₹5k Android phone with flaky 3G.

---

## Phase 0 — Foundation (Week 1)

Repo আর skeleton দাঁড় করানো। কোনো feature না, শুধু ভিত্তি।

- [x] Next.js 14 + TypeScript + Tailwind + shadcn/ui(optional) setup
- [x] ESLint + Prettier + Husky (pre-commit hooks)
- [x] Basic PWA manifest + icons + `add to home screen` working
- [x] Design tokens ঠিক করা (color, spacing, font — Bangla font e.g. Hind Siliguri / Noto Sans Bengali)
- [x] Repo hygiene: `README`, `LICENSE` (MIT/Apache-2.0), `CONTRIBUTING.md`, issue templates
- [x] CI setup (GitHub Actions — lint + typecheck + build)

**Exit criteria:** ফাঁকা কিন্তু install-able PWA, phone-এ home screen-এ বসানো যায়।

---

## Phase 1 — Core Ledger MVP, fully offline (Week 2–4)

এটাই product-এর প্রাণ। কোনো server নেই এখনো — সব local।

- [x] IndexedDB layer via **Dexie.js** — schema: `contacts`, `transactions`, `businesses`
- [x] Client-generated UUID + `created_at`/`updated_at` প্রতিটা record-এ (future sync-এর জন্য এখনই)
- [x] Customer/Supplier list — add, edit, search
- [x] Transaction entry — got (পেলাম) / gave (দিলাম), amount, note, date
- [x] Per-contact balance auto-calculation (দেনা/পাওনা)
- [x] Running total / overall business balance
- [x] Transaction history per contact
- [x] Fast-entry UX — ২-৩ tap-এ একটা entry (এটা aladaভাবে polish করা)
- [x] Full Bangla UI + number formatting (৳, বাংলা সংখ্যা optional)

**Exit criteria:** নেট বন্ধ করে পুরো bookkeeping করা যায়, refresh-এও ডেটা থাকে।

---

## Phase 2 — Auth, Cloud Sync & Backup (Week 5–7)

Local ডেটাকে cloud-এর সাথে জোড়া দেওয়া — ফোন হারালেও ডেটা থাকে।

- [x] Phone/OTP auth (Supabase Auth) — email নয়, এই userbase-এ phone-ই natural
- [x] Postgres schema (mirror of local) + Row Level Security
- [x] **Sync engine** — offline queue, push on reconnect, pull on login
- [x] Conflict resolution — last-write-wins দিয়ে শুরু (`updated_at` ভিত্তিক)
- [x] Sync status indicator (synced / pending / offline)
- [x] Manual "backup now" + auto background sync
- [x] Multi-device — একই account একাধিক ফোনে

**Exit criteria:** ফোন A-তে entry → ফোন B-তে login করলে ডেটা আসে। Offline entry পরে sync হয়।

---

## Phase 3 — Reminders, Reports & Sharing (Week 8–10)

এখানেই product "just a ledger" থেকে "business tool" হয়।

- [x] Transaction share — WhatsApp / SMS-এ লেনদেনের detail পাঠানো (deep link দিয়ে শুরু, free)
- [x] Payment reminder — বাকি কাস্টমারকে reminder পাঠানো
- [~] Web Push notification (PWA) — নিজের reminder/summary _(local notification চালু; background push পরে — push server লাগে)_
- [x] Reports — daily/weekly/monthly summary, profit-loss overview
- [x] Date-range filter + export (CSV / PDF — print-to-PDF)
- [x] Per-contact statement generate + share

**Exit criteria:** এক ট্যাপে কাস্টমারকে reminder পাঠানো যায়, মাসিক report দেখা যায়।

**Note:** automated SMS gateway (bulk) খরচসাপেক্ষ — v1-এ device-এর native SMS/WhatsApp deep link ব্যবহার করাই free ও smart।

---

## Phase 4 — Payments (later, optional, heavy) (Week 11+)

সবচেয়ে কঠিন অংশ — PSP/bank integration লাগে, individual/OSS scope-এ সীমাবদ্ধ।

- [x] **Step 1 (easy):** "Record payment manually" — cash/bKash/Nagad কোন মাধ্যমে পেল, শুধু tag করা
- [x] **Step 2:** QR — static merchant QR দেখানো (নিজের bKash/Nagad number)
- [ ] **Step 3 (advanced):** bKash/Nagad merchant API integration — payment auto-confirm
- [ ] Payment reconciliation with ledger entries

**Reality check:** live bank/MFS money movement-এর জন্য license/compliance লাগে যা এই project একা handle করবে না। Manual recording + QR display দিয়েই ৯০% value পাওয়া যায়।

---

## Phase 5 — Growth Features (backlog / community-driven)

Core stable হলে তারপর, অথবা contributor-দের জন্য open:

- [ ] Inventory / stock management
- [ ] Multi-business (একজনের একাধিক দোকান)
- [ ] Business analytics dashboard
- [ ] Multi-language (English + অন্যান্য)
- [ ] Digital storefront (Khatabook-এর "MyStore" ধাঁচে)
- [ ] Staff/multi-user access with roles
- [ ] Loan eligibility view (partner-driven, অনেক পরে)

---

## Growth & Polish (post-v1, চলমান)

Core ledger stable — এখন adoption ও পরিচিতির কাজ:

- [x] Promotional landing page (`/`) — app টা `/app`-এ সরানো হয়েছে
- [x] আইকন লাইব্রেরি (lucide-react) — emoji বদলে consistent UI
- [x] Auth: Google sign-in + email magic link (phone OTP secondary)
- [x] Google Drive ব্যাকআপ — user-owned full snapshot (Supabase sync-এর পাশাপাশি)
- [x] রেফারেল সিস্টেম — share code + "সমর্থক" ব্যাজ (cosmetic)

---

## SaaS / Monetization (চলমান)

OpenKhata এখন একটি **hosted SaaS** — যে কেউ `open-khata.vercel.app`-এ গিয়ে PWA
ইনস্টল করে সাথে সাথে ব্যবহার শুরু করতে পারে, **লগইন ছাড়াই** (সব ডেটা লোকাল)।
লগইন শুধু **ব্যাকআপের জন্য**। লগইনের পর user একটি ব্যাকআপ গন্তব্য বেছে নেয়।

**Guiding invariant:** যে user কখনো লগইন করে না, তার আচরণে কোনো পরিবর্তন হয় না —
প্রতিটি নতুন gate additive ও `isSyncConfigured()`-এর মতো short-circuit করে।

- [x] **A — Donate + positioning:** external donate লিংক (`NEXT_PUBLIC_DONATE_URL`,
      landing + সেটিংস), landing-এ "লোকাল ফ্রি · ক্লাউড ঐচ্ছিক" framing।
- [x] **B — Entitlement backend:** `0005_entitlements.sql` — per-user row, read-own
      RLS, সব write `SECURITY DEFINER` RPC দিয়ে (`ensure_entitlement`,
      `start_cloud_trial` = ১৪ দিন trial, server-computed `is_cloud_active`,
      operator-only `grant_cloud`)। Client: `src/lib/entitlement.ts`,
      `src/hooks/use-entitlement.ts`।
- [x] **C — Sync gate + mutual exclusion:** `syncNow()` শুধু চলে যখন
      destination = cloud **এবং** entitlement active (server RPC, cached ~60s)।
      Trial শেষ হলে নিজে থেকেই থেমে যায়, লোকাল ডেটা অটুট। Drive vs Cloud একটি
      `backup_destination` meta key দিয়ে mutually exclusive
      (`src/lib/backup-choice.ts`)।
- [x] **D — Backup-choice UX:** `src/components/ledger/backup-choice.tsx` —
      লগইনের পর "নিজের Google Drive (ফ্রি)" বনাম "ওপেনখাতা ক্লাউড (পেইড, ট্রায়াল)"
      chooser; trial countdown / expired state।
- [ ] **E — Payment provider (DEFERRED):** billing webhook
      `src/app/api/billing/webhook/route.ts` + server-only
      `src/lib/supabase-admin.ts` (`SUPABASE_SERVICE_ROLE_KEY`) →
      একই `grant_cloud` RPC কল করবে। এখন provider বেছে নেওয়া হয়নি
      (SSLCommerz / bKash / Stripe); ততক্ষণ operator manually `grant_cloud` দিয়ে
      access দেয়।

**Trust boundary (v1 → v2):** v1-এ entitlement **app-level** enforced — data-table
RLS (`0001_init.sql`) permissive থাকে, তাই sync gate একটি
UX/monetization gate, hard security boundary নয়। এই audience-এ গ্রহণযোগ্য।
**v2 (deferred):** `is_cloud_active(auth.uid())` কে data-table RLS-এর
`using`/`with check`-এ ঢুকিয়ে server-enforced করা।

---

## Open-Source Health (চলমান, সব phase জুড়ে)

একটা repo শুধু কোড না — community ধরে রাখতে হয়।

- [ ] Clear `README` with screenshots + live demo link
- [x] `CONTRIBUTING.md` + `CODE_OF_CONDUCT.md`
- [ ] "good first issue" label করা issue তৈরি রাখা
- [x] Architecture doc — offline sync কীভাবে কাজ করে (contributor-দের জন্য কঠিন অংশ)
- [ ] Demo deployment (Vercel) — seed data সহ, যাতে কেউ instantly try করতে পারে
- [ ] Changelog + semver release
- [ ] Discussions/Discord for community

---

## Success Metrics (কীভাবে বুঝবে কাজ হচ্ছে)

| দিক         | Target                                              |
| ----------- | --------------------------------------------------- |
| Offline     | নেট ছাড়া ১০০% core feature কাজ করে                 |
| Speed       | নতুন transaction entry ≤ ৩ tap, < ১ সেকেন্ড         |
| Load        | Lighthouse PWA score ≥ 90, first load < ৩s on 3G    |
| Reliability | কোনো data loss নেই, sync conflict gracefully handle |
| Community   | Phase 3 নাগাদ প্রথম external contributor            |

---

## Suggested Order of Attack

```
Phase 0 → Phase 1 → Phase 2 → (public launch as v0.1)
                              → Phase 3 → (v0.2)
                              → Phase 4/5 → community-driven
```

**Golden rule:** Phase 1 আর 2 perfect না হওয়া পর্যন্ত Phase 3-এ যেয়ো না।
একটা bug-free offline ledger + reliable backup — এটুকুই ইতিমধ্যে অনেক ব্যবসায়ীর কাছে
কাগজের খাতার চেয়ে ভালো।
