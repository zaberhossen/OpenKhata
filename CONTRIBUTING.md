# Contributing to OpenKhata

ধন্যবাদ! Thanks for your interest in contributing. OpenKhata is community-owned —
every contribution, from a typo fix to a sync engine, matters.

## Ground rules

- Check [ROADMAP.md](./ROADMAP.md) first. We ship phases in order and guard
  scope tightly — a great PR for a Phase 3 feature will wait if Phase 1 isn't
  solid yet.
- Every feature must work **offline** and on a **cheap Android phone over
  flaky 3G**. If your change needs a network round-trip on the critical path,
  rethink it.
- UI text is **Bangla-first**. English translations live alongside, not
  instead.

## Getting set up

```bash
git clone https://github.com/zaberhossen/OpenKhata.git
cd OpenKhata
npm install   # also installs the Husky pre-commit hook
npm run dev
```

## Before you open a PR

1. Create a branch from `main`.
2. Make sure these all pass locally (CI runs the same):
   ```bash
   npm run lint
   npm run typecheck
   npm run format:check
   npm run build
   ```
3. Keep PRs small and focused — one logical change per PR.
4. Describe **what** and **why** in the PR body; screenshots for UI changes.

## Finding something to work on

- Issues labeled [`good first issue`](https://github.com/zaberhossen/OpenKhata/labels/good%20first%20issue)
  are curated entry points.
- Open an issue to discuss anything bigger before writing code.

## Reporting bugs

Use the bug report template. Always include: device, browser, whether you were
online or offline, and steps to reproduce. Offline bugs are the highest
priority — data loss reports jump the queue.

## Code style

ESLint + Prettier are enforced by the pre-commit hook and CI, so the tooling
handles style for you. Beyond that: prefer small components, keep business
logic out of JSX, and comment only what the code can't say.

## Code of Conduct

Be kind. See [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).
