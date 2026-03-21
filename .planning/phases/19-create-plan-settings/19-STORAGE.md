# Phase 19: Plan Storage — Pros/Cons & Decision

**Created:** 2025-03-20  
**Context:** User-created plans in Settings

---

## Options

### 1. Database (SQLite)

**Pros:**

- No deploy needed to add new plans — users create at runtime
- Per-user plans possible (future: `user_id` column)
- Centralized storage; works with existing auth
- Survives app restarts; no static file deployment

**Cons:**

- Requires schema migration for new columns
- Backups must include DB file

### 2. Public/Static (JSON in `src/data` or `public/`)

**Pros:**

- Simpler: no backend change for plan creation
- Bundled plans work offline (PWA)
- Version-controlled with code

**Cons:**

- Adding a plan requires deploy
- No per-user isolation
- Not suitable for user-created content

---

## Decision

**DB for user-created plans; bundled plans remain in `src/data`.**

- Bundled plans (`default-plan.json`, `minimal-plan.json`) stay in `src/data` — loaded at build time, work offline
- User-created plans stored in `plans` table — created via Settings JSON upload, fetched from `/api/plans` when logged in
- `getAvailablePlans` merges bundled + DB plans; bundled plans appear first
