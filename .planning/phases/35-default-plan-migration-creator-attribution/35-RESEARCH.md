# Phase 35: Default Plan Migration + Creator Attribution — Research

**Researched:** 2025-03-21  
**Domain:** DB migrations (MySQL), schema evolution, creator attribution, PWA offline  
**Confidence:** HIGH

---

## Standard Stack — libraries/tools to use

| Library/Tool           | Version    | Purpose                                                                  |
| ---------------------- | ---------- | ------------------------------------------------------------------------ |
| mysql2                 | ^3.20.0    | MySQL driver; migrations via raw SQL                                     |
| Next.js Route Handlers | 15.x       | `/api/plans` GET/POST                                                    |
| Tailwind CSS           | 4.x        | Creator attribution styling (`text-on-surface-variant text-sm`)          |
| zod                    | ^4.3.6     | Extend `planWithMetaSchema` for `public`, `published_on`, `creator_name` |
| clsx                   | ^2.1.1     | Conditional classes for creator attribution                              |
| idb                    | (existing) | IndexedDB for offline queue; not for plan caching                        |

**Migration runner:** `lib/migrate.ts` — reads `migrations/*.sql`, runs statements, tracks in `schema_migrations`. No new packages.

**MySQL for seeding:** Use `INSERT IGNORE` — skips duplicate primary key; idempotent. Avoid "check then insert" (race conditions, ~47% slower). Prefer single-statement operations.

---

## Architecture Patterns — task structure

### Migration file structure

```
migrations/
├── 001_initial.sql
├── 002_magic_link.sql
└── 003_default_plan_and_public.sql   # ALTER + seed in one file
```

### Pattern 1: Schema evolution (ALTER TABLE)

- Add `public BOOLEAN DEFAULT false` and `published_on DATE NULL` to plans.
- Use `DEFAULT` so existing rows get `false`; new user-created plans default private.
- MySQL: `ALTER TABLE plans ADD COLUMN public BOOLEAN DEFAULT false;` and `ALTER TABLE plans ADD COLUMN published_on DATE NULL;`
- For large tables: test in staging; consider `ALGORITHM=INPLACE` if supported. Plans table is small.

### Pattern 2: Seed JSON via migration (idempotent)

- Embed `days_json` in SQL; escape single quotes (`'` → `''`).
- Use `INSERT IGNORE` so re-running migration does not fail.
- Default plan: `id='default'`, `created_by=NULL`, `public=TRUE`, `published_on=CURDATE()`.
- `created_at`: `UNIX_TIMESTAMP() * 1000` (ms) or fixed value.

### Pattern 3: Creator attribution API

- **JOIN users:** `LEFT JOIN users u ON p.created_by = u.id`
- **Return shape:** `creator_name` (string) — never `email`.
- **Logic:** `created_by IS NULL` → `creator_name = 'Fishly'`; else `COALESCE(u.name, u.username)`.
- **Users table:** If `name` column missing, add `name VARCHAR(255) NULL` in 003; or use `COALESCE(u.name, u.username)` and fall back to username.

### Pattern 4: Response shape

- **Flat:** `{ id, name, description, days, created_by, public, published_on, creator_name }` — preferred.
- **Nested:** `{ creator: { name } }` — avoid; adds nesting without benefit.
- API never returns `email` in plan or creator payloads.

### Pattern 5: Frontend creator display

- **Where:** PlanSelectorSection, DayListSection, SessionPreviewSection.
- **Condition:** Only when `plan.public === true`.
- **Style:** `text-on-surface-variant text-sm font-normal` (small, greyed).
- **Text:** "Created by Fishly" (no owner) or "Created by {creator_name}" (never email).

### Pattern 6: Offline / PWA

- **Current:** Bundled default-plan works offline; plans merged from `getBundledPlans()` + API.
- **After migration:** All plans from API; no bundled fallback.
- **Accepted trade-off:** Offline user sees "No plans available" — CONTEXT locks "all plans from DB".
- **Optional future:** Cache plans in IndexedDB when fetched; serve from cache when offline. Out of scope for Phase 35.

---

## Don't Hand-Roll — what NOT to build custom

