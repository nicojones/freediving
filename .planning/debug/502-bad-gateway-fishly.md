---
status: investigating
trigger: "Investigate issue: 502-bad-gateway-fishly"
created: 2025-03-20T00:00:00.000Z
updated: 2025-03-20T00:00:00.000Z
---

## Current Focus

hypothesis: Upstream Node app on port 3002 is down or unreachable (nginx routes correctly but app not running or bound incorrectly)
test: Examine deployment config, start scripts, bind address, systemd service
expecting: Identify why nginx gets 502 (app not running, wrong port, wrong bind)
next_action: gather initial evidence from codebase

## Symptoms

expected: Fishly freediving app loads at https://fishly.kupfer.es
actual: 502 Bad Gateway
errors: 502 Bad Gateway, nginx/1.18.0 (Ubuntu)
reproduction: Open https://fishly.kupfer.es in browser
started: Related to prior fishly-vhost issue (fishly showed nico's site). 502 may indicate routing was fixed but upstream app is not running.

## Eliminated

## Evidence

- timestamp: 2025-03-20
  checked: User requested actionable debug steps
  found: Created server-side debug checklist
  implication: User will run commands and report back

## Resolution

root_cause:
fix:
verification:
files_changed: []
