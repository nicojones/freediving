# Debug: Release created even when E2E tests fail

## Summary
Release (semantic-release) is created even when E2E tests fail in the main pipeline. Expected: release only after successful E2E tests.

## Symptoms
- **Expected:** Release should only happen after successful E2E tests
- **Actual:** Release is created even when E2E tests fail
- **User hypothesis:** Deployments might use "previous" commit
- **User proposal:** Main pipeline (when passing) should create semantic release; deploy pipeline should release the new version to server

## Investigation

### Current pipeline structure (`.github/workflows/deploy.yml`)
Single job, sequential steps:
1. Checkout
2. Setup Node
3. Check changed deps
4. Install dependencies (`npm ci`)
5. **Semantic Release** ← runs BEFORE any tests
6. Install Playwright
7. Lint
8. Run unit tests
9. Run E2E tests
10. Build Next.js
11. Prepare Deployment Packages
12. Upload build to Server
13. Post-deployment on VM

### Root cause (preliminary)
**Semantic release runs at step 5, before lint, unit tests, and E2E tests.** If E2E fails at step 9, the release (GitHub release + tag + package.json bump) has already been created at step 5.

### Clarification on "deploy previous commit"
When E2E fails: deploy steps (11–13) never run, so nothing is deployed. The issue is that a **release** (version tag, GitHub release) is created for code that hasn't passed E2E.

### Proposed fix
Move semantic-release to run **after** all validation (lint, unit tests, E2E tests) and **before** build/deploy. Order should be:
1. Validate (lint, unit, E2E)
2. Semantic release (creates version)
3. Build (with new version in package.json)
4. Deploy

## Status
ROOT CAUSE FIXED

## Fix applied
Moved semantic-release step to run **after** lint, unit tests, and E2E tests, and **before** build. New order:
1. Validate (lint, unit, E2E)
2. Semantic release (creates version only when all tests pass)
3. Build (with new version in package.json)
4. Deploy
