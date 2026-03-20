---
status: investigating
trigger: "fishly.kupfer.es renders nico.kupfer.es instead of Fishly app"
created: 2025-03-20
updated: 2025-03-20
---

## Current Focus

hypothesis: nginx is matching fishly.kupfer.es to nico's server block (order, default_server, or server_name)
test: user runs diagnostic checklist on server
expecting: one or more checks reveal root cause
next_action: user executes checklist and reports findings

## Symptoms

expected: Visiting fishly.kupfer.es shows the Fishly freediving app (proxied to Node on port 3002)
actual: fishly.kupfer.es shows the same content as nico.kupfer.es
errors: None
reproduction: Open https://fishly.kupfer.es in browser
timeline: User added nginx server block for fishly.kupfer.es; still shows nico's site

## Context

- Fishly app: Node/Express on port 3002 (from .env.production)
- nico.kupfer.es: separate site (user's personal site)
- Both are subdomains of kupfer.es; config is in same kupfer.es nginx file
- User was given nginx server block to add with proxy_pass to 127.0.0.1:3002

## Evidence

- (pending) User will run diagnostic checklist on server and report results

## Resolution

root_cause: (pending diagnostic results)
fix: (pending)
verification: (pending)
files_changed: []

---

## Diagnostic Checklist (run on server)

Run these commands on the server where nginx and the Fishly app run. Report findings for each step.

### 1. Confirm Fishly app is listening on 3002

```bash
ss -tlnp | grep 3002
# or
netstat -tlnp | grep 3002
```

**Expected:** `*:3002` or `127.0.0.1:3002` in LISTEN state.  
**If missing:** Fishly app is not running or bound to wrong port.

---

### 2. Find which nginx config files are active

```bash
nginx -T 2>/dev/null | head -20
# or
ls -la /etc/nginx/sites-enabled/
```

**Check:** Is there a fishly-specific config or is it inside kupfer.es config?

---

### 3. Search for fishly and nico server blocks

```bash
grep -rn "server_name\|fishly\|nico" /etc/nginx/
```

**Check:** Does `fishly.kupfer.es` appear in `server_name`? Any typo (e.g. `fishy`)? Which file contains the fishly block?

---

### 4. Inspect server block order and default_server

```bash
grep -n "server_name\|default_server" /etc/nginx/sites-enabled/*
```

**Critical:** nginx uses the **first** matching `server_name`. If nico's block has `default_server` or comes before fishly and matches broadly (e.g. `*.kupfer.es`), it will win.

---

### 5. Check HTTP vs HTTPS (port 80 vs 443)

```bash
grep -B2 -A15 "listen 443\|listen 80" /etc/nginx/sites-enabled/*
```

**Check:** Is there an HTTP (80) block that redirects to HTTPS? Does the fishly block have **both** `listen 80` and `listen 443` (or `listen 443 ssl`)? If fishly only has HTTP, HTTPS requests may fall through to nico.

---

### 6. Verify fishly block has correct proxy_pass

```bash
grep -B5 -A5 "fishly" /etc/nginx/sites-enabled/*
```

**Check:** Does the fishly block have `proxy_pass http://127.0.0.1:3002;` (no trailing slash for path preservation)?

---

### 7. Test nginx config and reload

```bash
nginx -t && sudo systemctl reload nginx
```

**Check:** Any syntax errors? Was config reloaded after adding the fishly block?

---

### 8. Simulate which server block nginx would use

```bash
# Show full config nginx actually uses
nginx -T 2>/dev/null | grep -A30 "server_name.*fishly"
```

**Check:** Does the fishly block appear? Is it complete (listen, server_name, location, proxy_pass)?

---

### 9. Test locally on the server

```bash
curl -H "Host: fishly.kupfer.es" http://127.0.0.1/
curl -H "Host: fishly.kupfer.es" -k https://127.0.0.1/
```

**Interpretation:** If these return Fishly content, nginx routing is correct and the issue may be DNS or browser cache. If they return nico content, nginx is routing fishly to nico's block.

---

### 10. Check for include/conf.d overrides

```bash
ls /etc/nginx/conf.d/
cat /etc/nginx/nginx.conf | grep include
```

**Check:** Does another included config override the fishly block?

---

### Common root causes (prioritize checks)

| Cause | What to look for |
|-------|------------------|
| **default_server** | nico's block has `default_server`; fishly requests fall through |
| **Block order** | nico block appears before fishly in same file |
| **Missing HTTPS** | fishly only has `listen 80`; HTTPS (443) goes to nico |
| **server_name typo** | `fishy` instead of `fishly`, or wrong domain |
| **Config not reloaded** | Added block but never ran `nginx -s reload` |
| **Wrong file** | fishly block in disabled file or wrong sites-enabled |
