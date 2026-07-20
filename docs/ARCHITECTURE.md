# Architecture — offline-first sync

This doc explains how OpenKhata keeps a fully-offline ledger and still syncs
to the cloud. It's the part of the codebase contributors ask about most.

## The golden rule

**IndexedDB is the source of truth for the UI.** Every screen reads and
writes the local Dexie database only (`src/lib/db.ts`, `src/lib/repo.ts`).
The network is never on the critical path — sync happens in the background
and the app behaves identically with or without it.

## Data model

Three synced tables: `businesses`, `contacts`, `transactions`. Every record
carries:

| Field                     | Why                                                                                    |
| ------------------------- | -------------------------------------------------------------------------------------- |
| `id` (UUIDv4)             | Client-generated, so records can be created offline with no coordination               |
| `created_at`/`updated_at` | ISO strings; `updated_at` drives conflict resolution                                   |
| `deleted_at`              | Soft delete — deletions are just updates, so they propagate through sync like any edit |

Amounts are integer poisha (1 ৳ = 100 poisha) — no floating-point drift.

## Local write path

```
UI → repo.ts function → Dexie transaction:
                          1. write the record
                          2. put an outbox entry {id: "table:recordId", queued_at}
```

The outbox entry is written **in the same transaction** as the data, so a
change can never exist without its pending-push marker. Repeated edits to the
same record collapse into one outbox entry (same key), which always pushes
the record's _latest_ state.

Pulled remote changes are applied straight to the tables (not via repo.ts),
so they never re-enter the outbox and can't ping-pong between devices.

## Sync engine (`src/lib/sync.ts`)

All entry points funnel into `syncNow()`, which is serialized (a call during
a running sync schedules exactly one follow-up):

- **Login** (`SIGNED_IN` / `INITIAL_SESSION` auth events)
- **Reconnect** (browser `online` event)
- **Local writes** — a Dexie `liveQuery` on the outbox count, debounced 2s
- **Interval** — every 60s while the app is open
- **Manual** — the "এখনই ব্যাকআপ করুন" button in settings

Each run: **push all, then pull all.**

### Push

For each table, read outbox entries → load the current records → `upsert` to
Supabase. Outbox entries are deleted only if `queued_at` is unchanged — if
the user edited the record while the request was in flight, the newer entry
stays queued.

### Pull

Per-table cursor (`meta["pull_cursor:<table>"]`) holding the highest
`updated_at` seen. Pull pages of rows `> cursor` ordered by `updated_at`,
apply each one **only if newer than the local copy**, advance the cursor to
the last row's `updated_at` (server timestamps only — client clocks never
touch the cursor).

### Conflict resolution: last-write-wins, enforced twice

- **Server side:** a `BEFORE UPDATE` trigger (`lww_guard()` in
  `supabase/migrations/0001_init.sql`) silently drops upserts whose
  `updated_at` is older than the stored row. A stale device can't clobber
  newer data.
- **Client side:** pulled rows are applied only when
  `remote.updated_at > local.updated_at`.

LWW on `updated_at` is deliberately simple (roadmap Phase 2). Its known
trade-off: two devices editing the same record offline → the later edit wins,
the earlier one is lost. Acceptable for a single-owner ledger; revisit if
multi-staff editing (Phase 5) lands.

### Security

Supabase Row Level Security restricts every table to `user_id = auth.uid()`,
and the LWW trigger pins `user_id` on update. The client never sends
`user_id`; the column defaults to `auth.uid()` on insert.

## Auth

Supabase OTP auth — phone (SMS, needs a provider configured) or email (free,
default-on; good for development). Sessions persist in localStorage, so the
signed-in state survives restarts and works offline. Logout keeps local data
on the device and clears the pull cursors, so a different account's login
starts a clean pull.

## PWA / offline shell

Screens are **static routes with query params** (`/contact?id=…`) instead of
dynamic segments — every screen's HTML shell is prerendered at build time and
precached by the service worker (`public/sw.js`), so any deep link works
offline. Navigations are network-first with `ignoreSearch` cache fallback;
hashed build assets and fonts are cache-first. The Bangla font is committed
to the repo — no build-time or runtime dependency on Google Fonts.
