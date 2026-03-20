#!/bin/bash
set -e
cd "$(dirname "$0")"
export NODE_ENV=production

# Load .env.production when run outside systemd (e.g. manual testing)
if [ -f .env.production ]; then
  set -a
  source .env.production
  set +a
fi

[ -f server.js ] || { echo "server.js not found. Run from deployed standalone folder." >&2; exit 1; }
exec node server.js
