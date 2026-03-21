# Phase 31: UI Polish — Plan

**Status:** Pending  
**Depends on:** Phase 30 (Dockerize MySQL + Change Database Type)

---

## Goal

Refine UI details: bottom tabs show label only on active tab; top-right corner does not show tab name; trainings tab padding matches other tabs; developer zone in settings is more inconspicuous; after creating a plan, message says "See plans here" with link that navigates to Plans tab.

---

## Success Criteria

1. Bottom tabs: only the active tab displays its label; inactive tabs show icon only
2. Top-right corner: no need to show the tab name (remove if redundant)
3. Trainings tab: padding matches the other three tabs (Training, Plans, Settings, Create)
4. Developer zone in Settings: more inconspicuous (e.g. collapsed, subtle styling)
5. After creating a plan: message says "See plans _here_" with link that navigates to Plans tab

---

## Tasks (TBD — task breakdown)

- [ ] Task breakdown after research

---

## Context

- **Bottom tabs:** Training, Plans, Settings, Create (+) — only active tab should show label
- **Top-right:** Tab name may be redundant with bottom nav
- **Trainings tab:** Padding currently smaller than other tabs
- **Developer zone:** Test controls, dev mode — should be less prominent
- **Create plan success:** Current message says "see plans above" but Plans is another tab; add "See plans here" link that navigates to Plans tab
