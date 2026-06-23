#!/usr/bin/env sh
# Source .env.local (or .env) so Prisma CLI sees DATABASE_URL.
# Must be sourced from project root: . ./scripts/load-env.sh

set -eu

if [ -f .env.local ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env.local
  set +a
elif [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
else
  echo "error: create .env.local from .env.example (DATABASE_URL required)" >&2
  exit 1
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "error: DATABASE_URL is not set in .env.local" >&2
  exit 1
fi
