#!/usr/bin/env sh
# Start production stack with SCALE_TIER (powers of 2).
set -eu

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT/.env.production}"
COMPOSE_BASE="$ROOT/docker-compose.prod.yml"
COMPOSE_HA="$ROOT/docker-compose.ha.yml"

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing $ENV_FILE — copy from .env.production.example" >&2
  exit 1
fi

# shellcheck disable=SC1090
. "$ENV_FILE"

SCALE_TIER="${SCALE_TIER:-0}"

case "$SCALE_TIER" in
  0|1|2|3) ;;
  *)
    echo "SCALE_TIER must be 0–3 (got: $SCALE_TIER)" >&2
    exit 1
    ;;
esac

APP_REPLICAS=$((1 << SCALE_TIER))

COMPOSE_FILES="-f $COMPOSE_BASE -f $COMPOSE_HA"
PROFILE="single"

if [ "$SCALE_TIER" -ge 1 ]; then
  PROFILE="ha"
fi

echo "Starting fstec-prod: SCALE_TIER=$SCALE_TIER profile=$PROFILE app_replicas=$APP_REPLICAS"

# shellcheck disable=SC2086
docker compose $COMPOSE_FILES --env-file "$ENV_FILE" \
  --profile single --profile ha down --remove-orphans 2>/dev/null || true

# shellcheck disable=SC2086
exec docker compose $COMPOSE_FILES --env-file "$ENV_FILE" --profile "$PROFILE" up "$@" --scale "app=${APP_REPLICAS}"
