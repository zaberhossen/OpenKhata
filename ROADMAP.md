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

- [ ] IndexedDB layer via **Dexie.js** — schema: `contacts`, `transactions`, `businesses`
- [ ] Client-generated UUID + `created_at`/`updated_at` প্রতিটা record-এ (future sync-এর জন্য এখনই)
- [ ] Customer/Supplier list — add, edit, search
- [ ] Transaction entry — got (পেলাম) / gave (দিলাম), amount, note, date
- [ ] Per-contact balance auto-calculation (দেনা/পাওনা)
- [ ] Running total / overall business balance
- [ ] Transaction history per contact
- [ ] Fast-entry UX — ২-৩ tap-এ একটা entry (এটা aladaভাবে polish করা)
- [ ] Full Bangla UI + number formatting (৳, বাংলা সংখ্যা optional)

**Exit criteria:** নেট বন্ধ করে পুরো bookkeeping করা যায়, refresh-এও ডেটা থাকে।

---

## Phase 2 — Auth, Cloud Sync & Backup (Week 5–7)

Local ডেটাকে cloud-এর সাথে জোড়া দেওয়া — ফোন হারালেও ডেটা থাকে।

- [ ] Phone/OTP auth (Supabase Auth) — email নয়, এই userbase-এ phone-ই natural
- [ ] Postgres schema (mirror of local) + Row Level Security
- [ ] **Sync engine** — offline queue, push on reconnect, pull on login
- [ ] Conflict resolution — last-write-wins দিয়ে শুরু (`updated_at` ভিত্তিক)
- [ ] Sync status indicator (synced / pending / offline)
- [ ] Manual "backup now" + auto background sync
- [ ] Multi-device — একই account একাধিক ফোনে

**Exit criteria:** ফোন A-তে entry → ফোন B-তে login করলে ডেটা আসে। Offline entry পরে sync হয়।

---

## Phase 3 — Reminders, Reports & Sharing (Week 8–10)

এখানেই product "just a ledger" থেকে "business tool" হয়।

- [ ] Transaction share — WhatsApp / SMS-এ লেনদেনের detail পাঠানো (deep link দিয়ে শুরু, free)
- [ ] Payment reminder — বাকি কাস্টমারকে reminder পাঠানো
- [ ] Web Push notification (PWA) — নিজের reminder/summary
- [ ] Reports — daily/weekly/monthly summary, profit-loss overview
- [ ] Date-range filter + export (CSV / PDF)
- [ ] Per-contact statement generate + share

**Exit criteria:** এক ট্যাপে কাস্টমারকে reminder পাঠানো যায়, মাসিক report দেখা যায়।

**Note:** automated SMS gateway (bulk) খরচসাপেক্ষ — v1-এ device-এর native SMS/WhatsApp deep link ব্যবহার করাই free ও smart।

---

## Phase 4 — Payments (later, optional, heavy) (Week 11+)

সবচেয়ে কঠিন অংশ — PSP/bank integration লাগে, individual/OSS scope-এ সীমাবদ্ধ।

- [ ] **Step 1 (easy):** "Record payment manually" — cash/bKash/Nagad কোন মাধ্যমে পেল, শুধু tag করা
- [ ] **Step 2:** QR — static merchant QR দেখানো (নিজের bKash/Nagad number)
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

## Open-Source Health (চলমান, সব phase জুড়ে)

একটা repo শুধু কোড না — community ধরে রাখতে হয়।

- [ ] Clear `README` with screenshots + live demo link
- [x] `CONTRIBUTING.md` + `CODE_OF_CONDUCT.md`
- [ ] "good first issue" label করা issue তৈরি রাখা
- [ ] Architecture doc — offline sync কীভাবে কাজ করে (contributor-দের জন্য কঠিন অংশ)
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
