# Phase 15: Refactor Code (Cleanup) — Context

**Created:** 2025-03-20  
**Purpose:** Remove all unused code. Keep Plan and Context concise.  
**Phase:** 15. Refactor Code (Cleanup)

---

## Principles

1. **ESLint** — Flat config (`eslint.config.mjs`); `@typescript-eslint/no-unused-vars` and unused-imports enabled.
2. **Curly braces** — All `if` statements use curly braces (`curly: ['error', 'all']`).
3. **Zero unused code** — No unused variables, functions, imports, exports, or types.
4. **Concise docs** — Plan and Context stay short; no lengthy task breakdowns.

---

## Scope

- **In scope:** ESLint setup, curly braces for all `if`, remove dead code across `src/**`, `app/**`, `lib/**`
- **Out of scope:** New features, component splits, performance work

---

## Decisions

| Decision | Outcome |
|----------|---------|
| ESLint config | Flat config (`eslint.config.mjs`); migrate from `next lint` to `eslint .` |
| Curly braces | All `if` use `{ }` — no single-line `if (x) return` |
| Unused vars/functions | Remove or prefix with `_` if intentionally unused |
| Unused imports | Remove |
| Unused exports | Remove or make internal |
| Dead components | Remove if not referenced |
