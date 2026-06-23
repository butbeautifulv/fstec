#!/usr/bin/env sh
set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

sh "$ROOT/scripts/dev-infra.sh"

echo "→ Starting Next.js (Ctrl+C stops the app; containers keep running)"
exec npx next dev "$@"
