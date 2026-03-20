# Phase 30: Dockerize MySQL + Change Database Type — Plan

**Status:** Pending  
**Depends on:** Phase 29 (E2E Tests)

---

## Goal

Migrate from SQLite to MySQL; Dockerize MySQL for dev/local; production server already has MySQL but lacks the "freediving" database and migrations. Provide server setup guidance.

---

## Success Criteria

1. App uses MySQL instead of SQLite for backend persistence
2. MySQL runs in Docker for local/dev; `docker-compose` or similar for one-command dev DB
3. Migrations create and update schema (replace ad-hoc `runSchema` + inline migrations)
4. Production server: "freediving" database exists; migrations run on deploy or documented manual step
5. Server setup guide documents: create DB, run migrations, env vars (connection string)

---

## Tasks (TBD — research and task breakdown)

- [ ] Task breakdown after research

---

## Context

See `30-CONTEXT.md` for implementation decisions and server guidance.
