#!/usr/bin/env sh
set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! command -v docker >/dev/null 2>&1; then
  echo "error: docker is required (install Docker and ensure the daemon is running)" >&2
  exit 1
fi

ENV_FILE_FLAG=""
if [ -f .env.local ]; then
  ENV_FILE_FLAG="--env-file .env.local"
elif [ -f .env ]; then
  ENV_FILE_FLAG="--env-file .env"
fi

echo "→ Starting Postgres and MinIO..."
# shellcheck disable=SC2086
docker compose $ENV_FILE_FLAG up -d --wait db minio

echo "→ Ensuring MinIO bucket and CORS..."
# shellcheck disable=SC2086
if ! docker compose $ENV_FILE_FLAG run --rm minio-init; then
  echo "warning: minio-init failed (bucket may already exist; check CORS if uploads break)" >&2
fi

echo "→ Infra ready (Postgres :${POSTGRES_PORT:-5433}, MinIO :${S3_PORT:-9000})"
