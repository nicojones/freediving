# Freediving Breathhold Trainer

A PWA for training freediving breathholds. Users follow audio cues through hold/breathe intervals guided by training plans defined in JSON.

## Adding or modifying plans

Plans come from the database (seeded via migrations). Create plans via the in-app Create flow or API. No bundled JSON files.

## Development

```bash
npm install
npm run db:up   # Start MySQL (Docker)
npm run dev
```

Visit http://localhost:5173

Before committing, run `npm run format` to format code, or rely on lefthook pre-commit hooks (format + lint).

**Server setup:** See [docs/SERVER-SETUP.md](docs/SERVER-SETUP.md) for MySQL configuration on production.

## Build

```bash
npm run build
```

## E2E Tests

```bash
npm run db:up      # Start MySQL first
npm run test:e2e
```
