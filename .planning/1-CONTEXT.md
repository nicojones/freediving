# Phase 1: Plan Service — Context

**Created:** 2025-03-19  
**Purpose:** Implementation decisions for research and planning.  
**Phase:** 1. Plan Service

---

## Decisions

### JSON Schema

- **Plan structure:** Single array of days. Users typically stick to one plan; switching is possible but not the primary use case.
- **Day structure:** Each entry is one day. Index = day number (0-based).
- **Rest days:** `null` or `{ rest: true }`.
- **Training days:** Object with `intervals` array and optional `type` for wet vs dry.
- **No audio in JSON:** Audio cue mapping is application-level (Phase 4).
- **Format:** Up to implementation; example below.

### Plan Storage & Loading

- **Location:** `src/data/` — plans are internal for now.
- **Future:** User-submitted plans would go to DB (not v1).
- **No "month" concept:** Plan is a flat list of days, not grouped by month.

### Admin Workflow

- **Add/modify:** Git commit + deploy. Admin edits JSON in repo, redeploys.
- **Validation:** None for now.

### Plan Validation

- **Schema validation:** Not required.
- **Safety checks:** Deferred (no thresholds in Phase 1).
- **Invalid JSON:** Graceful error — surface clear message, do not crash.

### Plan Service API

- **Design:** Up to implementation. Must expose hold/breathe intervals per day for Timer Engine and downstream phases.

---

## Proposed JSON Schema (Example)

```json
[
  { "intervals": [{ "holdSeconds": 60, "recoverySeconds": 90 }, { "holdSeconds": 60, "recoverySeconds": 90 }], "type": "dry" },
  { "intervals": [{ "holdSeconds": 90, "recoverySeconds": 120 }], "type": "wet" },
  null,
  { "rest": true },
  { "intervals": [{ "holdSeconds": 75, "recoverySeconds": 100 }] }
]
```

**Conventions:**
- Index 0 = Day 1, index 1 = Day 2, etc.
- `intervals`: array of `{ holdSeconds, recoverySeconds }` — one cycle per entry.
- `type`: `"dry"` | `"wet"` — optional; default `"dry"` if omitted.
- Rest: `null` or `{ rest: true }`.

---

## Out of Scope for Phase 1

- Schema validation (e.g. JSON Schema)
- Safety thresholds (hold %, cycle count)
- User-submitted plans / DB storage
- Audio file references in plans

---

## Traceability

| Requirement | Decision |
|-------------|----------|
| PLAN-01 | Load from `src/data/`, parse array of days, expose intervals |
| ADMN-01 | Admin edits JSON in repo, git commit, deploy |

---

*Context captured from /gsd-discuss-phase 1*