| Problem                 | Don't build                         | Use instead                                                      |
| ----------------------- | ----------------------------------- | ---------------------------------------------------------------- |
| Seed idempotency        | Custom "SELECT then INSERT"         | `INSERT IGNORE`                                                  |
| Creator name resolution | Client-side user lookup             | Server `LEFT JOIN users` + `creator_name` in response            |
| Large JSON in migration | Runtime `readFileSync` in migration | Embed JSON in SQL (escape quotes) — migrate.ts runs raw SQL only |
| Offline default plan    | Custom plan cache / precache        | Accept: offline = no plans                                       |
| Email for attribution   | Any user email in API               | Never return email; use `name` or `username`                     |
| Schema evolution        | Ad-hoc ALTER scripts                | Versioned migration files in `migrations/`                       |

---

## Common Pitfalls — verification checks

### 1. Email exposure in API

- **Symptom:** Plan or creator response includes `email`.
- **Check:** Grep `SELECT *` from users in plans route; ensure only `id, username, name` (or `COALESCE(name, username)`) selected.
- **Fix:** Explicit column list; never `email`.

### 2. Creator text for private plans

- **Symptom:** "Created by you" or creator text for private plans.
- **Check:** `plan.public === true` before rendering creator attribution.
- **Fix:** Conditional: `{plan.public && (...)}`

### 3. Default plan has wrong creator

- **Symptom:** Default plan shows "Created by {username}" instead of "Created by Fishly".
- **Check:** Migration seed uses `created_by = NULL`; API maps null → `creator_name: 'Fishly'`.
- **Fix:** `CASE WHEN p.created_by IS NULL THEN 'Fishly' ELSE ... END`

### 4. Users table missing `name`

- **Symptom:** `creator_name` is NULL for plans with owner.
- **Check:** `users` has `name` column or use `COALESCE(u.name, u.username)`.
- **Fix:** Add `name VARCHAR(255) NULL` in 003 if not present.

### 5. Offline regression

- **Symptom:** User offline sees "No plans available" (previously bundled default worked).
- **Check:** Document as accepted trade-off; no cache of default plan.
- **Fix:** N/A — explicit decision per CONTEXT.

### 6. BUNDLED_PLAN_IDS semantics

- **Current:** `['default']` — delete guard, `isUserCreated` check.
- **After migration:** "default" is in DB; constant still needed for reserved IDs (non-deletable, non-creatable).
- **Check:** Rename to `RESERVED_PLAN_IDS` optional; keep semantics.

---

## Code Examples — patterns to reference

### Migration: ALTER + seed

```sql
-- Add public flag and published_on date
ALTER TABLE plans ADD COLUMN public BOOLEAN DEFAULT false;
ALTER TABLE plans ADD COLUMN published_on DATE NULL;

-- Seed default plan (idempotent)
INSERT IGNORE INTO plans (id, name, description, days_json, created_at, created_by, public, published_on)
VALUES (
  'default',
  '4:00 Dry Breathhold',
  'A structured 21-day dry training plan focusing on CO2 tolerance and O2 efficiency to achieve a 4-minute static apnea breath hold.',
  '[{"id":"d1","day":1,"group":"Week 1: CO2 Tolerance","phases":[...],"type":"dry"},...]',
  UNIX_TIMESTAMP() * 1000,
  NULL,
  TRUE,
  CURDATE()
);
```

### API: Plans with creator_name

```typescript
const [rows] = await connection.execute(
  `SELECT p.id, p.name, p.description, p.days_json, p.created_by, p.public, p.published_on,
    CASE WHEN p.created_by IS NULL THEN 'Fishly' ELSE COALESCE(u.name, u.username) END AS creator_name
   FROM plans p
   LEFT JOIN users u ON p.created_by = u.id
   ORDER BY p.created_at DESC`
);
```

### Frontend: Creator attribution (PlanSelectorSection, DayListSection, SessionPreviewSection)

```tsx
{
  plan.public && (
    <span className="text-on-surface-variant text-sm font-normal">
      Created by {plan.creator_name ?? 'Fishly'}
    </span>
  );
}
```

### planService: Remove bundled plans

```typescript
// Remove: import defaultPlanData from '../data/default-plan.json'
// Remove: planModules, getBundledPlans()
// Change: getAvailablePlans(plans?) → return plans ?? [] (from context only)
// Change: TrainingContext → fetchPlansFromApi() only; no merge with bundled
```

### lib/plan.ts: Remove file fallback

```typescript
// Remove: existsSync(filePath), readFileSync fallback to default-plan.json
// Load only from DB; throw if not found (no fallback)
```

---

## RESEARCH COMPLETE
