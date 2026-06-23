#!/usr/bin/env sh
set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

sh "$ROOT/scripts/dev-infra.sh"

echo "→ Applying Prisma migrations..."
# shellcheck disable=SC1091
. "$ROOT/scripts/load-env.sh"
npx prisma migrate dev

echo "→ Regenerating Prisma client..."
npx prisma generate

echo "→ Starting Next.js (Ctrl+C stops the app; containers keep running)"
exec npx next dev "$@"
