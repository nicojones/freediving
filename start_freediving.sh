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

# Use full path for node when run under systemd (minimal PATH; exit 127 = command not found)
NODE="$(command -v node 2>/dev/null)" || true
[ -n "$NODE" ] || NODE="/usr/bin/node"
[ -x "$NODE" ] || NODE="/usr/local/bin/node"
[ -x "$NODE" ] || { echo "node not found. Install node or add its path to PATH." >&2; exit 127; }
exec "$NODE" server.js
