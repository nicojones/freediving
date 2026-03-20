# Phase 13: Deployment — Research

## Stack

- **Repo:** GitHub
- **Server:** DigitalOcean (VM)
- **App:** Vite (frontend) + Express (backend)
- **Deploy:** GitHub Actions → SCP → SSH post-deploy

## Reference: Geonaut Workflow

- Next.js app; build → .next + public
- Zips: build.zip (always), modules.zip (only when package.json/lock changed)
- SCP to /var/www/geonaut/nextjs
- Post-deploy: unzip, restart systemctl geonaut.service

## Freediving Differences

| Geonaut         | Freediving                      |
| --------------- | ------------------------------- |
| Next.js         | Vite + Express                  |
| .next + public  | dist/ (Vite) + server/          |
| Single process  | Node server serves API + static |
| next.config.mjs | vite.config.ts                  |

## Deployment Artifacts

1. **dist/** — Vite build output (frontend)
2. **server/** — Express API + routes
3. **package.json**, **package-lock.json**
4. **node_modules** — conditional (when deps change)
5. **.env.production** — server-side only (secrets on VM)
6. **start_freediving.sh** — production start script

## Server Production Requirements

- Serve static files from `dist/` for SPA (fallback to index.html for client routing)
- CORS: configurable origin (e.g. `CORS_ORIGIN` env)
- Env: `NODE_ENV=production`, `FREEDIVING_DB_PATH`, `SESSION_SECRET`, `USER_PASSWORD_*`, `PORT`

## GitHub Secrets

- `SSH_HOST` — DigitalOcean droplet IP/hostname
- `SSH_USER` — deploy user (e.g. root or deploy)
- `SSH_PRIVATE_KEY` — SSH key for deploy
