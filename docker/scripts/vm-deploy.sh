#!/usr/bin/env sh
# Deploy FSTEC on a VM with Podman Compose (single-node, SCALE_TIER=0).
#
# First-time setup on VM:
#   git clone … && cd fstec
#   cp .env.production.example .env.production   # edit secrets + VM_DOMAIN
#   sh docker/scripts/vm-deploy.sh --build
#
# Re-deploy after code pull:
#   git pull && sh docker/scripts/vm-deploy.sh --build
#
# Options:
#   --build       Bake images before up (default if images missing)
#   --no-build    Use existing local images only
#   --seed        Run DB seed after migrate (profile seed-single)
#   --down        Stop and remove stack
#   --pull        git pull before build (repo root only)
#   -d            Detached mode (default)
#
# Env file: .env.production (override with ENV_FILE=…)
# Recommended .env.production keys for VM:
#   SCALE_TIER=0
#   VM_DOMAIN=app.example.com
#   FSTEC_IMAGE_REGISTRY=localhost/fstec
#   FSTEC_IMAGE_TAG=latest
#   HTTPS_PORT=8443
#   HTTP_PORT=8080

set -eu

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT/.env.production}"
COMPOSE_BASE="$ROOT/docker-compose.prod.yml"
COMPOSE_HA="$ROOT/docker-compose.ha.yml"
COMPOSE_VM="$ROOT/docker-compose.vm.yml"

DO_BUILD=""
FORCE_NO_BUILD=0
DO_SEED=0
DO_DOWN=0
DO_PULL=0
DETACH="-d"

while [ $# -gt 0 ]; do
  case "$1" in
    --build) DO_BUILD=1 ;;
    --no-build) FORCE_NO_BUILD=1 ;;
    --seed) DO_SEED=1 ;;
    --down) DO_DOWN=1 ;;
    --pull) DO_PULL=1 ;;
    -d) DETACH="-d" ;;
    -f|--foreground) DETACH="" ;;
    -h|--help)
      sed -n '2,28p' "$0"
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      exit 1
      ;;
  esac
  shift
done

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing $ENV_FILE — copy from .env.production.example and set secrets." >&2
  exit 1
fi

# shellcheck disable=SC1090
. "$ENV_FILE"

SCALE_TIER="${SCALE_TIER:-0}"
if [ "$SCALE_TIER" != "0" ]; then
  echo "vm-deploy.sh is for single-node VMs (SCALE_TIER=0). For HA use prod-scale.sh." >&2
  exit 1
fi

if command -v podman >/dev/null 2>&1; then
  ENGINE=podman
elif command -v docker >/dev/null 2>&1; then
  ENGINE=docker
  echo "Warning: using docker; VM target is podman." >&2
else
  echo "Need podman compose (install podman-compose or podman 4.1+)." >&2
  exit 1
fi

if ! $ENGINE compose version >/dev/null 2>&1; then
  echo "$ENGINE compose is not available." >&2
  exit 1
fi

FSTEC_IMAGE_REGISTRY="${FSTEC_IMAGE_REGISTRY:-localhost/fstec}"
FSTEC_IMAGE_TAG="${FSTEC_IMAGE_TAG:-latest}"
APP_IMAGE="${FSTEC_IMAGE_REGISTRY}/app:${FSTEC_IMAGE_TAG}"

COMPOSE_FILES="-f $COMPOSE_BASE -f $COMPOSE_HA -f $COMPOSE_VM"
COMPOSE_CMD="$ENGINE compose $COMPOSE_FILES --env-file $ENV_FILE --profile single"

if [ "$DO_DOWN" = "1" ]; then
  echo "Stopping fstec stack…"
  # shellcheck disable=SC2086
  $COMPOSE_CMD down --remove-orphans
  exit 0
fi

if [ "$DO_PULL" = "1" ]; then
  if [ -d "$ROOT/.git" ]; then
    echo "==> git pull"
    git -C "$ROOT" pull --ff-only
  else
    echo "Not a git repo — skipping --pull" >&2
  fi
fi

# TLS certs for nginx (self-signed if not provided)
CERT_CN="${VM_DOMAIN:-${CERT_CN:-localhost}}"
export CERT_CN
sh "$ROOT/docker/scripts/generate-dev-certs.sh"

images_missing=0
if ! $ENGINE image inspect "$APP_IMAGE" >/dev/null 2>&1; then
  images_missing=1
fi

if [ "$FORCE_NO_BUILD" = "0" ]; then
  if [ "$DO_BUILD" = "1" ] || [ "$images_missing" = "1" ]; then
    echo "==> Baking production images…"
    ENV_FILE="$ENV_FILE" sh "$ROOT/docker/scripts/build-prod-images.sh"
  fi
elif [ "$images_missing" = "1" ]; then
  echo "Image $APP_IMAGE not found. Run with --build or build-prod-images.sh first." >&2
  exit 1
fi

echo "==> Starting stack (profile=single, app_replicas=1)…"
# shellcheck disable=SC2086
$COMPOSE_CMD down --remove-orphans 2>/dev/null || true
# shellcheck disable=SC2086
$COMPOSE_CMD up $DETACH --scale "app=1" --no-build

if [ "$DO_SEED" = "1" ]; then
  echo "==> Seeding database…"
  # shellcheck disable=SC2086
  $COMPOSE_CMD --profile seed-single run --rm seed
fi

HTTPS_PORT="${HTTPS_PORT:-8443}"
HTTP_PORT="${HTTP_PORT:-8080}"

echo ""
echo "Deploy complete."
echo "  HTTPS: https://${VM_DOMAIN:-localhost}:${HTTPS_PORT}"
echo "  HTTP:  http://${VM_DOMAIN:-localhost}:${HTTP_PORT}  (redirects to HTTPS)"
echo ""
echo "Logs:    $ENGINE compose $COMPOSE_FILES --env-file $ENV_FILE --profile single logs -f app nginx"
echo "Stop:    sh docker/scripts/vm-deploy.sh --down"
