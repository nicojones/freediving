# Freediving Breathhold Trainer

A PWA for training freediving breathholds. Users follow audio cues through hold/breathe intervals guided by training plans defined in JSON.

## Adding or modifying plans

Edit JSON files in `src/data/`. Add new files (e.g. `plan-b.json`) or modify `default-plan.json`. Commit and deploy. No in-app editor.

## Development

```bash
npm install
npm run dev
```

Visit http://localhost:5173

Before committing, run `npm run format` to format code, or rely on lefthook pre-commit hooks (format + lint).

## Build

```bash
npm run build
```
