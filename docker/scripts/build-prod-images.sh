#!/usr/bin/env sh
# Bake production container images (Next.js standalone, migrate, nginx, seed deps).
#
# Usage:
#   sh docker/scripts/build-prod-images.sh
#   FSTEC_IMAGE_TAG=v1.0.0 sh docker/scripts/build-prod-images.sh
#   NO_CACHE=1 sh docker/scripts/build-prod-images.sh
#
# Env (optional, also read from .env.production):
#   FSTEC_IMAGE_REGISTRY  default localhost/fstec
#   FSTEC_IMAGE_TAG       default latest
#   NGINX_BENCH_MODE      default 0

set -eu

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT/.env.production}"

if [ -f "$ENV_FILE" ]; then
  # shellcheck disable=SC1090
  . "$ENV_FILE"
fi

FSTEC_IMAGE_REGISTRY="${FSTEC_IMAGE_REGISTRY:-localhost/fstec}"
FSTEC_IMAGE_TAG="${FSTEC_IMAGE_TAG:-latest}"
NGINX_BENCH_MODE="${NGINX_BENCH_MODE:-0}"

if command -v podman >/dev/null 2>&1; then
  ENGINE=podman
elif command -v docker >/dev/null 2>&1; then
  ENGINE=docker
else
  echo "Need podman or docker in PATH" >&2
  exit 1
fi

BUILD_FLAGS=""
if [ "${NO_CACHE:-0}" = "1" ]; then
  BUILD_FLAGS="--no-cache"
fi

APP_IMAGE="${FSTEC_IMAGE_REGISTRY}/app:${FSTEC_IMAGE_TAG}"
MIGRATE_IMAGE="${FSTEC_IMAGE_REGISTRY}/migrate:${FSTEC_IMAGE_TAG}"
NGINX_IMAGE="${FSTEC_IMAGE_REGISTRY}/nginx:${FSTEC_IMAGE_TAG}"
SEED_IMAGE="${FSTEC_IMAGE_REGISTRY}/seed:${FSTEC_IMAGE_TAG}"

echo "==> Building Next.js production image: $APP_IMAGE"
$ENGINE build $BUILD_FLAGS \
  -t "$APP_IMAGE" \
  -f "$ROOT/Dockerfile" \
  --target runner \
  "$ROOT"

echo "==> Building migrate image: $MIGRATE_IMAGE"
$ENGINE build $BUILD_FLAGS \
  -t "$MIGRATE_IMAGE" \
  -f "$ROOT/Dockerfile" \
  --target migrate \
  "$ROOT"

echo "==> Building nginx image: $NGINX_IMAGE"
$ENGINE build $BUILD_FLAGS \
  --build-arg "NGINX_BENCH_MODE=${NGINX_BENCH_MODE}" \
  -t "$NGINX_IMAGE" \
  -f "$ROOT/docker/nginx/Dockerfile" \
  "$ROOT/docker/nginx"

echo "==> Building seed image: $SEED_IMAGE"
$ENGINE build $BUILD_FLAGS \
  -t "$SEED_IMAGE" \
  -f "$ROOT/Dockerfile" \
  --target deps \
  "$ROOT"

echo ""
echo "Done. Images:"
echo "  $APP_IMAGE"
echo "  $MIGRATE_IMAGE"
echo "  $NGINX_IMAGE"
echo "  $SEED_IMAGE"
